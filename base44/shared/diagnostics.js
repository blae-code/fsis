/**
 * Knowing what the app is doing, and what it has quietly stopped doing.
 *
 * Two failures this exists for, and the second is the dangerous one.
 *
 * The first is loud: something throws, a comrade sees a 500, and somebody has to work out why from
 * a platform log with no context. Every function catches its own error and returns the message —
 * which tells the comrade nothing useful and leaves no record anybody can search later.
 *
 * The second is silent, and it is the one that will actually hurt. Nearly everything time-sensitive
 * in this app is a scheduled sweep: lots close, marks lapse, commissions are chased, reminders go
 * out, stale reviews are escalated. If a sweep stops running, NOTHING ERRORS. The hall keeps taking
 * bids and never sells anything. Marks never lapse, so comrades stay penalised past their sentence.
 * Filed work is never escalated, so somebody goes unpaid. Every one of those looks exactly like a
 * quiet week.
 *
 * So the checks below are written to catch a stopped sweep by its EVIDENCE rather than by asking the
 * sweep whether it ran: a lot past its closing time is proof `closeHallLots` is not running, whatever
 * the schedule claims. That way a broken automation is visible even if the thing meant to report it
 * is the thing that broke.
 *
 * Every finding says what it means and what to do about it. A diagnostic that only says something is
 * wrong hands the reader a second problem.
 */

import { totalFromEvents } from './reputation.js';
import { totalFromTradeEvents } from './trade.js';
import { activeHands, handsNeeded } from './tasks.js';
import { isLive, hasClosed } from './hall.js';

export const SEVERITIES = ['critical', 'warn', 'info'];

const DAY = 86400000;

/** One finding, in the shape every check returns. */
function finding(check, severity, summary, means, todo, extra = {}) {
  return { check, severity, summary, what_it_means: means, what_to_do: todo, ...extra };
}

/**
 * A cached total that has drifted from the events it is computed from.
 *
 * The standing on a member record is a cache; the events are the truth. If they disagree, somebody
 * is being shown — and priced at — a number that is not what their record actually says.
 *
 * @returns {any[]}
 */
export function checkStandingTotals(users, eventsByUserId, now = new Date()) {
  /** @type {any[]} */
  const out = [];
  for (const user of users || []) {
    const events = eventsByUserId?.[user.id] || [];
    if (events.length === 0) continue;
    const truth = totalFromEvents(events, now);
    const cached = Number(user.reputation) || 0;
    if (truth !== cached) {
      out.push(finding(
        'standing_total_drift', 'critical',
        `${user.handle || user.email}: standing cached as ${cached}, events say ${truth}.`,
        'The member record is a cache of the event log. They are being shown, and priced at, a figure their own record does not support.',
        'Run recomputeStanding for this comrade. If several have drifted, something is writing standing_event without recomputing — find that path.',
        { entity_type: 'User', entity_id: user.id, cached, truth },
      ));
    }
  }
  return out;
}

/** The same, for the buyer's ledger. Kept separate, as the two ledgers always are. */
export function checkTradeTotals(users, eventsByUserId, now = new Date()) {
  /** @type {any[]} */
  const out = [];
  for (const user of users || []) {
    const events = eventsByUserId?.[user.id] || [];
    if (events.length === 0) continue;
    const truth = totalFromTradeEvents(events, now);
    const cached = Number(user.trade_standing) || 0;
    if (truth !== cached) {
      out.push(finding(
        'trade_total_drift', 'critical',
        `${user.handle || user.email}: trade standing cached as ${cached}, events say ${truth}.`,
        'A buyer is carrying a surcharge or discount their own record does not support.',
        'Run recomputeTradeStanding for this comrade.',
        { entity_type: 'User', entity_id: user.id, cached, truth },
      ));
    }
  }
  return out;
}

/**
 * A task whose crew fields disagree with each other.
 *
 * crew_count is a compare-and-swap token: if it drifts from the real crew, claims start failing for
 * no visible reason, or worse, stop being safe.
 *
 * @returns {any[]}
 */
export function checkCrewIntegrity(tasks) {
  /** @type {any[]} */
  const out = [];
  for (const task of tasks || []) {
    const active = activeHands(task);
    const count = Number(task.crew_count);
    const ids = task.crew_user_ids || [];

    if ((task.crew || []).length > 0 && Number.isFinite(count) && count !== active.length) {
      out.push(finding(
        'crew_count_drift', 'critical',
        `"${task.title}": crew_count is ${count}, but ${active.length} hands are actually on.`,
        'crew_count is the token that makes claiming atomic. Drifted, it either rejects every claim or stops protecting the last place.',
        'Rewrite the task through crewFields() to bring the three fields back into step.',
        { entity_type: 'labour_task', entity_id: task.id },
      ));
    }
    if (ids.length !== active.length) {
      out.push(finding(
        'crew_index_drift', 'warn',
        `"${task.title}": crew_user_ids has ${ids.length} entries for ${active.length} active hands.`,
        'That index is what row-level security reads. Wrong, it either hides a task from a hand who holds it or shows it to somebody who does not.',
        'Rewrite through crewFields().',
        { entity_type: 'labour_task', entity_id: task.id },
      ));
    }
    if (active.length > handsNeeded(task)) {
      out.push(finding(
        'task_over_crewed', 'warn',
        `"${task.title}" has ${active.length} hands for ${handsNeeded(task)} places.`,
        'More comrades hold this work than it asked for, so the credit splits further than anybody agreed.',
        'Check whether the atomic claim is being bypassed by a direct write.',
        { entity_type: 'labour_task', entity_id: task.id },
      ));
    }
  }
  return out;
}

/**
 * Whether the scheduled sweeps are actually running — detected by their evidence.
 *
 * This is the important check. It never asks a sweep whether it ran; it looks for work the sweep
 * would have done. A lot past its closing time can only mean closeHallLots is not running.
 *
 * @returns {any[]}
 */
export function checkSweepLiveness({ lots = [], offers = [], sessions = [], tasks = [], marks = [] } = {}, now = new Date()) {
  /** @type {any[]} */
  const out = [];

  const overdueLots = lots.filter((lot) => isLive(lot.status) && hasClosed(lot, now));
  if (overdueLots.length > 0) {
    out.push(finding(
      'sweep_stopped.closeHallLots', 'critical',
      `${overdueLots.length} lot(s) are past their closing time and still open.`,
      'closeHallLots is not running. The hall keeps taking bids and never sells anything — no lot is won, no commission raised, and it looks exactly like a quiet week.',
      'Check the scheduled automation for closeHallLots. This is the single worst silent failure in the app.',
      { entity_type: 'hall_lot', count: overdueLots.length, oldest: overdueLots[0]?.id },
    ));
  }

  const staleOffers = offers.filter((o) => o.status === 'offered' && o.expires_at && new Date(o.expires_at) <= now);
  if (staleOffers.length > 0) {
    out.push(finding(
      'sweep_stopped.expireBuybackOffers', 'warn',
      `${staleOffers.length} buyback offer(s) are past their expiry and still open.`,
      'expireBuybackOffers is not running. A member could accept a price the collective would no longer agree to, and one of us ends up short.',
      'Check the scheduled automation for expireBuybackOffers.',
      { entity_type: 'buyback_offer', count: staleOffers.length },
    ));
  }

  const expiredMarks = marks.filter((m) => !m.voided && m.expires_at && new Date(m.expires_at) <= now
    && (Number(m.effective_delta) || 0) !== 0);
  if (expiredMarks.length > 0) {
    out.push(finding(
      'sweep_stopped.lapseStandingMarks', 'critical',
      `${expiredMarks.length} mark(s) are past their lifetime and still counting.`,
      'lapseStandingMarks is not running. Comrades are being penalised past the sentence they were given, and paying a surcharge they no longer owe.',
      'Check the scheduled automation for lapseStandingMarks.',
      { entity_type: 'standing_event', count: expiredMarks.length },
    ));
  }

  // A clock somebody forgot to stop, which quietly mints shares.
  const longRuns = sessions.filter((s) => s.status === 'underway' && s.started_at
    && (now.getTime() - new Date(s.started_at).getTime()) > 2 * DAY);
  if (longRuns.length > 0) {
    out.push(finding(
      'session_left_open', 'warn',
      `${longRuns.length} run(s) have been underway for more than two days.`,
      'Almost certainly a clock nobody stopped. Presence keeps accruing, and the per-stint cap is the only thing standing between that and a fortnight of shares for a night\'s sleep.',
      'Close the run through closeOperationSession, or mark it abandoned if it never happened.',
      { entity_type: 'operation_session', count: longRuns.length },
    ));
  }

  const stuckReviews = tasks.filter((t) => t.status === 'submitted' && !t.review_escalated_at
    && t.submitted_at && (now.getTime() - new Date(t.submitted_at).getTime()) > 7 * DAY);
  if (stuckReviews.length > 0) {
    out.push(finding(
      'sweep_stopped.escalateStaleReviews', 'critical',
      `${stuckReviews.length} piece(s) of filed work have waited over a week with no escalation.`,
      'escalateStaleReviews is not running. Labour already given is unpaid and nobody has been told.',
      'Check the scheduled automation for escalateStaleReviews, then credit or return the work.',
      { entity_type: 'labour_task', count: stuckReviews.length },
    ));
  }

  return out;
}

/**
 * Records that point at something that is not there, or that contradict a settled state.
 * @returns {any[]}
 */
export function checkReferentialHealth({ obligations = [], lotsById = {}, logs = [], crew = [] } = {}) {
  /** @type {any[]} */
  const out = [];

  for (const debt of obligations) {
    if (!['owed', 'overdue'].includes(debt.status)) continue;
    const lot = lotsById[debt.lot_id];
    if (debt.lot_id && !lot) {
      out.push(finding(
        'obligation_orphaned', 'warn',
        `${debt.debtor_handle} owes ${Number(debt.amount_auec).toLocaleString()} aUEC on a lot that no longer exists.`,
        'A comrade is being chased, and eventually marked, for a debt nobody can point at the source of.',
        'Void the obligation, or restore the lot it came from.',
        { entity_type: 'hall_obligation', entity_id: debt.id },
      ));
    } else if (lot && lot.status === 'void') {
      out.push(finding(
        'obligation_on_void_lot', 'critical',
        `${debt.debtor_handle} still owes commission on a voided lot.`,
        'The sale was set aside but the debt was not. They will be chased, suspended and eventually marked for money they do not owe.',
        'Void or waive the obligation through settleHallObligation.',
        { entity_type: 'hall_obligation', entity_id: debt.id },
      ));
    }
  }

  const unkeyed = logs.filter((l) => l.status === 'confirmed' && !l.member_user_id);
  if (unkeyed.length > 0) {
    out.push(finding(
      'time_log_unkeyed', 'info',
      `${unkeyed.length} confirmed time log(s) carry only a callsign, not an account.`,
      'These still settle correctly through the callsign fallback, but a comrade who is renamed would be cut off from them.',
      'Link the roster places to accounts (crew_member.user_id); new logs are written keyed already.',
      { entity_type: 'time_log', count: unkeyed.length },
    ));
  }

  const unlinked = crew.filter((m) => m.active !== false && !m.user_id);
  if (unlinked.length > 0) {
    out.push(finding(
      'roster_unlinked', 'warn',
      `${unlinked.length} roster place(s) are not linked to an account.`,
      'Pay still resolves by callsign for these, but the guard that stops one comrade reading another\'s shares does not apply until a place is linked.',
      'Link them from the crew roster screen.',
      { entity_type: 'crew_member', count: unlinked.length },
    ));
  }

  return out;
}

/** Findings worst-first, so whoever is reading has the important thing at the top. */
export function rank(findings) {
  const order = { critical: 0, warn: 1, info: 2 };
  return [...(findings || [])].sort(
    (a, b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3) || String(a.check).localeCompare(String(b.check)),
  );
}

/** A one-line verdict, for a badge or a log line. */
export function summarise(findings) {
  const f = findings || [];
  const critical = f.filter((x) => x.severity === 'critical').length;
  const warn = f.filter((x) => x.severity === 'warn').length;
  if (critical > 0) return { state: 'critical', headline: `${critical} critical, ${warn} to look at.` };
  if (warn > 0) return { state: 'warn', headline: `${warn} to look at.` };
  return { state: 'ok', headline: 'Nothing outstanding.' };
}

/**
 * Record that something went wrong, without ever making it worse.
 *
 * Reporting a failure must never throw a second one — a logger that can take down the caller is a
 * liability, not a tool. Everything here is swallowed, and the original error is always returned to
 * the caller unchanged so behaviour does not shift just because logging was added.
 */
/**
 * @param {any} base44
 * @param {{ source: string, error: any, route?: string, context?: any, severity?: string }} report
 */
export async function reportError(base44, { source, error, route = '', context = {}, severity = 'error' }) {
  try {
    await base44.asServiceRole.entities.debug_log.create({
      severity,
      source: String(source || 'unknown').slice(0, 120),
      message: String(error?.message || error || 'unknown error').slice(0, 2000),
      stack: String(error?.stack || '').slice(0, 4000),
      route: String(route || '').slice(0, 200),
      context: JSON.stringify(context || {}).slice(0, 4000),
      resolved: false,
    });
  } catch {
    // Nothing. If the log itself cannot be written there is no third place to complain to,
    // and the caller's own failure is the one that matters.
  }
}

/**
 * Record that a scheduled sweep ran, and what it did.
 *
 * The point is the ABSENCE. A sweep that stops running writes nothing, so the useful question is
 * "when did this last run?" rather than "did it error?" — and that question needs a row to ask of.
 */
/**
 * @param {any} base44
 * @param {{ job: string, ok?: boolean, outcome?: any, error?: any, startedAt?: any }} run
 */
export async function recordSweep(base44, { job, ok = true, outcome = {}, error = null, startedAt }) {
  try {
    const finishedAt = new Date();
    await base44.asServiceRole.entities.sweep_run.create({
      job: String(job || 'unknown').slice(0, 120),
      ok: !!ok && !error,
      started_at: startedAt ? new Date(startedAt).toISOString() : finishedAt.toISOString(),
      finished_at: finishedAt.toISOString(),
      duration_ms: startedAt ? finishedAt.getTime() - new Date(startedAt).getTime() : 0,
      outcome: JSON.stringify(outcome || {}).slice(0, 2000),
      error_message: error ? String(error.message || error).slice(0, 1000) : '',
    });
  } catch {
    // Same reasoning as above.
  }
}
