import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const UEX_BASE = 'https://api.uexcorp.space/2.0';
const FSIS_CODE_BY_NAME = {
  'recycled material composite': 'RMC',
  'construction materials': 'CMR',
  'scrap': 'CMS',
};
const SALVAGE_NAMES = Object.keys(FSIS_CODE_BY_NAME);
const SALVAGE_CODES = new Set(['RMC', 'CMR', 'CMS']);

function bool(v) {
  return v === true || v === 1 || v === '1';
}

function ts(value) {
  return value ? new Date(value * 1000).toISOString() : null;
}

function normalizeCode(row, commodity) {
  const name = String(row?.commodity_name || commodity?.name || '').trim().toLowerCase();
  return FSIS_CODE_BY_NAME[name] || String(row?.commodity_code || commodity?.code || '').trim().toUpperCase();
}

// Write the fresh sync first, then bulk-remove all rows from prior syncs.
// This avoids the slow row-by-row delete that used to time out mid-run and
// leave the market cache empty or partial.
async function bulkReplace(entity, records, syncedAt) {
  for (let i = 0; i < records.length; i += 250) {
    await entity.bulkCreate(records.slice(i, i + 250));
  }
  await entity.deleteMany({ synced_at: { $ne: syncedAt } });
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me().catch(() => null);
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const fetchUex = async (resource) => {
      const res = await fetch(`${UEX_BASE}/${resource}`);
      if (!res.ok) throw new Error(`UEX /${resource} failed: ${res.status}`);
      const json = await res.json();
      if (json.status && json.status !== 'ok') throw new Error(`UEX /${resource} returned ${json.status}`);
      return json.data || [];
    };

    let payload = {};
    try { payload = await req.json(); } catch { payload = {}; }

    const now = new Date().toISOString();
    const svc = base44.asServiceRole.entities;

    const [versions, commodities, terminals, allPrices, products] = await Promise.all([
      fetchUex('game_versions').catch(() => ({})),
      fetchUex('commodities'),
      fetchUex('terminals'),
      fetchUex('commodities_prices_all'),
      svc.product.list(null, 500),
    ]);

    const patchVersion = versions?.live || versions?.version || 'unknown';
    const commoditiesById = new Map(commodities.map((c) => [Number(c.id), c]));
    const terminalsById = new Map(terminals.map((t) => [Number(t.id), t]));

    const bestByCode = {};
    const priceRecords = [];
    for (const p of allPrices) {
      const commodity = commoditiesById.get(Number(p.id_commodity));
      const terminal = terminalsById.get(Number(p.id_terminal));
      const code = normalizeCode(p, commodity);
      if (!code) continue;
      if (!((p.price_sell || 0) > 0 || (p.price_buy || 0) > 0)) continue;

      const record = {
        commodity_name: p.commodity_name || commodity?.name || code,
        commodity_code: code,
        uex_commodity_code: String(p.commodity_code || commodity?.code || code).toUpperCase(),
        uex_commodity_id: String(p.id_commodity || commodity?.id || ''),
        uex_terminal_id: String(p.id_terminal || terminal?.id || ''),
        is_salvage_output: SALVAGE_CODES.has(code),
        terminal_name: p.terminal_name || terminal?.displayname || terminal?.name || '',
        terminal_code: p.terminal_code || terminal?.code || '',
        star_system: terminal?.star_system_name || null,
        planet: terminal?.planet_name || null,
        orbit: terminal?.orbit_name || null,
        price_sell: p.price_sell || 0,
        price_sell_avg: p.price_sell_avg || 0,
        price_buy: p.price_buy || 0,
        price_buy_avg: p.price_buy_avg || 0,
        scu_buy: p.scu_buy || 0,
        scu_buy_avg: p.scu_buy_avg || 0,
        scu_sell_stock: p.scu_sell_stock || 0,
        scu_sell_stock_avg: p.scu_sell_stock_avg || 0,
        scu_sell: p.scu_sell || 0,
        scu_sell_avg: p.scu_sell_avg || 0,
        status_buy: p.status_buy ?? null,
        status_sell: p.status_sell ?? null,
        container_sizes: p.container_sizes || null,
        quality: p.quality ?? null,
        is_best_sell: false,
        uex_updated_at: ts(p.date_modified),
        confidence: p.quality != null ? String(p.quality) : null,
        patch_version: patchVersion,
        synced_at: now,
      };

      priceRecords.push(record);
      if (record.price_sell > 0 && (!bestByCode[code] || record.price_sell > bestByCode[code].price_sell)) {
        bestByCode[code] = record;
      }
    }

    priceRecords.forEach((record) => {
      const best = bestByCode[record.commodity_code];
      record.is_best_sell = Boolean(best && record.price_sell === best.price_sell && record.terminal_name === best.terminal_name);
    });

    const salvageBestTerminals = new Set(
      Object.values(bestByCode)
        .filter((r) => r.is_salvage_output)
        .map((r) => r.uex_terminal_id)
    );

    const terminalRecords = terminals
      .filter((t) => bool(t.is_visible) || bool(t.is_available) || bool(t.is_available_live))
      .map((t) => ({
        uex_terminal_id: String(t.id),
        terminal_name: t.displayname || t.fullname || t.name,
        terminal_code: t.code || '',
        terminal_type: t.type || '',
        star_system: t.star_system_name || null,
        planet: t.planet_name || null,
        orbit: t.orbit_name || null,
        moon: t.moon_name || null,
        city: t.city_name || null,
        space_station: t.space_station_name || null,
        outpost: t.outpost_name || null,
        company: t.company_name || null,
        faction: t.faction_name || null,
        is_salvage_relevant: salvageBestTerminals.has(String(t.id)),
        is_available: bool(t.is_available_live) || bool(t.is_available),
        is_refinery: bool(t.is_refinery),
        is_cargo_center: bool(t.is_cargo_center),
        is_refuel: bool(t.is_refuel),
        is_repair: bool(t.is_repair),
        has_loading_dock: bool(t.has_loading_dock),
        has_docking_port: bool(t.has_docking_port),
        has_freight_elevator: bool(t.has_freight_elevator),
        max_container_size: t.max_container_size || 0,
        game_version: t.game_version || patchVersion,
        synced_at: now,
      }));

    const salvageCommodities = commodities.filter((c) => SALVAGE_NAMES.includes(String(c.name || '').toLowerCase()));
    const routeRecords = [];
    for (const c of salvageCommodities) {
      const data = await fetchUex(`commodities_routes?id_commodity=${c.id}`).catch(() => []);
      data
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 75)
        .forEach((r) => {
          routeRecords.push({
            commodity_code: normalizeCode(r, c),
            commodity_name: r.commodity_name || c.name,
            uex_commodity_id: String(r.id_commodity || c.id),
            uex_route_id: String(r.id || ''),
            origin_system: r.origin_star_system_name || '',
            origin_planet: r.origin_planet_name || '',
            origin_terminal: r.origin_terminal_name || '',
            origin_terminal_code: r.origin_terminal_code || '',
            destination_system: r.destination_star_system_name || '',
            destination_planet: r.destination_planet_name || '',
            destination_terminal: r.destination_terminal_name || '',
            destination_terminal_code: r.destination_terminal_code || '',
            price_origin: r.price_origin || 0,
            price_destination_sell: r.price_destination || 0,
            profit_per_scu: r.price_margin || 0,
            profit_total: r.profit || 0,
            roi_percent: r.price_roi || 0,
            scu_origin: r.scu_origin || 0,
            scu_destination: r.scu_destination || 0,
            scu_reachable: r.scu_reachable || 0,
            distance: r.distance || 0,
            score: r.score || 0,
            origin_has_freight_elevator: bool(r.has_freight_elevator_origin),
            destination_has_freight_elevator: bool(r.has_freight_elevator_destination),
            origin_has_refuel: bool(r.has_refuel_origin),
            destination_has_refuel: bool(r.has_refuel_destination),
            origin_is_ground: bool(r.is_on_ground_origin),
            destination_is_ground: bool(r.is_on_ground_destination),
            patch_version: r.game_version_destination || r.game_version_origin || patchVersion,
            synced_at: now,
          });
        });
    }

    if (payload.dry_run) {
      return Response.json({
        status: 'success',
        dry_run: true,
        summary: {
          commodity_prices: priceRecords.length,
          commodities: Object.keys(bestByCode).length,
          terminals: terminalRecords.length,
          salvage_routes: routeRecords.length,
          patch_version: patchVersion,
          synced_at: now,
        },
      });
    }

    await bulkReplace(svc.commodity_price, priceRecords, now);
    await bulkReplace(svc.terminal, terminalRecords, now);
    await bulkReplace(svc.route, routeRecords, now);

    const productCodes = new Set(products.map((p) => String(p.code || '').toUpperCase()).filter(Boolean));
    const snapshotCodes = new Set([...SALVAGE_CODES, ...productCodes]);
    const snapshots = Object.entries(bestByCode)
      .filter(([code]) => snapshotCodes.has(code))
      .map(([code, best]) => {
        const rows = priceRecords.filter((p) => p.commodity_code === code && p.price_sell > 0);
        const avg = rows.reduce((s, p) => s + p.price_sell, 0) / Math.max(rows.length, 1);
        return {
          commodity_code: code,
          best_sell: best.price_sell,
          avg_sell: Math.round(avg * 100) / 100,
          best_terminal: best.terminal_name,
          patch_version: patchVersion,
          captured_at: now,
        };
      });
    if (snapshots.length) await svc.price_snapshot.bulkCreate(snapshots);

    await svc.ops_log.create({
      action: 'uex.sync_completed',
      entity_type: 'integration',
      entity_name: 'UEX Market Feed',
      actor: 'FSIS.bot',
      after: {
        commodity_prices: priceRecords.length,
        terminals: terminalRecords.length,
        routes: routeRecords.length,
        patch_version: patchVersion,
      },
      notes: `Synced UEX commodities_prices_all, terminals, and salvage routes at ${now}`,
    }).catch(() => {});

    return Response.json({
      status: 'success',
      summary: {
        commodity_prices: priceRecords.length,
        commodities: Object.keys(bestByCode).length,
        terminals: terminalRecords.length,
        salvage_routes: routeRecords.length,
        snapshots: snapshots.length,
        patch_version: patchVersion,
        synced_at: now,
      },
    });
  } catch (error) {
    console.error('UEX sync error:', error);
    return Response.json({ status: 'error', error: error.message }, { status: 500 });
  }
});