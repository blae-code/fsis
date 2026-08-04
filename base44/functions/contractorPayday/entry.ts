import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { findCrewMemberFor, fetchConfirmedLogsFor, sharesInLogs, sameHandle } from '../../shared/members.js';
import { readAllOrRefuse, readBounded, CAPS } from '../../shared/paging.js';

// Contractor-facing pay day status. Scoped strictly to the logged-in user via their
// account's roster place — returns their shares, the open cycle, their election, and
// the latest published transparency report.

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // A truncated roster reads as 'you are not on it', which is how a comrade loses sight of their
    // own shares. Refuse rather than tell them that falsely.
    const crew = await readAllOrRefuse(base44.asServiceRole.entities.crew_member, { active: true }, '-created_date', CAPS.roster, 'the crew roster');
    const me = findCrewMemberFor(crew, user);

    const { rows: openCycles } = await readBounded(base44.asServiceRole.entities.payday_cycle, { status: 'open' }, '-opens_at', CAPS.cycles);
    const published = await base44.asServiceRole.entities.payday_cycle.filter({ status: 'published' }, '-published_at', 1);
    const openCycle = openCycles[0] || null;

    let myShares = 0;
    let myElection = null;
    if (me) {
      const logs = await fetchConfirmedLogsFor(base44, { userId: user.id, handle: me.handle });
      myShares = sharesInLogs(logs);
      if (openCycle) {
        const { rows: elections } = await readBounded(base44.asServiceRole.entities.payday_election, { cycle_id: openCycle.id }, '-decided_at', CAPS.elections);
        myElection = elections.find((e) => (e.member_user_id ? e.member_user_id === user.id : sameHandle(e.handle, me.handle))) || null;
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