import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const TAG = 'QA TEST — ';
const TRACKING = 'QA-FSIS';
const CODE = 'QA-LAUNCH-10';

async function removeMatching(entity, predicate) {
  let removed = 0;
  const rows = await entity.list('-created_date', 500);
  for (const row of rows.filter(predicate)) {
    await entity.delete(row.id);
    removed++;
  }
  return removed;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });
    let payload = {}; try { payload = await req.json(); } catch { payload = {}; }
    const svc = base44.asServiceRole.entities;
    const checks = {
      products: (p) => String(p.product_name || '').startsWith(TAG),
      orders: (o) => String(o.customer_handle || '').startsWith(TAG) || String(o.tracking_code || '').startsWith(TRACKING),
      loot: (i) => String(i.item_name || '').startsWith(TAG),
      ledger: (e) => String(e.description || '').startsWith(TAG),
      discounts: (d) => String(d.code || '') === CODE || String(d.label || '').startsWith(TAG),
      restocks: (r) => String(r.product_name || '').startsWith(TAG) || String(r.handle || '').startsWith(TAG),
    };
    if (payload.dry_run) return Response.json({ status: 'success', dry_run: true, targets: Object.keys(checks) });
    const summary = {
      products: await removeMatching(svc.product, checks.products),
      orders: await removeMatching(svc.order, checks.orders),
      loot: await removeMatching(svc.loot_item, checks.loot),
      ledger: await removeMatching(svc.ledger_entry, checks.ledger),
      discounts: await removeMatching(svc.discount_code, checks.discounts),
      restocks: await removeMatching(svc.restock_notify, checks.restocks),
    };
    return Response.json({ status: 'success', summary });
  } catch (error) {
    return Response.json({ status: 'error', error: error.message }, { status: 500 });
  }
});