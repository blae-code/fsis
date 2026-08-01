/**
 * What the work is worth, reckoned from what the work has been worth.
 *
 * "So pay does not drift by mood" is the whole point. When each brief is priced from memory, the
 * rate quietly tracks who is asking and how the council felt that week, and a comrade has no way
 * to tell whether they are being offered the going rate or an off day. Two answers were possible:
 * write a wage table into the code, or read back what the collective has actually paid for this
 * kind of labour and state it openly. A table written by whoever edited the file last is just the
 * same drift with better manners, so this reads the record.
 *
 * Three rules hold:
 *
 *   1. It suggests; it never sets. The council types the figure, and may type any figure.
 *   2. It shows its working — the rate, the sample it came from, and the hours it was applied to.
 *      A suggestion a comrade cannot audit is worth no more than a guess.
 *   3. Where there is not enough history it says so and offers NOTHING. An invented number carries
 *      the same authority as an earned one and is far worse, so we decline to invent.
 */

import { roundAuec, roundShares } from './money.js';

/** Below this many comparable jobs, the record is not yet saying anything. */
export const MIN_SAMPLE = 3;

/**
 * The middle of the range, which one unusually rich or poor job cannot drag around.
 *
 * A missing figure is discarded, never read as zero — `Number(null)` is 0, and a job with no
 * recorded credit counted as a job that paid nothing would drag the going rate down for everyone.
 */
export function median(values) {
  const sorted = (values || [])
    .filter((v) => v !== null && v !== undefined && v !== '')
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v))
    .sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** Work that was actually finished and actually paid — the only work that tells us anything. */
export function comparableTasks(tasks, category) {
  return (tasks || []).filter(
    (t) => t.status === 'credited' && t.category === category && (Number(t.credited_auec) || 0) > 0,
  );
}

/**
 * A fair sum for this brief, reckoned from comparable work already credited.
 *
 * Prefers an hourly reading, because two jobs in the same category can differ tenfold in size and
 * the hours are what separate them. Falls back to the flat rate for the category when the hours
 * were never filed — stated plainly as the weaker reading it is.
 *
 * @param {{ category?: string, estimated_hours?: number }} task
 * @param {any[]} pastTasks
 * @returns {{ suggested_auec: number|null, basis: string, sample_size: number, rate_auec: number, per: string }}
 */
export function suggestCredit(task, pastTasks) {
  const category = task?.category || '';
  const comparable = comparableTasks(pastTasks, category);
  const hours = Number(task?.estimated_hours) || 0;

  const none = (basis) => ({ suggested_auec: null, basis, sample_size: comparable.length, rate_auec: 0, per: '' });

  if (comparable.length < MIN_SAMPLE) {
    return none(
      `Not enough comparable work yet — ${comparable.length} credited ${category || 'task'}${comparable.length === 1 ? '' : 's'} on record, and a figure is not offered below ${MIN_SAMPLE}. Set the credit by judgement and say why.`,
    );
  }

  // The hourly reading, where the hands who did the work told us how long it took.
  const timed = comparable.filter((t) => (Number(t.actual_hours) || 0) > 0);
  if (hours > 0 && timed.length >= MIN_SAMPLE) {
    const perHour = median(timed.map((t) => Number(t.credited_auec) / Number(t.actual_hours)));
    return {
      suggested_auec: roundAuec(perHour * hours),
      basis: `${roundAuec(perHour).toLocaleString()} aUEC per hour — the middle of ${timed.length} credited ${category} task${timed.length === 1 ? '' : 's'} where the hours were filed — applied to the ${roundShares(hours)} hours estimated for this one.`,
      sample_size: timed.length,
      rate_auec: roundAuec(perHour),
      per: 'hour',
    };
  }

  // The flat reading. Weaker, and said to be weaker.
  const perTask = median(comparable.map((t) => Number(t.credited_auec)));
  return {
    suggested_auec: roundAuec(perTask),
    basis: `${roundAuec(perTask).toLocaleString()} aUEC — the middle of ${comparable.length} credited ${category} task${comparable.length === 1 ? '' : 's'}. ${hours > 0 ? 'Too few of those recorded their hours to reckon by the hour' : 'No hours were estimated for this brief'}, so this compares whole jobs and does not account for size.`,
    sample_size: comparable.length,
    rate_auec: roundAuec(perTask),
    per: 'task',
  };
}
