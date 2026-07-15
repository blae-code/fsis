import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

// Flexible key detection so different Arkanis export versions still parse
const NAME_KEYS = ['name', 'item_name', 'itemname', 'label', 'item', 'product', 'commodity'];
const QTY_KEYS = ['quantity', 'qty', 'count', 'amount', 'stock', 'units', 'scu'];
const COND_KEYS = ['condition', 'condition_pct', 'health', 'durability', 'wear'];
const TYPE_KEYS = ['type', 'category', 'item_type', 'itemtype', 'kind', 'class', 'subtype'];
const LOC_KEYS = ['location', 'container', 'inventory', 'source', 'where'];

function pick(obj, keys) {
  for (const k of Object.keys(obj)) {
    if (keys.includes(k.toLowerCase().trim().replace(/[\s-]+/g, '_'))) {
      const v = obj[k];
      if (v !== undefined && v !== null && v !== '') return v;
    }
  }
  return undefined;
}

function categoryFor(hint, name) {
  const h = `${hint || ''} ${name || ''}`.toLowerCase();
  if (/weapon|rifle|pistol|smg|shotgun|sniper|launcher|knife|grenade/.test(h)) return 'weapon';
  if (/armor|helmet|undersuit|backpack|fps|clothing|medpen|multitool|gear/.test(h)) return 'fps_gear';
  if (/shield|cooler|power plant|quantum|qd|ship component|ship_component|mining head/.test(h)) return 'ship_component';
  if (/vehicle/.test(h)) return 'vehicle_component';
  return 'salvage_commodity';
}

function gradeFor(pct) {
  if (pct >= 95) return 'new';
  if (pct >= 75) return 'refurb';
  if (pct >= 40) return 'used';
  return 'worn';
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

// Find the array of item objects wherever the export nests it
function findItemsArray(data) {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const preferred = ['items', 'inventory', 'entries', 'data', 'inventoryitems', 'loot', 'cargo'];
    for (const key of Object.keys(data)) {
      if (preferred.includes(key.toLowerCase()) && Array.isArray(data[key]) && data[key].length && typeof data[key][0] === 'object') {
        return data[key];
      }
    }
    for (const value of Object.values(data)) {
      if (Array.isArray(value) && value.length && typeof value[0] === 'object') return value;
      if (value && typeof value === 'object') {
        const nested = findItemsArray(value);
        if (nested) return nested;
      }
    }
  }
  return null;
}

function normalizeRaw(rawItems) {
  const byName = new Map();
  for (const raw of rawItems) {
    if (!raw || typeof raw !== 'object') continue;
    const name = String(pick(raw, NAME_KEYS) || '').trim();
    if (!name) continue;
    const qty = Math.max(0, Number(pick(raw, QTY_KEYS)) || 1);
    let cond = pick(raw, COND_KEYS);
    cond = cond === undefined ? 100 : Number(cond);
    if (Number.isFinite(cond) && cond > 0 && cond <= 1) cond = cond * 100;
    if (!Number.isFinite(cond) || cond <= 0) cond = 100;
    cond = Math.min(100, Math.round(cond));
    const typeHint = String(pick(raw, TYPE_KEYS) || '');
    const location = String(pick(raw, LOC_KEYS) || '');
    const key = name.toLowerCase();
    const existing = byName.get(key);
    if (existing) {
      existing.quantity += qty;
      existing.condition_pct = Math.min(existing.condition_pct, cond);
    } else {
      byName.set(key, { name, quantity: qty, condition_pct: cond, type_hint: typeHint, location });
    }
  }
  return [...byName.values()];
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

      // Parse JSON first, fall back to CSV
      let rawItems = null;
      try {
        rawItems = findItemsArray(JSON.parse(text));
      } catch (_e) {
        const lines = text.split(/\r?\n/).filter((l) => l.trim());
        if (lines.length >= 2) {
          const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
          rawItems = lines.slice(1).map((line) => {
            const cells = parseCsvLine(line);
            const obj = {};
            header.forEach((h, i) => { obj[h] = cells[i]; });
            return obj;
          });
        }
      }
      if (!rawItems || !rawItems.length) {
        return Response.json({ error: 'No inventory items found in the file. Expected a JSON export or a CSV with a header row containing item names and quantities.' }, { status: 400 });
      }

      const items = normalizeRaw(rawItems);
      if (!items.length) {
        return Response.json({ error: 'Parsed the file but could not identify item names — check the export format.' }, { status: 400 });
      }

      // Match against the live catalog by name or code (case-insensitive)
      const products = await base44.asServiceRole.entities.product.list('sort_order', 500);
      const rows = items.map((item) => {
        const n = item.name.toLowerCase();
        const match = products.find((p) => String(p.product_name || '').toLowerCase() === n)
          || products.find((p) => p.code && String(p.code).toLowerCase() === n);
        return {
          ...item,
          suggested_category: match?.category || categoryFor(item.type_hint, item.name),
          match: match ? { id: match.id, product_name: match.product_name, code: match.code || '', stock: Number(match.stock || 0), price_auec: Number(match.price_auec || 0), category: match.category } : null,
        };
      });
      return Response.json({ status: 'success', rows, matched: rows.filter((r) => r.match).length, unmatched: rows.filter((r) => !r.match).length });
    }

    if (mode === 'commit') {
      const rows = Array.isArray(payload.rows) ? payload.rows : [];
      if (!rows.length) return Response.json({ error: 'No rows to commit' }, { status: 400 });

      const updates = [];
      const creates = [];
      const logBefore = {};
      const logAfter = {};

      for (const row of rows) {
        const qty = Math.max(0, Number(row.quantity) || 0);
        if (row.product_id) {
          const current = Number(row.current_stock || 0);
          const next = row.action === 'add' ? current + qty : qty;
          updates.push({ id: row.product_id, stock: next });
          logBefore[row.name] = current;
          logAfter[row.name] = next;
        } else {
          const pct = Math.min(100, Math.max(1, Number(row.condition_pct) || 100));
          creates.push({
            product_name: row.name,
            category: row.category || 'salvage_commodity',
            condition_pct: pct,
            condition_grade: gradeFor(pct),
            price_auec: Math.max(0, Number(row.price_auec) || 0),
            unit: row.category === 'salvage_commodity' ? 'SCU' : 'each',
            stock: qty,
            available: Number(row.price_auec) > 0,
            description: row.location ? `Imported from Arkanis (${row.location})` : 'Imported from Arkanis overlay export',
          });
          logBefore[row.name] = 0;
          logAfter[row.name] = qty;
        }
      }

      if (updates.length) await base44.asServiceRole.entities.product.bulkUpdate(updates);
      if (creates.length) await base44.asServiceRole.entities.product.bulkCreate(creates);

      await base44.asServiceRole.entities.ops_log.create({
        action: 'inventory.arkanis_import',
        entity_type: 'product',
        entity_name: 'Arkanis overlay import',
        actor: user.full_name || 'proprietor',
        notes: `Arkanis import — ${updates.length} stock update(s), ${creates.length} new listing(s)`,
        before: logBefore,
        after: logAfter,
      });

      return Response.json({ status: 'success', updated: updates.length, created: creates.length });
    }

    return Response.json({ error: `Unknown mode: ${mode}` }, { status: 400 });
  } catch (error) {
    console.error('processArkanisExport error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});