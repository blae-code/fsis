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

    await svc.order.update(order.id, { status: 'cancelled' });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});