/**
 * Reading a whole set without quietly reading part of one.
 *
 * Twenty-five reads in this app asked an entity for everything and took whatever came back. That is
 * two problems wearing one coat.
 *
 * The obvious one is load: an unbounded read gets slower as the yard grows and is a lever anybody
 * can pull.
 *
 * The dangerous one is silence. Put a limit on it and the read stops being unbounded — but if the
 * set is ever larger than the limit, the function carries on with PART of the answer and says
 * nothing. On the pay day path that is not a performance concern; it is a comrade not being paid.
 * `closePaydayCycle` reads every contractor in order to exclude them from the share pool, and reads
 * every election in order to honour it. Truncate the first and a contractor draws from the members'
 * pool, against a stated hard rule. Truncate the second and somebody who asked to cash in is
 * silently deferred instead.
 *
 * So a bounded read here reports whether it saturated, and the money path REFUSES rather than
 * settling on a partial set. Failing to run a pay day is a bad afternoon; paying the wrong people is
 * a thing the collective cannot take back.
 */

/** Generous enough that reaching one means something is genuinely unusual. */
export const CAPS = {
  roster: 1000,      // crew_member — every hand who has ever flown
  elections: 2000,   // payday_election — one per member per cycle
  members: 2000,     // User by role
  cycles: 50,        // payday_cycle — one open at a time by design
  orders: 500,
  settings: 200,
  general: 1000,
};

/** Raised when a set the caller needed in full came back truncated. */
export class TruncatedReadError extends Error {
  constructor(what, cap) {
    super(
      `Read ${what} hit its limit of ${cap}, so this is only part of the set. `
      + 'Refusing to continue: acting on part of the answer here would mis-pay somebody, and that '
      + 'is not a thing the collective can take back. Raise the cap in shared/paging.js and run again.',
    );
    this.name = 'TruncatedReadError';
    this.what = what;
    this.cap = cap;
    this.truncated = true;
  }
}

/**
 * Read up to `cap`, and say whether there was more.
 *
 * Asks for one more than the cap so saturation is a fact rather than a guess — a set of exactly
 * `cap` rows is otherwise indistinguishable from a set that was cut off.
 *
 * @param {any} entityRef      e.g. base44.asServiceRole.entities.payday_election
 * @param {any} query
 * @param {string} sort
 * @param {number} cap
 * @returns {Promise<{ rows: any[], truncated: boolean }>}
 */
export async function readBounded(entityRef, query, sort = '-created_date', cap = CAPS.general) {
  const rows = await entityRef.filter(query, sort, cap + 1);
  if (Array.isArray(rows) && rows.length > cap) {
    return { rows: rows.slice(0, cap), truncated: true };
  }
  return { rows: rows || [], truncated: false };
}

/**
 * The same, for a caller that cannot proceed on a partial set.
 *
 * Throws rather than returning a flag, because the whole point is that it must not be possible to
 * ignore. Every use of this is somewhere a partial answer would move money.
 *
 * @returns {Promise<any[]>}
 */
export async function readAllOrRefuse(entityRef, query, sort, cap, what) {
  const { rows, truncated } = await readBounded(entityRef, query, sort, cap);
  if (truncated) throw new TruncatedReadError(what, cap);
  return rows;
}

/** The same as readBounded, for a `.list()` with no query. */
export async function listBounded(entityRef, sort = '-created_date', cap = CAPS.general) {
  const rows = await entityRef.list(sort, cap + 1);
  if (Array.isArray(rows) && rows.length > cap) {
    return { rows: rows.slice(0, cap), truncated: true };
  }
  return { rows: rows || [], truncated: false };
}
