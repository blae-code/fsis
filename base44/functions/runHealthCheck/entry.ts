import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { isCouncil } from '../../shared/roles.js';
import {
  checkStandingTotals, checkTradeTotals, checkCrewIntegrity, checkSweepLiveness,
  checkReferentialHealth, rank, summarise, reportError,
} from '../../shared/diagnostics.js';

/** How long a sweep may be silent before its silence is itself the finding. */
const SWEEP_SILENCE_HOURS = {
  closeHallLots: 2,
  sweepHallObligations: 30,
  expireBuybackOffers: 30,
  lapseStandingMarks: 30,
  escalateStaleReviews: 30,
  expireStaleClaims: 30,
  checkProcessingTimers: 2,
  sendMusterReminders: 2,
  postRecurringTasks: 30,
};

/**
 * Is the app actually doing what it is supposed to be doing?
 *
 * Written for the moment something is wrong in production and nobody yet knows what. It answers two
 * questions that are otherwise very hard to ask:
 *
 *   - Do the cached figures still match the records they are computed from? A standing total is a
 *     cache; if it has drifted, a comrade is being priced at a number their own record does not
 *     support, and nothing will ever tell you.
 *   - Have any of the scheduled sweeps quietly stopped? This is the failure that matters most,
 *     because a stopped sweep throws nothing. It is detected here by EVIDENCE — a lot past its
 *     closing time can only mean closeHallLots is not running — and separately by silence, since a
 *     sweep that stops also stops writing its own run record.
 *
 * Read-only. It changes nothing and never repairs anything on its own: a diagnostic that silently
 * fixes what it finds is a diagnostic that hides how often it is needed.
 */
export default async function (req: Request): Promise<Response> {
  const base44 = createClientFromRequest(req);
  try {
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isCouncil(user) && user.role !== 'admin') {
      return Response.json({ error: 'Council standing required.' }, { status: 403 });
    }

    const svc = base44.asServiceRole.entities;
    const now = new Date();
    const body = await req.json().catch(() => ({}));
    const deep = body?.deep === true;

    const [lots, offers, sessions, submitted, marks, obligations, crew, logs] = await Promise.all([
      svc.hall_lot.list('-created_date', 400),
      svc.buyback_offer.filter({ status: 'offered' }, '-created_date', 200),
      svc.operation_session.filter({ status: 'underway' }, '-started_at', 100),
      svc.labour_task.filter({ status: 'submitted' }, 'submitted_at', 200),
      svc.standing_event.filter({ voided: false }, 'expires_at', 400),
      svc.hall_obligation.list('-incurred_at', 200),
      svc.crew_member.filter({ active: true }, '-created_date', 200),
      svc.time_log.filter({ status: 'confirmed' }, '-created_date', 400),
    ]);

    const lotsById = Object.fromEntries(lots.map((l: any) => [l.id, l]));

    let findings: any[] = [
      ...checkSweepLiveness({ lots, offers, sessions, tasks: submitted, marks } as any, now),
      ...checkReferentialHealth({ obligations, lotsById, logs, crew } as any),
    ];

    // Silence is its own evidence: a sweep that stops running stops writing its record too.
    const runs = await svc.sweep_run.list('-finished_at', 200);
    const lastByJob: Record<string, string> = {};
    for (const run of runs) {
      if (run.job && !lastByJob[run.job]) lastByJob[run.job] = run.finished_at;
    }
    const sweeps = Object.entries(SWEEP_SILENCE_HOURS).map(([job, hours]) => {
      const last = lastByJob[job] || '';
      const silentFor: number | null = last ? (now.getTime() - new Date(last).getTime()) / 3600000 : null;
      const overdue = silentFor !== null ? silentFor > hours : null;
      if (overdue && silentFor !== null) {
        findings.push({
          check: `sweep_silent.${job}`,
          severity: job === 'closeHallLots' ? 'critical' : 'warn',
          summary: `${job} has not reported in for ${Math.round(silentFor)} hours.`,
          what_it_means: 'The job is not running, or is failing before it can record anything. A stopped sweep throws nothing and looks exactly like a quiet week.',
          what_to_do: `Check the scheduled automation for ${job}, then look in debug_log for its source.`,
          entity_type: 'sweep_run',
        });
      }
      return { job, last_run_at: last, silent_hours: silentFor === null ? null : Math.round(silentFor), expected_within_hours: hours, overdue };
    });

    const neverRan = sweeps.filter((s) => !s.last_run_at).map((s) => s.job);
    if (neverRan.length > 0) {
      findings.push({
        check: 'sweep_never_recorded',
        severity: 'info',
        summary: `${neverRan.length} job(s) have never recorded a run: ${neverRan.join(', ')}.`,
        what_it_means: 'Either they are not registered as automations, or they have not fired since run-recording was added. The first is serious; the second sorts itself out within a day.',
        what_to_do: 'If it has been more than a day, check the automation is registered.',
        entity_type: 'sweep_run',
      });
    }

    // The expensive checks: recomputing every cached total from its event log.
    if (deep) {
      const [users, standingEvents, tradeEvents, tasks] = await Promise.all([
        svc.User.list('-created_date', 500),
        svc.standing_event.list('-created_date', 2000),
        svc.trade_event.list('-created_date', 2000),
        svc.labour_task.filter({ status: 'claimed' }, '-created_date', 300),
      ]);
      const byMember: Record<string, any[]> = {};
      for (const e of standingEvents) {
        if (!e.member_user_id) continue;
        (byMember[e.member_user_id] ||= []).push(e);
      }
      const byPatron: Record<string, any[]> = {};
      for (const e of tradeEvents) {
        if (!e.patron_user_id) continue;
        (byPatron[e.patron_user_id] ||= []).push(e);
      }
      findings = [
        ...findings,
        ...checkStandingTotals(users, byMember, now),
        ...checkTradeTotals(users, byPatron, now),
        ...checkCrewIntegrity([...tasks, ...submitted]),
      ];
    }

    const ranked = rank(findings);
    return Response.json({
      checked_at: now.toISOString(),
      deep,
      ...summarise(ranked),
      findings: ranked,
      counts: {
        critical: ranked.filter((f: any) => f.severity === 'critical').length,
        warn: ranked.filter((f: any) => f.severity === 'warn').length,
        info: ranked.filter((f: any) => f.severity === 'info').length,
      },
      sweeps,
      note: deep
        ? 'Deep check: cached totals were recomputed from their event logs.'
        : 'Fast check. Pass deep:true to also recompute every cached standing total from its events — slower, and the only way to catch a drifted cache.',
    });
  } catch (error) {
    await reportError(base44, { source: 'runHealthCheck', error, route: 'runHealthCheck' });
    return Response.json({ error: error.message }, { status: 500 });
  }
}
