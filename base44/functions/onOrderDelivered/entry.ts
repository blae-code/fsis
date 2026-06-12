import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// OD3ICA fulfillment agent: when an order is marked delivered, auto-log the
// sale income in the Ledger and decrement storefront stock per line item.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { event, payload_too_large } = payload;

    let order = payload.data;
    if (payload_too_large || !order) {
      order = await base44.asServiceRole.entities.order.get(event.entity_id);
    }

    if (order.status !== 'delivered') {
      return Response.json({ skipped: true, reason: 'Order not delivered' });
    }

    const svc = base44.asServiceRole.entities;
    const dedupeTag = `[order:${order.id}]`;

    // Guard against double-processing
    const existing = await svc.ledger_entry.filter({ category: 'order_fulfillment' }, '-created_date', 200);
    if (existing.some((e) => (e.notes || '').includes(dedupeTag))) {
      return Response.json({ skipped: true, reason: 'Already booked' });
    }

    const actions = [];

    // 1. Ledger income entry
    const total = order.total_auec || 0;
    if (total > 0) {
      await svc.ledger_entry.create({
        entry_type: 'income',
        category: 'order_fulfillment',
        amount_auec: total,
        description: `Order delivered — ${order.customer_handle} (${(order.items || []).map((i) => `${i.quantity} ${i.code || i.product_name}`).join(', ')})`,
        counterparty: order.customer_handle,
        entry_date: new Date().toISOString().slice(0, 10),
        notes: `Auto-logged by OD3ICA fulfillment agent. ${dedupeTag}`,
      });
      actions.push(`logged ${total.toLocaleString()} aUEC income`);
    }

    // 2. Decrement storefront stock
    const products = await svc.product.list();
    for (const item of order.items || []) {
      const product = products.find((p) => p.id === item.product_id) ||
        products.find((p) => p.product_name === item.product_name);
      if (product && item.quantity) {
        const newStock = Math.max(0, (product.stock || 0) - item.quantity);
        await svc.product.update(product.id, { stock: newStock });
        actions.push(`${product.product_name}: stock ${product.stock || 0} → ${newStock}`);
      }
    }

    console.log(`Order ${order.id} delivered: ${actions.join('; ')}`);
    return Response.json({ applied: true, actions });
  } catch (error) {
    console.error('onOrderDelivered error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});