/**
 * The run itself, as distinct from the notice that called it.
 *
 * An operation has been a notice board with a status flag: it said a run was intended, and said
 * nothing about whether it happened, who turned up, what it made or what it cost. So nothing an
 * operation produced could pay anybody, and `completed` simply erased the run.
 *
 * The centre of gravity is the live session. RSVP is intent; attendance is fact; and only fact may
 * pay people. That sentence is the whole design:
 *
 *   - presence is recorded as STINTS, because hands join and leave over a long run and a single
 *     "was there" cannot weight a share honestly;
 *   - a stint is a plain record of arriving and leaving, never a measure of how hard anyone worked;
 *   - minutes become shares at the rate the time log has always documented — one share per twenty
 *     confirmed minutes — so a session settles into the same pool by the same arithmetic as every
 *     other hour the collective has ever counted.
 */

import { roundShares } from './money.js';

/** The rate `time_log` has always stated. Changing it here changes what an hour is worth. */
export const MINUTES_PER_SHARE = 20;

/** A run longer than this is almost certainly a clock somebody forgot to stop. */
export const MAX_STINT_MINUTES = 16 * 60;

const ms = (value) => (value ? new Date(value).getTime() : NaN);

/** A hand arriving. Their own claim to have been present, or the council recording it for them. */
export function openStint(user, at = new Date()) {
  return {
    user_id: user.id,
    handle: user.handle || user.full_name || user.email,
    email: user.email,
    joined_at: at.toISOString(),
    left_at: '',
    minutes: 0,
  };
}

/** Whether this hand is presently on the run. */
export function isPresent(attendance, userId) {
  return (attendance || []).some((stint) => stint.user_id === userId && !stint.left_at);
}

/**
 * Minutes in one stint. An open stint is counted up to `now`, so a roster read mid-run shows time
 * accruing rather than zero.
 *
 * A stint that outruns a working day is capped rather than trusted: a clock left running overnight
 * would otherwise hand somebody a fortnight of shares for a night's sleep.
 */
export function stintMinutes(stint, now = new Date()) {
  const from = ms(stint?.joined_at);
  if (!Number.isFinite(from)) return 0;
  const to = stint?.left_at ? ms(stint.left_at) : now.getTime();
  if (!Number.isFinite(to) || to <= from) return 0;
  return Math.min(MAX_STINT_MINUTES, Math.floor((to - from) / 60000));
}

/** Everything one hand was present for, across however many times they came and went. */
export function minutesPresent(attendance, userId, now = new Date()) {
  return (attendance || [])
    .filter((stint) => stint.user_id === userId)
    .reduce((total, stint) => total + stintMinutes(stint, now), 0);
}

/**
 * The roster: who stood the run, and for how long.
 * One line per comrade however many times they came and went.
 *
 * @returns {any[]}
 */
export function roster(attendance, now = new Date()) {
  const byHand = new Map();
  for (const stint of attendance || []) {
    if (!stint?.user_id) continue;
    const seen = byHand.get(stint.user_id) || {
      user_id: stint.user_id,
      handle: stint.handle || '',
      email: stint.email || '',
      minutes: 0,
      stints: 0,
      present_now: false,
    };
    seen.minutes += stintMinutes(stint, now);
    seen.stints += 1;
    seen.present_now = seen.present_now || !stint.left_at;
    if (!seen.handle && stint.handle) seen.handle = stint.handle;
    byHand.set(stint.user_id, seen);
  }
  return [...byHand.values()]
    .map((hand) => ({ ...hand, shares: sharesFor(hand.minutes) }))
    .sort((a, b) => b.minutes - a.minutes);
}

/** Minutes into shares, at the rate the time log has always used. */
export function sharesFor(minutes) {
  const m = Math.max(0, Math.floor(Number(minutes) || 0));
  return roundShares(m / MINUTES_PER_SHARE);
}

/** Everything the run cost, before anything is divided. */
export function totalCosts(costs) {
  return (costs || []).reduce((total, cost) => {
    const amount = Number(cost?.amount_auec);
    return total + (Number.isFinite(amount) && amount > 0 ? amount : 0);
  }, 0);
}

/**
 * Who answered the muster and did not stand it.
 *
 * Named rather than scored. A no-show is a fact for the council to weigh with whatever the comrade
 * has to say about it — not a mark applied by arithmetic. Life happens, and a system that penalises
 * absence automatically will penalise illness, work and family without ever knowing it did.
 *
 * @returns {any[]}
 */
export function noShows(rsvps, attendance) {
  const stood = new Set((attendance || []).map((stint) => stint.user_id).filter(Boolean));
  return (rsvps || [])
    .filter((rsvp) => rsvp?.response === 'in' && rsvp.user_id && !stood.has(rsvp.user_id))
    .map((rsvp) => ({ user_id: rsvp.user_id, handle: rsvp.handle || '' }));
}
