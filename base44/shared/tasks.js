/**
 * Work that takes more than one pair of hands.
 *
 * A task held one person at a time cannot describe most of what the yard actually does. Stripping a
 * Reclaimer wants three scrapers; a convoy wants a hauler and an escort. Until now the council had
 * to post the same brief three times and hope the right people took the right copy, which is not
 * organising work — it is hoping.
 *
 * So a task carries a crew. The rules below are about keeping that honest:
 *
 *   - Nobody is assigned. Every hand on the crew put themselves there, and may take themselves off.
 *   - A task is never over-crewed, and the check is atomic. Two comrades claiming the last place at
 *     the same moment must not both get it — `crew_count` is the compare-and-swap token that makes
 *     the claim safe without a lock.
 *   - Credit divides equally by default. Hands who did the same work are paid the same for it, and
 *     the remainder is handed out rather than rounded away, so what the crew is paid always adds up
 *     to exactly what the task agreed.
 *   - The old single-hand fields are kept in step as a mirror of the lead hand, so nothing that
 *     reads a task the old way breaks.
 */

import { roundAuec } from './money.js';

/** Most work still wants one pair of hands. */
export const DEFAULT_HANDS_NEEDED = 1;

/** A crew larger than this is a muster, not a task — that is Phase 4.8's business. */
export const MAX_HANDS = 12;

/** How many hands this task asks for. */
export function handsNeeded(task) {
  const n = Math.floor(Number(task?.hands_needed) || DEFAULT_HANDS_NEEDED);
  return Math.min(MAX_HANDS, Math.max(1, n));
}

/**
 * The hands presently holding the work. A hand who stepped off is kept, but no longer counted.
 * @returns {any[]}
 */
export function activeHands(task) {
  return (task?.crew || []).filter((hand) => hand && hand.user_id && !hand.released_at);
}

/** Whether this comrade already has their hands on this work. */
export function holdsTask(task, userId) {
  return !!userId && activeHands(task).some((hand) => hand.user_id === userId);
}

/** Whether the task has all the hands it asked for. */
export function isFullyCrewed(task) {
  return activeHands(task).length >= handsNeeded(task);
}

/** Every active hand has filed their own account of the work. */
export function allHandsFiled(task) {
  const hands = activeHands(task);
  return hands.length > 0 && hands.every((hand) => !!hand.submitted_at);
}

/**
 * The lead hand — the first to take the work up and still holding it. The old single-hand fields
 * mirror this one, so a screen or a function that never learned about crews still reads something
 * true rather than something empty.
 */
export function leadHand(task) {
  const hands = activeHands(task);
  if (hands.length === 0) return null;
  return [...hands].sort((a, b) => String(a.claimed_at || '').localeCompare(String(b.claimed_at || '')))[0];
}

/**
 * The fields to write when a crew changes: the crew itself, the two indexes that make it safe to
 * claim and readable by the people on it, and the legacy mirror.
 *
 * `crew_user_ids` exists because row-level security cannot reach inside an array of objects — it is
 * what lets every hand on the crew read and update their own task, not merely the lead.
 * `crew_count` is the compare-and-swap token: a claim states the count it believed, and lands only
 * if that is still true.
 */
export function crewFields(crew) {
  const rows = (crew || []).filter((hand) => hand && hand.user_id);
  const active = rows.filter((hand) => !hand.released_at);
  const lead = [...active].sort((a, b) => String(a.claimed_at || '').localeCompare(String(b.claimed_at || '')))[0] || null;

  return {
    crew: rows,
    crew_user_ids: active.map((hand) => hand.user_id),
    crew_count: active.length,
    // The mirror. Null rather than stale when the last hand steps off.
    assigned_user_id: lead ? lead.user_id : null,
    assigned_handle: lead ? lead.handle : null,
    assigned_email: lead ? lead.email : null,
    claimed_at: lead ? lead.claimed_at : null,
  };
}

/** A comrade joining the crew. */
export function handFor(user, at = new Date()) {
  return {
    user_id: user.id,
    handle: user.handle || user.full_name || user.email,
    email: user.email,
    claimed_at: at.toISOString(),
    released_at: '',
    submitted_at: '',
    proof_notes: '',
    proof_file_url: '',
    actual_hours: 0,
    credited_auec: 0,
  };
}

/**
 * The crew with one hand's own entry rewritten — a hand only ever edits their own.
 * @returns {any[]}
 */
export function withHandUpdated(task, userId, changes) {
  return (task?.crew || []).map((hand) => (hand.user_id === userId ? { ...hand, ...changes } : hand));
}

/**
 * Divide the agreed credit among the hands.
 *
 * Equally, because hands who did the work of the task did the work of the task. The remainder is
 * not rounded away — it is handed to the earliest claimants one credit at a time, so the sum of
 * what the crew receives is exactly what was agreed. A collective that loses three credits in the
 * rounding every time is telling on itself.
 *
 * @param {number} totalAuec
 * @param {any[]} hands
 * @returns {Record<string, number>} credit per user_id
 */
export function splitCredit(totalAuec, hands) {
  const crew = (hands || []).filter((hand) => hand && hand.user_id);
  const total = roundAuec(totalAuec);
  if (crew.length === 0 || total <= 0) {
    return Object.fromEntries(crew.map((hand) => [hand.user_id, 0]));
  }

  const each = Math.floor(total / crew.length);
  let remainder = total - each * crew.length;

  const ordered = [...crew].sort((a, b) => String(a.claimed_at || '').localeCompare(String(b.claimed_at || '')));
  const split = {};
  for (const hand of ordered) {
    split[hand.user_id] = each + (remainder > 0 ? 1 : 0);
    if (remainder > 0) remainder -= 1;
  }
  return split;
}

/**
 * Work that cannot begin until other work is done.
 *
 * "Haul after strip" is an ordinary thing to want and there was no way to say it, so the council
 * said it in the brief and hoped. A prerequisite is MET when the work it names has been credited —
 * or cancelled, because work that will now never happen must not block the yard forever. Every
 * chain needs a way out; a task that can never become ready is a task nobody can do.
 */
export function prerequisiteIds(task) {
  return (task?.blocked_by || [])
    .map((link) => (typeof link === 'string' ? link : link?.task_id))
    .filter(Boolean);
}

/** A prerequisite has been settled one way or the other. */
export function isPrerequisiteMet(prereq) {
  return !!prereq && ['credited', 'cancelled'].includes(prereq.status);
}

/**
 * The prerequisites still standing in the way, named so a comrade can be told WHICH work they are
 * waiting on rather than merely that they are waiting.
 *
 * A prerequisite we cannot find is treated as met: a task whose blocker was deleted must not hang
 * forever on a record that no longer exists.
 *
 * @returns {any[]}
 */
export function unmetPrerequisites(task, prereqTasks) {
  const byId = new Map((prereqTasks || []).filter(Boolean).map((t) => [t.id, t]));
  return prerequisiteIds(task)
    .map((id) => byId.get(id))
    .filter((prereq) => prereq && !isPrerequisiteMet(prereq));
}

/** Whether the work may begin. */
export function isReady(task, prereqTasks) {
  return unmetPrerequisites(task, prereqTasks).length === 0;
}

/**
 * Would making `task` wait on `proposedIds` create a circle?
 *
 * Two tasks each waiting on the other can never begin, and neither can anything behind them. The
 * walk follows the chain outward from what is proposed; if it arrives back at the task itself, the
 * arrangement is impossible and is refused rather than written.
 */
export function wouldCycle(taskId, proposedIds, allTasks) {
  const byId = new Map((allTasks || []).filter(Boolean).map((t) => [t.id, t]));
  const seen = new Set();
  const queue = [...(proposedIds || [])];

  while (queue.length > 0) {
    const id = queue.shift();
    if (!id || seen.has(id)) continue;
    if (id === taskId) return true;
    seen.add(id);
    queue.push(...prerequisiteIds(byId.get(id)));
  }
  return false;
}

/**
 * What the board should say about a task given who is on it.
 *
 * A part-crewed task stays on the board — the whole point is that others can still join. It reads
 * as claimed only once it has the hands it asked for.
 */
export function statusForCrew(task, currentStatus) {
  if (['submitted', 'credited', 'cancelled'].includes(currentStatus)) return currentStatus;
  if (activeHands(task).length === 0) return 'posted';
  return isFullyCrewed(task) ? 'claimed' : 'posted';
}
