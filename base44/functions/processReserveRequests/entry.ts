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

    const requests = await base44.asServiceRole.entities.restock_notify.filter({
      product_id: product.id,
      request_type: 'reserve',
      reserve_status: 'open'
    }, 'created_date', 100);

    let remaining = currentStock;
    const updates = [];
    const now = new Date().toISOString();

    for (const request of requests) {
      if (remaining <= 0) break;
      const desired = Math.max(1, Number(request.desired_quantity || 1));
      const reserved = Math.min(desired, remaining);
      remaining -= reserved;
      updates.push({
        id: request.id,
        reserve_status: 'reserved',
        reserved_quantity: reserved,
        reserved_at: now,
        notes: `Automatically reserved ${reserved} ${product.unit || 'unit'} from newly found stock.`
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