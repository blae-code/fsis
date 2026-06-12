import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Records a contractor's pay day election (cash in or defer) for the open cycle.
// Identity is enforced server-side: the logged-in user's email must match their
// crew roster record — nobody can elect on someone else's behalf.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { decision } = await req.json();
    if (!['cash_in', 'defer'].includes(decision)) {
      return Response.json({ error: 'Decision must be cash_in or defer' }, { status: 400 });
    }

    const matches = await base44.asServiceRole.entities.crew_member.filter({ email: user.email });
    const me = matches[0];
    if (!me) {
      return Response.json({ error: 'Your account is not linked to a crew roster record. Ask management to add your email.' }, { status: 403 });
    }

    const openCycles = await base44.asServiceRole.entities.payday_cycle.filter({ status: 'open' });
    const cycle = openCycles[0];
    if (!cycle) {
      return Response.json({ error: 'No pay day cycle is currently open' }, { status: 400 });
    }
    if (new Date(cycle.closes_at) <= new Date()) {
      return Response.json({ error: 'The decision window has closed — this cycle is being finalized' }, { status: 400 });
    }

    const logs = await base44.asServiceRole.entities.time_log.filter({ handle: me.handle, status: 'confirmed' });
    const shares = Math.round(logs.reduce((t, l) => t + (l.shares || 0), 0) * 100) / 100;

    const existing = await base44.asServiceRole.entities.payday_election.filter({ cycle_id: cycle.id, handle: me.handle });
    const data = {
      cycle_id: cycle.id,
      handle: me.handle,
      email: user.email,
      decision,
      shares_at_election: shares,
      decided_at: new Date().toISOString(),
    };
    if (existing.length > 0) {
      await base44.asServiceRole.entities.payday_election.update(existing[0].id, data);
    } else {
      await base44.asServiceRole.entities.payday_election.create(data);
    }

    console.log(`Election: ${me.handle} → ${decision} (${shares} shares, cycle ${cycle.id})`);
    return Response.json({ ok: true, decision, shares });
  } catch (error) {
    console.error('submitPaydayElection error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});