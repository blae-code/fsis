import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Public order lookup by tracking code or handoff passphrase — returns only buyer-safe fields.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { tracking_code } = await req.json();

    const code = String(tracking_code || '').trim().toUpperCase();
    if (!code) {
      return Response.json({ error: 'Tracking code required' }, { status: 400 });
    }

    let matches = await base44.asServiceRole.entities.order.filter({ tracking_code: code });
    if (matches.length === 0) {
      // Guest checkout receipts carry a handoff passphrase — allow lookup by it too
      matches = await base44.asServiceRole.entities.order.filter({ handoff_passphrase: code });
    }
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
        handoff_status: o.handoff_status || 'none',
        handoff_proposed_time: o.handoff_proposed_time || '',
        handoff_location: o.handoff_location || '',
        handoff_contact: o.handoff_contact || '',
        handoff_confirmed_time: o.handoff_confirmed_time || '',
        handoff_confirmed_location: o.handoff_confirmed_location || '',
        handoff_proprietor_note: o.handoff_proprietor_note || '',
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