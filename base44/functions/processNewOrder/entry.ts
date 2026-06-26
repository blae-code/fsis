import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// FSIS.bot order triage agent: when a storefront order is created, verify each
// line item against live stock, pricing, and route risk, annotate internal notes,
// and auto-confirm only clean standard-route orders.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { event, payload_too_large } = payload;

    let order = payload.data;
    if (payload_too_large || !order) {
      order = await base44.asServiceRole.entities.order.get(event.entity_id);
    }

    if (order.status !== 'new') {
      return Response.json({ skipped: true, reason: 'Order not in new status' });
    }

    const svc = base44.asServiceRole.entities;
    const products = await svc.product.list();
    const lines = [];
    let allFulfillable = true;

    const deliveryLocation = String(order.delivery_location || '').trim();
    const highRiskRoute = deliveryLocation.toUpperCase().includes('GRIMHEX');
    if (!deliveryLocation) {
    lines.push('✗ no delivery location supplied');
    allFulfillable = false;
    } else if (highRiskRoute) {
    lines.push(`⚠ ${deliveryLocation}: high-risk route — proprietor must confirm escort/surcharge before fulfillment`);
    allFulfillable = false;
    }

    for (const item of order.items || []) {
      const product = products.find((p) => p.id === item.product_id) ||
        products.find((p) => p.product_name === item.product_name);
      if (!product) {
        lines.push(`✗ ${item.product_name}: not found in catalog`);
        allFulfillable = false;
        continue;
      }
      if (!product.available) {
        lines.push(`✗ ${item.product_name}: not currently offered`);
        allFulfillable = false;
      } else if ((product.stock || 0) < (item.quantity || 0)) {
        lines.push(`✗ ${item.product_name}: short ${(item.quantity || 0) - (product.stock || 0)} ${product.unit || 'SCU'} (stock ${product.stock || 0})`);
        allFulfillable = false;
      } else {
        lines.push(`✓ ${item.product_name}: ${item.quantity} ${product.unit || 'SCU'} in stock (${product.stock})`);
      }
      // Flag price drift between order and current catalog
      if (item.unit_price != null && product.price_auec != null && item.unit_price !== product.price_auec) {
        lines.push(`  ⚠ price drift on ${item.product_name}: ordered @ ${item.unit_price}, catalog now ${product.price_auec}`);
      }
    }

    const computedTotal = (order.items || []).reduce((t, i) => t + (i.unit_price || 0) * (i.quantity || 0), 0);
    if (order.total_auec != null && Math.round(computedTotal) !== Math.round(order.total_auec)) {
      lines.push(`⚠ total mismatch: order says ${order.total_auec}, line items sum to ${computedTotal}`);
      allFulfillable = false;
    }

    const verdict = allFulfillable
      ? 'ALL CLEAR — standard route auto-confirmed, ready for fulfillment.'
      : 'NEEDS REVIEW — see flags above before confirming.';

    await svc.order.update(order.id, {
      status: allFulfillable ? 'confirmed' : 'new',
      internal_notes: `FSIS.bot AUTO-TRIAGE (${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC)\n${lines.join('\n')}\n${verdict}${order.internal_notes ? `\n---\n${order.internal_notes}` : ''}`,
    });

    // Audit log
    await svc.ops_log.create({
      action: allFulfillable ? 'order.confirmed' : 'order.flagged',
      entity_type: 'order',
      entity_id: order.id,
      entity_name: `Order from ${order.customer_handle}`,
      actor: 'FSIS.bot',
      notes: `${order.total_auec?.toLocaleString() || 0} aUEC — ${order.delivery_location || 'no location'}`,
    }).catch(() => {});

    console.log(`Order ${order.id} triaged: ${allFulfillable ? 'auto-confirmed' : 'flagged for review'}`);
    return Response.json({ triaged: true, auto_confirmed: allFulfillable, flags: lines });
  } catch (error) {
    console.error('processNewOrder error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});