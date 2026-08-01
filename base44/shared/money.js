/**
 * One rule for money, kept in one place.
 *
 * A shelf price, a discount, a share and a payout are all the same aUEC in the end, and a comrade
 * reading back what they were paid must be able to add it up by hand and reach the figure we
 * reached. When every function rounds in its own way the numbers drift apart by a credit here and
 * a credit there — and every one of those credits came out of somebody's labour. Worse, the drift
 * is invisible: nothing errors, the totals simply stop agreeing with each other.
 *
 * So the rules are stated once, named for what they are, and shared by everything that touches a
 * sum. Three rules, and no fourth without it being written down here:
 *
 *   - a settled sum changes hands in whole credits          -> roundAuec
 *   - a shelf price sits on the storefront's increment      -> roundPrice
 *   - shares are held to two places, being a division       -> roundShares
 */

/** The storefront quotes in hundreds of aUEC, so shelf figures land on that increment. */
export const PRICE_INCREMENT_AUEC = 100;

/** Shares divide a pool, so they carry two places rather than pretending to be whole. */
export const SHARE_DECIMAL_PLACES = 2;

/**
 * Anything that is not a real, finite number is worth nothing — not NaN, not Infinity, which
 * would otherwise travel silently into a payout and out the other side as a figure nobody can
 * account for. Negative zero is flattened too: it is not a debt, and no comrade should ever
 * read "-0" on a statement of what they are owed.
 */
const numeric = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return n === 0 ? 0 : n;
};

/** Rounding can produce a negative zero of its own; it never survives past here. */
const settled = (n) => (n === 0 ? 0 : n);

/**
 * A sum that actually changes hands: a payout, a ledger line, a commission owed.
 * Whole credits, because that is the unit a comrade is paid in.
 */
export function roundAuec(value) {
  return settled(Math.round(numeric(value)));
}

/**
 * A price on the shelf. The storefront has always quoted in hundreds and buyers read it that
 * way, so every price, discount and adjustment settles on the same increment.
 */
export function roundPrice(value) {
  return settled(Math.round(numeric(value) / PRICE_INCREMENT_AUEC) * PRICE_INCREMENT_AUEC);
}

/** Shares earned against a pool, held to two places. */
export function roundShares(value) {
  const factor = 10 ** SHARE_DECIMAL_PLACES;
  return settled(Math.round(numeric(value) * factor) / factor);
}

/** A total that must never be read as owing less than nothing. */
export function roundPriceFloored(value) {
  return Math.max(0, roundPrice(value));
}

/**
 * A percentage taken off a shelf price — a discount code, a standing adjustment.
 * Rounded as a price, so the arithmetic the buyer sees on the manifest closes exactly.
 */
export function percentOfPrice(amount, percent) {
  return roundPrice((numeric(amount) * numeric(percent)) / 100);
}

/**
 * A percentage of a settled sum — the hall's commission, a fee owed.
 * Rounded to whole credits, because it is paid rather than displayed.
 */
export function percentOfAuec(amount, percent) {
  return roundAuec((numeric(amount) * numeric(percent)) / 100);
}

/** Add up a column of sums without letting one bad figure poison the total. */
export function sumAuec(values) {
  return roundAuec((values || []).reduce((total, value) => total + numeric(value), 0));
}

/** Add up shares the same way. */
export function sumShares(values) {
  return roundShares((values || []).reduce((total, value) => total + numeric(value), 0));
}
