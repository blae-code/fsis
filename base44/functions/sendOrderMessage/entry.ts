import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Buyer-side order message intake. Tracking code/passphrase acts as the order credential.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { tracking_code, handoff_passphrase, handle, message, is_cancel_request } = await req.json();

    const cleanHandle = String(handle || '').trim();
    const cleanMessage = String(message || '').trim();
    const trackingCode = String(tracking_code || '').trim().toUpperCase();
    const passphrase = String(handoff_passphrase || '').trim().toUpperCase();

    if (!trackingCode && !passphrase) {
      return Response.json({ error: 'Order tracking code or passphrase required' }, { status: 400 });
    }
    if (!cleanHandle || !cleanMessage) {
      return Response.json({ error: 'Handle and message required' }, { status: 400 });
    }
    if (cleanHandle.length > 64 || cleanMessage.length > 4000) {
      return Response.json({ error: 'Handle or message is too long' }, { status: 400 });
    }

    const svc = base44.asServiceRole.entities;
    const orders = trackingCode
      ? await svc.order.filter({ tracking_code: trackingCode })
      : await svc.order.filter({ handoff_passphrase: passphrase });

    if (orders.length === 0) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = orders[0];
    if (['delivered', 'cancelled'].includes(order.status)) {
      return Response.json({ error: 'This order is final and can no longer receive buyer messages' }, { status: 400 });
    }

    const saved = await svc.order_message.create({
      tracking_code: order.tracking_code,
      sender: 'buyer',
      handle: cleanHandle,
      message: cleanMessage,
      is_cancel_request: Boolean(is_cancel_request),
    });

    if (is_cancel_request) {
      await svc.order.update(order.id, {
        internal_notes: [
          (order.internal_notes || '').trim(),
          `BUYER CANCELLATION REQUEST: ${cleanHandle} — ${cleanMessage}`,
        ].filter(Boolean).join('\n'),
      });
    }

    await svc.ops_log.create({
      action: is_cancel_request ? 'order.cancel_requested' : 'order.message_received',
      entity_type: 'order',
      entity_id: order.id,
      entity_name: `Order from ${order.customer_handle}`,
      actor: cleanHandle,
      notes: cleanMessage,
    }).catch(() => {});

    return Response.json({ ok: true, message_id: saved.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});