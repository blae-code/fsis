import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Public guest checkout: validates the cart against the live catalog server-side,
// recomputes pricing, issues a tracking code, and creates the order via service role
// so buyers don't need an account.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { customer_handle, items, delivery_location, customer_notes } = await req.json();

    if (!customer_handle?.trim() || !Array.isArray(items) || items.length === 0) {
      return Response.json({ error: 'Handle and at least one item are required' }, { status: 400 });
    }

    const svc = base44.asServiceRole.entities;
    const products = await svc.product.filter({ available: true });

    const lines = [];
    for (const item of items) {
      const product = products.find((p) => p.id === item.product_id);
      if (!product) {
        return Response.json({ error: `${item.product_name || 'An item'} is no longer available` }, { status: 400 });
      }
      const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
      if (product.category !== 'service' && (product.stock || 0) < quantity) {
        return Response.json({ error: `${product.product_name}: only ${product.stock || 0} ${product.unit || 'SCU'} in stock` }, { status: 400 });
      }
      lines.push({
        product_id: product.id,
        product_name: product.product_name,
        code: product.code,
        quantity,
        unit: product.unit || 'SCU',
        unit_price: product.price_auec,
      });
    }

    const total = lines.reduce((t, l) => t + l.unit_price * l.quantity, 0);
    const tracking_code = 'FSIS-' + crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase();

    const order = await svc.order.create({
      customer_handle: customer_handle.trim(),
      tracking_code,
      items: lines,
      total_auec: total,
      delivery_location: delivery_location || '',
      customer_notes: customer_notes || '',
      status: 'new',
    });

    return Response.json({ ok: true, tracking_code, order_id: order.id, total_auec: total });
  } catch (error) {
    console.error('placeOrder error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});