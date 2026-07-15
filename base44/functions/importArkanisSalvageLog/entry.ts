import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// Flexible key detection across Arkanis log format versions
const SHIP_KEYS = ['ship', 'ship_name', 'vessel', 'vehicle', 'craft'];
const NAME_KEYS = ['name', 'item_name', 'commodity', 'material', 'cargo', 'resource', 'item'];
const QTY_KEYS = ['scu', 'quantity', 'qty', 'amount', 'count', 'units', 'volume'];
const LOC_KEYS = ['location', 'zone', 'area', 'system', 'where', 'site'];
const SESSION_KEYS = ['session', 'session_id', 'session_name', 'run', 'sortie'];
const HULL_KEYS = ['hulls', 'hulls_scraped', 'wrecks', 'wrecks_processed', 'targets'];
const TIME_KEYS = ['timestamp', 'time', 'date', 'logged_at', 'created'];

function pick(obj, keys) {
  for (const k of Object.keys(obj)) {
    if (keys.includes(k.toLowerCase().trim().replace(/[\s-]+/g, '_'))) {
      const v = obj[k];
      if (v !== undefined && v !== null && v !== '') return v;
    }
  }
  return undefined;
}

// Map a cargo/commodity name to a salvage_session SCU bucket
function bucketFor(name) {
  const n = String(name || '').toLowerCase();
  if (/rmc|recycled material/.test(n)) return 'rmc_scu';
  if (/cmr|reclaimed/.test(n)) return 'cmr_scu';
  if (/cms|salvaged/.test(n)) return 'cms_scu';
  if (/construction material/.test(n)) return 'cmr_scu';
  return null;
}

function parseCsvLine(line) {
  const cells = [];
  let cur = '';
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === ',' && !inQuotes) { cells.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

function findEntriesArray(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const preferred = ['sessions', 'entries', 'log', 'logs', 'cargo', 'items', 'data', 'events', 'runs'];
    for (const key of Object.keys(data)) {
      if (preferred.includes(key.toLowerCase()) && Array.isArray(data[key]) && data[key].length && typeof data[key][0] === 'object') {
        return data[key];
      }
    }
    for (const value of Object.values(data)) {
      if (Array.isArray(value) && value.length && typeof value[0] === 'object') return value;
      if (value && typeof value === 'object') {
        const nested = findEntriesArray(value);
        if (nested) return nested;
      }
    }
  }
  return null;
}

// Group raw log entries into proposed salvage sessions.
// Grouping key: explicit session id if present, else ship + calendar day.
function buildSessions(entries) {
  const sessions = new Map();
  for (const raw of entries) {
    if (!raw || typeof raw !== 'object') continue;
    const ship = String(pick(raw, SHIP_KEYS) || '').trim();
    const sessionId = String(pick(raw, SESSION_KEYS) || '').trim();
    const location = String(pick(raw, LOC_KEYS) || '').trim();
    const timeRaw = pick(raw, TIME_KEYS);
    const day = timeRaw ? String(timeRaw).slice(0, 10) : '';
    const key = sessionId || `${ship.toLowerCase()}|${day}`;

    if (!sessions.has(key)) {
      sessions.set(key, {
        session_name: sessionId || '',
        ship,
        location,
        day,
        rmc_scu: 0,
        cmr_scu: 0,
        cms_scu: 0,
        hulls_scraped: 0,
        other_cargo: [],
      });
    }
    const s = sessions.get(key);
    if (!s.ship && ship) s.ship = ship;
    if (!s.location && location) s.location = location;

    // Entries can either be per-cargo rows or session-level summaries
    const hulls = Number(pick(raw, HULL_KEYS));
    if (Number.isFinite(hulls) && hulls > 0) s.hulls_scraped = Math.max(s.hulls_scraped, hulls);

    // Session-summary style: direct rmc/cmr/cms fields
    let summarized = false;
    for (const bucket of ['rmc_scu', 'cmr_scu', 'cms_scu']) {
      const direct = pick(raw, [bucket, bucket.replace('_scu', '')]);
      if (direct !== undefined && Number.isFinite(Number(direct))) {
        s[bucket] += Number(direct);
        summarized = true;
      }
    }
    if (summarized) continue;

    // Cargo-row style: commodity name + quantity
    const cargoName = pick(raw, NAME_KEYS);
    const qty = Number(pick(raw, QTY_KEYS));
    if (cargoName && Number.isFinite(qty) && qty > 0) {
      const bucket = bucketFor(cargoName);
      if (bucket) s[bucket] += qty;
      else s.other_cargo.push(`${cargoName} ×${qty}`);
    }
  }
  return [...sessions.values()].filter((s) => s.rmc_scu > 0 || s.cmr_scu > 0 || s.cms_scu > 0 || s.other_cargo.length > 0);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const payload = await req.json();
    const mode = payload.mode || 'preview';

    if (mode === 'preview') {
      let text = payload.text || '';
      if (!text && payload.file_url) {
        const res = await fetch(payload.file_url);
        if (!res.ok) return Response.json({ error: `Could not download the file (${res.status})` }, { status: 400 });
        text = await res.text();
      }
      if (!text.trim()) return Response.json({ error: 'The file is empty' }, { status: 400 });

      let entries = null;
      try {
        entries = findEntriesArray(JSON.parse(text));
      } catch (_e) {
        const lines = text.split(/\r?\n/).filter((l) => l.trim());
        if (lines.length >= 2) {
          const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
          entries = lines.slice(1).map((line) => {
            const cells = parseCsvLine(line);
            const obj = {};
            header.forEach((h, i) => { obj[h] = cells[i]; });
            return obj;
          });
        }
      }
      if (!entries || !entries.length) {
        return Response.json({ error: 'No log entries found in the file. Expected a JSON log or a CSV with a header row.' }, { status: 400 });
      }

      const grouped = buildSessions(entries);
      if (!grouped.length) {
        return Response.json({ error: 'Parsed the log but found no ship/cargo data — check the export format.' }, { status: 400 });
      }

      // Value the haul against cached UEX best-sell prices
      const prices = await base44.asServiceRole.entities.commodity_price.filter({ is_best_sell: true });
      const bestFor = (code) => Math.max(0, ...prices.filter((p) => p.commodity_code === code).map((p) => p.price_sell || 0));
      const best = { rmc_scu: bestFor('RMC'), cmr_scu: bestFor('CMR'), cms_scu: bestFor('CMS') };

      const sessions = grouped.map((s, i) => {
        const stamp = s.day || new Date().toISOString().slice(0, 10);
        return {
          session_name: s.session_name || `Arkanis import — ${s.ship || 'Unknown ship'} ${stamp}${grouped.length > 1 && !s.ship ? ` #${i + 1}` : ''}`,
          ship: s.ship,
          location: s.location,
          rmc_scu: Math.round(s.rmc_scu * 100) / 100,
          cmr_scu: Math.round(s.cmr_scu * 100) / 100,
          cms_scu: Math.round(s.cms_scu * 100) / 100,
          hulls_scraped: s.hulls_scraped,
          estimated_value: Math.round(s.rmc_scu * best.rmc_scu + s.cmr_scu * best.cmr_scu + s.cms_scu * best.cms_scu),
          other_cargo: s.other_cargo,
        };
      });
      return Response.json({ status: 'success', sessions, entries_parsed: entries.length });
    }

    if (mode === 'commit') {
      const sessions = Array.isArray(payload.sessions) ? payload.sessions : [];
      if (!sessions.length) return Response.json({ error: 'No sessions to commit' }, { status: 400 });

      const created = await base44.entities.salvage_session.bulkCreate(sessions.map((s) => ({
        session_name: s.session_name || 'Arkanis import',
        ship: s.ship || '',
        status: 'in-progress',
        rmc_scu: Math.max(0, Number(s.rmc_scu) || 0),
        cmr_scu: Math.max(0, Number(s.cmr_scu) || 0),
        cms_scu: Math.max(0, Number(s.cms_scu) || 0),
        hulls_scraped: Math.max(0, Number(s.hulls_scraped) || 0),
        estimated_value: Math.max(0, Number(s.estimated_value) || 0),
        location: s.location || '',
        notes: ['Imported from Arkanis overlay log', s.other_cargo?.length ? `Other cargo: ${s.other_cargo.join(', ')}` : ''].filter(Boolean).join(' · '),
      })));

      await base44.asServiceRole.entities.ops_log.create({
        action: 'salvage.arkanis_log_import',
        entity_type: 'salvage_session',
        entity_name: 'Arkanis salvage log import',
        actor: user.full_name || 'proprietor',
        notes: `Imported ${created.length} salvage session(s) from an Arkanis overlay log`,
        after: Object.fromEntries(created.map((c) => [c.session_name, `RMC ${c.rmc_scu} / CMR ${c.cmr_scu} / CMS ${c.cms_scu} SCU`])),
      });

      return Response.json({ status: 'success', created: created.length });
    }

    return Response.json({ error: `Unknown mode: ${mode}` }, { status: 400 });
  } catch (error) {
    console.error('importArkanisSalvageLog error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});