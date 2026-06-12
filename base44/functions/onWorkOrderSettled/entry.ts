import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// OD3ICA payroll agent: when a FairShare work order is settled, compute each
// crew member's payout and auto-log crew_pay expense entries in the Ledger.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const { event, payload_too_large } = payload;

    let wo = payload.data;
    if (payload_too_large || !wo) {
      wo = await base44.asServiceRole.entities.work_order.get(event.entity_id);
    }

    if (wo.status !== 'settled') {
      return Response.json({ skipped: true, reason: 'Work order not settled' });
    }

    const svc = base44.asServiceRole.entities;
    const dedupeTag = `[wo:${wo.id}]`;

    // Guard against double-processing
    const existing = await svc.ledger_entry.filter({ category: 'crew_pay' }, '-created_date', 200);
    if (existing.some((e) => (e.notes || '').includes(dedupeTag))) {
      return Response.json({ skipped: true, reason: 'Payroll already booked' });
    }

    const gross = wo.gross_auec || 0;
    const expenses = (wo.expenses || []).reduce((t, e) => t + (e.amount_auec || 0), 0);
    const net = Math.max(0, gross - expenses);
    const totalShares = (wo.crew_shares || []).reduce((t, c) => t + (c.shares || 0), 0);

    if (net <= 0 || totalShares <= 0) {
      return Response.json({ skipped: true, reason: 'Nothing to pay out' });
    }

    const today = new Date().toISOString().slice(0, 10);
    const perShare = net / totalShares;

    const entries = (wo.crew_shares || [])
      .filter((c) => (c.shares || 0) > 0)
      .map((c) => ({
        entry_type: 'expense',
        category: 'crew_pay',
        amount_auec: Math.round(perShare * c.shares),
        description: `Crew payout — ${c.handle} (${c.shares} share${c.shares === 1 ? '' : 's'}) for ${wo.order_name}`,
        counterparty: c.handle,
        entry_date: today,
        notes: `Auto-logged by OD3ICA payroll agent. ${dedupeTag}`,
      }));

    await svc.ledger_entry.bulkCreate(entries);

    if (!wo.settled_date) {
      await svc.work_order.update(wo.id, { settled_date: today });
    }

    console.log(`Work order ${wo.id} settled: ${entries.length} crew payouts booked, net ${net}`);
    return Response.json({ applied: true, payouts: entries.length, net_auec: net });
  } catch (error) {
    console.error('onWorkOrderSettled error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});