import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const UEX_BASE = 'https://api.uexcorp.space/2.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Admin-only (scheduled automation runs with admin context)
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const now = new Date().toISOString();

    // Patch version (public endpoint)
    let patchVersion = 'unknown';
    const gvRes = await fetch(`${UEX_BASE}/game_versions`);
    if (gvRes.ok) {
      const gv = await gvRes.json();
      patchVersion = gv?.data?.live || 'unknown';
    }

    // Find salvage commodities from the public commodities index
    const comRes = await fetch(`${UEX_BASE}/commodities`);
    if (!comRes.ok) throw new Error(`UEX /commodities failed: ${comRes.status}`);
    const comData = await comRes.json();
    const SALVAGE_NAMES = ['recycled material composite', 'construction materials', 'scrap'];
    const salvage = (comData?.data || []).filter(
      (c) => SALVAGE_NAMES.includes((c.name || '').toLowerCase()) && c.is_raw === 0 && c.is_available === 1
    );
    if (salvage.length === 0) throw new Error('No salvage commodities returned by UEX');

    // Fetch live prices per salvage commodity
    const priceRecords = [];
    const bestByCode = {};

    for (const c of salvage) {
      const pRes = await fetch(`${UEX_BASE}/commodities_prices?id_commodity=${c.id}`);
      if (!pRes.ok) {
        console.log(`Prices fetch failed for ${c.code}: ${pRes.status}`);
        continue;
      }
      const pData = await pRes.json();
      (pData?.data || []).forEach((p) => {
        if (!p.price_sell || p.price_sell <= 0) return;
        const record = {
          commodity_name: c.name,
          commodity_code: c.code,
          is_salvage_output: true,
          terminal_name: p.terminal_name,
          terminal_code: p.terminal_code || p.terminal_slug || null,
          star_system: p.star_system_name || null,
          price_sell: p.price_sell,
          price_buy: p.price_buy || null,
          is_best_sell: false,
          uex_updated_at: p.date_modified ? new Date(p.date_modified * 1000).toISOString() : null,
          confidence: null,
          patch_version: patchVersion,
          synced_at: now,
        };
        priceRecords.push(record);
        if (!bestByCode[c.code] || record.price_sell > bestByCode[c.code].price_sell) {
          bestByCode[c.code] = record;
        }
      });
    }

    if (priceRecords.length === 0) throw new Error('UEX returned no sell prices for salvage commodities');

    // Mark best sell terminal per commodity
    priceRecords.forEach((r) => {
      const best = bestByCode[r.commodity_code];
      if (best && r.terminal_name === best.terminal_name && r.price_sell === best.price_sell) {
        r.is_best_sell = true;
      }
    });

    // Replace cached prices
    const existing = await base44.asServiceRole.entities.commodity_price.list(null, 1000);
    for (const e of existing) {
      await base44.asServiceRole.entities.commodity_price.delete(e.id);
    }
    await base44.asServiceRole.entities.commodity_price.bulkCreate(priceRecords);

    // Append history snapshots for trend lines
    const snapshots = Object.entries(bestByCode).map(([code, best]) => {
      const all = priceRecords.filter((p) => p.commodity_code === code);
      const avg = all.reduce((s, p) => s + p.price_sell, 0) / all.length;
      return {
        commodity_code: code,
        best_sell: best.price_sell,
        avg_sell: Math.round(avg * 100) / 100,
        best_terminal: best.terminal_name,
        patch_version: patchVersion,
        captured_at: now,
      };
    });
    await base44.asServiceRole.entities.price_snapshot.bulkCreate(snapshots);

    return Response.json({
      status: 'success',
      summary: {
        commodities: Object.keys(bestByCode),
        prices_synced: priceRecords.length,
        patch_version: patchVersion,
        synced_at: now,
      },
    });
  } catch (error) {
    console.error('UEX sync error:', error);
    return Response.json({ status: 'error', error: error.message }, { status: 500 });
  }
});