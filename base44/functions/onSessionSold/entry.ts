import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// FSIS.bot settlement agent: when a salvage session is marked "sold",
// automatically log the income in the Ledger and draft a FairShare work
// order pre-loaded with the active crew roster — no manual bookkeeping.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { event, payload_too_large } = payload;

    let session = payload.data;
    if (payload_too_large || !session) {
      session = await base44.asServiceRole.entities.salvage_session.get(event.entity_id);
    }

    if (session.status !== 'sold') {
      return Response.json({ skipped: true, reason: 'Session not sold' });
    }

    const gross = session.estimated_value || 0;
    const svc = base44.asServiceRole.entities;
    const today = new Date().toISOString().slice(0, 10);
    const actions = [];

    // Guard against double-processing if the session is updated again while sold
    const existingOrders = await svc.work_order.filter({ session_id: session.id }, '-created_date', 1);
    if (existingOrders.length > 0) {
      return Response.json({ skipped: true, reason: 'Work order already exists for this session' });
    }

    // 1. Ledger income entry
    if (gross > 0) {
      await svc.ledger_entry.create({
        entry_type: 'income',
        category: 'salvage_sale',
        amount_auec: gross,
        description: `Salvage sale — ${session.session_name} (${session.ship || 'unknown ship'})`,
        counterparty: session.location || '',
        entry_date: today,
        notes: 'Auto-logged by FSIS.bot settlement agent.',
      });
      actions.push(`logged ${gross.toLocaleString()} aUEC income`);
    }

    // 2. Draft FairShare work order with the active crew roster
    const roster = await svc.crew_member.filter({ active: true });
    await svc.work_order.create({
      order_name: `${session.session_name} — settlement`,
      session_id: session.id,
      session_name: session.session_name,
      gross_auec: gross,
      crew_shares: roster.map((m) => ({ handle: m.handle, shares: m.default_shares ?? 1 })),
      status: 'open',
      notes: 'Auto-drafted by FSIS.bot when the session was marked sold. Adjust crew and expenses before settling.',
    });
    actions.push(`drafted work order for ${roster.length} crew`);

    console.log(`Session ${session.id} sold: ${actions.join('; ')}`);
    return Response.json({ applied: true, actions });
  } catch (error) {
    console.error('onSessionSold error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});