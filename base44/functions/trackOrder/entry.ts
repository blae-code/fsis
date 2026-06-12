import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Public order lookup by tracking code — returns only buyer-safe fields.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { tracking_code } = await req.json();

    const code = String(tracking_code || '').trim().toUpperCase();
    if (!code) {
      return Response.json({ error: 'Tracking code required' }, { status: 400 });
    }

    const matches = await base44.asServiceRole.entities.order.filter({ tracking_code: code });
    if (matches.length === 0) {
      return Response.json({ error: 'No order found for that code' }, { status: 404 });
    }

    const o = matches[0];
    return Response.json({
      order: {
        tracking_code: o.tracking_code,
        customer_handle: o.customer_handle,
        status: o.status || 'new',
        items: o.items || [],
        total_auec: o.total_auec || 0,
        discount_auec: o.discount_auec || 0,
        discount_percent: o.discount_percent || 0,
        handoff_passphrase: o.handoff_passphrase || '',
        delivery_location: o.delivery_location || '',
        created_date: o.created_date,
        updated_date: o.updated_date,
      },
    });
  } catch (error) {
    console.error('trackOrder error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});