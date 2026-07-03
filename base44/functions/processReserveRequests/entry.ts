import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json().catch(() => ({}));
    const product = payload?.data;
    const oldProduct = payload?.old_data;

    if (!product?.id) {
      return Response.json({ success: true, skipped: 'No product payload' });
    }

    const currentStock = Number(product.stock || 0);
    const previousStock = Number(oldProduct?.stock || 0);

    if (currentStock <= 0 || currentStock <= previousStock) {
      return Response.json({ success: true, skipped: 'No new stock available' });
    }

    const svc = base44.asServiceRole.entities;
    const byId = await svc.restock_notify.filter({
      product_id: product.id,
      request_type: 'reserve',
      reserve_status: 'open'
    }, 'created_date', 100);
    const byName = product.product_name
      ? await svc.restock_notify.filter({
          product_name: product.product_name,
          request_type: 'reserve',
          reserve_status: 'open'
        }, 'created_date', 100).catch(() => [])
      : [];
    const seen = new Set();
    const requests = [...byId, ...byName]
      .filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)))
      .sort((a, b) => new Date(a.created_date).getTime() - new Date(b.created_date).getTime());

    let remaining = currentStock;
    const updates = [];
    const now = new Date().toISOString();

    for (const request of requests) {
      if (remaining <= 0) break;
      const desired = Math.max(1, Number(request.desired_quantity || 1));
      const alreadyReserved = Math.max(0, Number(request.reserved_quantity || 0));
      const stillNeeded = Math.max(0, desired - alreadyReserved);
      if (stillNeeded <= 0) continue;
      const reservedNow = Math.min(stillNeeded, remaining);
      const nextReserved = alreadyReserved + reservedNow;
      remaining -= reservedNow;
      updates.push({
        id: request.id,
        reserve_status: nextReserved >= desired ? 'reserved' : 'open',
        reserved_quantity: nextReserved,
        reserved_at: now,
        notes: `Automatically reserved ${reservedNow} ${product.unit || 'unit'} from newly found stock.`
      });
    }

    if (updates.length > 0) {
      await base44.asServiceRole.entities.restock_notify.bulkUpdate(updates);
      await base44.asServiceRole.entities.product.update(product.id, { stock: remaining });
    }

    return Response.json({ success: true, reserved_requests: updates.length, remaining_stock: remaining });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});