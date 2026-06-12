import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Returns the calling contractor's pay day status: linked crew member, outstanding
// shares + time logs, the open cycle, their election, and the latest published report.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const svc = base44.asServiceRole;

    const crew = await svc.entities.crew_member.filter({ active: true });
    const member = crew.find((m) => (m.email || '').toLowerCase() === (user.email || '').toLowerCase());
    if (!member) {
      return Response.json({ linked: false });
    }

    const logs = await svc.entities.time_log.filter({ status: 'confirmed', handle: member.handle }, '-work_date', 100);
    const shares = Math.round(logs.reduce((t, l) => t + (l.shares || 0), 0) * 100) / 100;

    const openCycles = await svc.entities.payday_cycle.filter({ status: 'open' });
    const cycle = openCycles[0] || null;

    let election = null;
    if (cycle) {
      const els = await svc.entities.payday_election.filter({ cycle_id: cycle.id, handle: member.handle });
      election = els[0] || null;
    }

    const published = await svc.entities.payday_cycle.filter({ status: 'published' }, '-payday_date', 1);

    return Response.json({
      linked: true,
      handle: member.handle,
      shares,
      logs: logs.map((l) => ({
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