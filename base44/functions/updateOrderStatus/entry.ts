import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const STATUSES = ['new', 'confirmed', 'in_fulfillment', 'delivered', 'cancelled'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { order_id, status } = await req.json();
    if (!order_id || !STATUSES.includes(status)) {
      return Response.json({ error: 'Valid order_id and status required' }, { status: 400 });
    }

    const svc = base44.asServiceRole.entities;
    let order;
    try {
      order = await svc.order.get(order_id);
    } catch (_) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status === status) {
      return Response.json({ ok: true, unchanged: true, order });
    }

    const note = `ADMIN STATUS CHANGE: ${order.status || 'new'} → ${status} by ${user.email || user.full_name || 'admin'} (${new Date().toISOString()})`;
    const updated = await svc.order.update(order.id, {
      status,
      internal_notes: [(order.internal_notes || '').trim(), note].filter(Boolean).join('\n'),
    });

    await svc.ops_log.create({
      action: 'order.status_changed',
      entity_type: 'order',
      entity_id: order.id,
      entity_name: `Order from ${order.customer_handle}`,
      actor: user.email || user.full_name || 'admin',
      before: { status: order.status || 'new' },
      after: { status },
      notes: note,
    }).catch(() => {});

    return Response.json({ ok: true, order: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});