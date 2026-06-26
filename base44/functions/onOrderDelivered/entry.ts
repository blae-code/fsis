import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// FSIS.bot fulfillment agent: when an order is marked delivered, auto-log the
// sale income in the Ledger. Storefront stock is reserved at checkout.

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

    // Guard against double-processing, including zero-aUEC/donation orders that do not create ledger income.
    if ((order.internal_notes || '').includes(dedupeTag)) {
      return Response.json({ skipped: true, reason: 'Already fulfilled' });
    }
    const existing = await svc.ledger_entry.filter({ category: 'order_fulfillment' }, '-created_date', 200);
    if (existing.some((e) => (e.notes || '').includes(dedupeTag))) {
      await svc.order.update(order.id, {
        internal_notes: [(order.internal_notes || '').trim(), `FULFILLMENT APPLIED: ledger already booked. ${dedupeTag}`].filter(Boolean).join('\n'),
      });
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
        notes: `Auto-logged by FSIS.bot fulfillment agent. ${dedupeTag}`,
      });
      actions.push(`logged ${total.toLocaleString()} aUEC income`);
    }

    // 2. Stock already reserved when the buyer transmitted the manifest.
    actions.push('stock reservation retained from checkout');

    await svc.order.update(order.id, {
      internal_notes: [(order.internal_notes || '').trim(), `FULFILLMENT APPLIED: ${actions.join('; ') || 'no ledger or stock changes'}. ${dedupeTag}`].filter(Boolean).join('\n'),
    });

    console.log(`Order ${order.id} delivered: ${actions.join('; ')}`);
    return Response.json({ applied: true, actions });
  } catch (error) {
    console.error('onOrderDelivered error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});