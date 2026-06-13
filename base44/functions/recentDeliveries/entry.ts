import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Public anonymized proof-of-activity feed: recent delivered orders with
// masked tracking codes — no handles, no totals, no notes.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole.entities;

    const orders = await svc.order.filter({ status: 'delivered' }, '-updated_date', 8);
    const deliveries = orders.map((o) => ({
      code: o.tracking_code ? `${o.tracking_code.slice(0, 5)}••${o.tracking_code.slice(-2)}` : 'FSIS-••••',
      location: o.delivery_location || 'Undisclosed',
      delivered_at: o.updated_date,
      units: (o.items || []).reduce((s, i) => s + (i.quantity || 0), 0),
    }));

    return Response.json({ deliveries });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});