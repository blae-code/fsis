import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { findCrewMemberFor, fetchConfirmedLogsFor, sharesInLogs, sameHandle } from '../../shared/members.js';

// Returns the calling contractor's pay day status: linked crew member, outstanding
// shares + time logs, the open cycle, their election, and the latest published report.
// Identity is the account, not the callsign — a comrade who is renamed keeps their labour.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const svc = base44.asServiceRole;

    // The roster place belonging to this account — by account link where it exists, and only
    // otherwise by callsign. A place already claimed is never opened by a matching name.
    const crew = await svc.entities.crew_member.filter({ active: true });
    const member = findCrewMemberFor(crew, user);
    if (!member) {
      return Response.json({ linked: false });
    }

    const logs = await fetchConfirmedLogsFor(base44, { userId: user.id, handle: member.handle });
    const shares = sharesInLogs(logs);

    const openCycles = await svc.entities.payday_cycle.filter({ status: 'open' });
    const cycle = openCycles[0] || null;

    let election = null;
    if (cycle) {
      const els = await svc.entities.payday_election.filter({ cycle_id: cycle.id });
      election = els.find((e) => (e.member_user_id ? e.member_user_id === user.id : sameHandle(e.handle, member.handle))) || null;
    }

    const published = await svc.entities.payday_cycle.filter({ status: 'published' }, '-payday_date', 1);

    return Response.json({
      linked: true,
      handle: member.handle,
      shares,
      // The share total above counts every confirmed log; the record shown back is the most
      // recent hundred, as it always was.
      logs: logs.slice(0, 100).map((l) => ({
        work_date: l.work_date,
        minutes: l.minutes,
        shares: l.shares,
        description: l.description,
      })),
      cycle: cycle
        ? {
            id: cycle.id,
            cycle_name: cycle.cycle_name,
            payday_date: cycle.payday_date,
            closes_at: cycle.closes_at,
            pool_auec: cycle.pool_auec,
            total_shares: cycle.total_shares,
          }
        : null,
      election: election ? { decision: election.decision, decided_at: election.decided_at, est_payout_auec: election.est_payout_auec } : null,
      last_report: published[0] ? { cycle_name: published[0].cycle_name, report: published[0].report } : null,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});