import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Public guest endpoint: allows a buyer to propose or update their handoff request.
// Uses tracking_code as a bearer token — same trust model as trackOrder / cancelOrder.
// Runs via service role so anonymous buyers (no created_by_id) can update their own order.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { tracking_code, handoff_proposed_time, handoff_location, handoff_contact } = await req.json();

    const code = String(tracking_code || '').trim().toUpperCase();
    if (!code) {
      return Response.json({ error: 'Tracking code required' }, { status: 400 });
    }
    if (!handoff_proposed_time?.trim()) {
      return Response.json({ error: 'Availability window is required' }, { status: 400 });
    }

    const svc = base44.asServiceRole.entities;

    // Look up by tracking code only (canonical bearer token for guest orders)
    let matches = await svc.order.filter({ tracking_code: code });
    if (matches.length === 0) {
      // Fallback: allow lookup by passphrase so the receipt slip also works
      matches = await svc.order.filter({ handoff_passphrase: code });
    }
    if (matches.length === 0) {
      return Response.json({ error: 'No order found for that code' }, { status: 404 });
    }

    const order = matches[0];

    // Only allow handoff scheduling once FSIS has accepted the order for fulfillment
    if (!['confirmed', 'in_fulfillment'].includes(order.status)) {
      return Response.json({ error: 'Handoff scheduling opens after FSIS confirms the order' }, { status: 400 });
    }

    await svc.order.update(order.id, {
      handoff_proposed_time: handoff_proposed_time.trim(),
      handoff_location: (handoff_location || '').trim(),
      handoff_contact: (handoff_contact || '').trim(),
      handoff_status: 'requested',
    });

    return Response.json({ ok: true });
  } catch (error) {
    console.error('updateHandoff error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});