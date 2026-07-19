import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Buyer-side cancellation: only allowed while the order is still 'new'.
// Tracking code acts as the bearer token (same model as trackOrder).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { tracking_code } = await req.json();

    if (!tracking_code?.trim()) {
      return Response.json({ error: 'Tracking code required' }, { status: 400 });
    }

    const svc = base44.asServiceRole.entities;
    const orders = await svc.order.filter({ tracking_code: tracking_code.trim().toUpperCase() });
    if (orders.length === 0) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orders[0];
    if (order.status !== 'new') {
      return Response.json({ error: 'Order is already being processed and can no longer be cancelled — contact FSIS.' }, { status: 400 });
    }

    // Atomic claim: conditionally flip 'new' -> 'cancelled' server-side. Only the
    // invocation that wins the claim (updated === 1) proceeds to restore stock, so
    // a double-clicked / retried / concurrent cancel cannot double-restore stock.
    const claim = await svc.order.updateMany({ id: order.id, status: 'new' }, { $set: { status: 'cancelled' } });
    if (!claim || claim.updated === 0) {
      return Response.json({ error: 'Order is already being processed and can no longer be cancelled — contact FSIS.' }, { status: 400 });
    }

    const restoreTag = `[stock-restored:${order.id}]`;
    const restoreNotes = [];
    for (const item of order.items || []) {
      if (!item.product_id || !item.quantity) continue;
      const product = await svc.product.get(item.product_id).catch(() => null);
      if (!product || product.category === 'service') continue;
      const nextStock = (product.stock || 0) + item.quantity;
      await svc.product.update(product.id, { stock: nextStock });
      restoreNotes.push(`${product.product_name}: ${product.stock || 0} → ${nextStock}`);
    }

    // Status is already 'cancelled' from the claim above — just append the audit notes.
    await svc.order.update(order.id, {
      internal_notes: [(order.internal_notes || '').trim(), `BUYER CANCELLED while order was new (${new Date().toISOString()})`, restoreNotes.length ? `STOCK RESTORED: ${restoreNotes.join('; ')} ${restoreTag}` : restoreTag].filter(Boolean).join('\n'),
    });
    await svc.ops_log.create({
      action: 'order.cancelled_by_buyer',
      entity_type: 'order',
      entity_id: order.id,
      entity_name: `Order from ${order.customer_handle}`,
      actor: order.customer_handle,
      notes: `Cancelled by buyer using tracking code ${order.tracking_code}`,
    }).catch(() => {});
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});