import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Contractor-facing pay day status. Scoped strictly to the logged-in user via
// their crew roster email link — returns their shares, the open cycle, their
// election, and the latest published transparency report.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const matches = await base44.asServiceRole.entities.crew_member.filter({ email: user.email });
    const me = matches[0] || null;

    const openCycles = await base44.asServiceRole.entities.payday_cycle.filter({ status: 'open' });
    const published = await base44.asServiceRole.entities.payday_cycle.filter({ status: 'published' }, '-published_at', 1);
    const openCycle = openCycles[0] || null;

    let myShares = 0;
    let myElection = null;
    if (me) {
      const logs = await base44.asServiceRole.entities.time_log.filter({ handle: me.handle, status: 'confirmed' });
      myShares = Math.round(logs.reduce((t, l) => t + (l.shares || 0), 0) * 100) / 100;
      if (openCycle) {
        const elections = await base44.asServiceRole.entities.payday_election.filter({ cycle_id: openCycle.id, handle: me.handle });
        myElection = elections[0] || null;
      }
    }

    return Response.json({
      linked: !!me,
      handle: me?.handle || null,
      my_shares: myShares,
      open_cycle: openCycle,
      my_election: myElection ? { decision: myElection.decision, decided_at: myElection.decided_at } : null,
      last_report: published[0] || null,
    });
  } catch (error) {
    console.error('contractorPayday error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});