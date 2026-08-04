import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { findCrewMemberFor, fetchConfirmedLogsFor, sharesInLogs, sameHandle } from '../../shared/members.js';
import { readAllOrRefuse, readBounded, CAPS } from '../../shared/paging.js';

// Records a contractor's pay day election (cash in or defer) for the open cycle.
// Identity is enforced server-side against the ACCOUNT, not the callsign: a roster place
// already claimed by an account cannot be reached by holding a matching name, so nobody
// can elect on someone else's behalf.

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

    // Contractors stand outside the co-op: their labour is paid in full per task or per
    // operation, and is never diluted into — nor drawn from — the members' share pool.
    if (user.fsis_role === 'contractor') {
      return Response.json({
        error: 'Contractors are paid in full for each task and operation, directly and outside the share pool. There is no election to make — see the labour board for what you are owed.',
      }, { status: 403 });
    }

    // If this came back short, a comrade would be told their callsign is not on the roster and be
    // unable to elect at all. Refuse rather than lock them out of their own decision.
    const crew = await readAllOrRefuse(base44.asServiceRole.entities.crew_member, { active: true }, '-created_date', CAPS.roster, 'the crew roster');
    const me = findCrewMemberFor(crew, user);
    if (!me) {
      return Response.json({ error: 'Your callsign is not on the crew roster. Ask management to add your callsign, and make sure it matches your FSIS operator callsign.' }, { status: 403 });
    }

    const { rows: openCycles } = await readBounded(base44.asServiceRole.entities.payday_cycle, { status: 'open' }, '-opens_at', CAPS.cycles);
    const cycle = openCycles[0];
    if (!cycle) {
      return Response.json({ error: 'No pay day cycle is currently open' }, { status: 400 });
    }
    if (new Date(cycle.closes_at) <= new Date()) {
      return Response.json({ error: 'The decision window has closed — this cycle is being finalized' }, { status: 400 });
    }

    const logs = await fetchConfirmedLogsFor(base44, { userId: user.id, handle: me.handle });
    const shares = sharesInLogs(logs);

    // One election per comrade per cycle — matched by account, falling back to the callsign for
    // an election filed before pay was keyed to the account, so nobody ends up with two.
    const filed = await readAllOrRefuse(base44.asServiceRole.entities.payday_election, { cycle_id: cycle.id }, '-decided_at', CAPS.elections, 'elections for this cycle');
    const existing = filed.find((e) => (e.member_user_id ? e.member_user_id === user.id : sameHandle(e.handle, me.handle))) || null;
    const data = {
      cycle_id: cycle.id,
      handle: me.handle,
      member_user_id: user.id,
      decision,
      shares_at_election: shares,
      decided_at: new Date().toISOString(),
    };
    if (existing) {
      await base44.asServiceRole.entities.payday_election.update(existing.id, data);
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