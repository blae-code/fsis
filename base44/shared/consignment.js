/**
 * Selling somebody else's property on their behalf.
 *
 * The missing middle of the yard's three ways to take in stock:
 *
 *   BUYBACK      we buy it outright at a fraction of market. Instant cash for them, all the risk
 *                and all the tied-up capital ours.
 *   CONSIGNMENT  it stays theirs. It goes on our shelf at a full retail price, and when it sells
 *                they get the money less our cut. Slower for them, better for them, and it costs
 *                the collective nothing but shelf space.
 *   THE HALL     they sell it themselves to another member. We keep the hall and take a commission
 *                on the close.
 *
 * A yard with a storefront already built should almost always prefer consignment to buyback: it
 * turns stock without tying up cash, and the seller gets more. Buyback exists for the comrade who
 * needs credits tonight, and it should be described to them as exactly that.
 *
 * Two things follow from the item never becoming ours, and they run through everything here:
 *
 *   1. IT IS NEVER OUR CAPITAL. Consigned stock is excluded from what the yard counts as tied up.
 *   2. WHEN IT SELLS, WE OWE THEM. The buyer pays FSIS at the storefront, so the collective is
 *      genuinely holding a comrade's money until it hands it over. That is a debt the other way
 *      round from everything else in this app, and it is tracked as one.
 */

import { roundAuec, percentOfAuec } from './money.js';

/**
 * What the yard keeps for selling somebody else's goods.
 *
 * Higher than the hall's 5%, because this uses shelf space, storefront traffic and somebody's time
 * pricing and handling it — where the hall is a room the collective merely keeps. Deliberately far
 * below what a real pawnbroker takes: the point is that consignment should be obviously better for
 * a comrade than buyback, or nobody will use it and they will all take the worse deal.
 */
export const DEFAULT_COMMISSION_PERCENT = 15;

/** How long a consignment sits before it is returned rather than left to gather dust. */
export const DEFAULT_TERM_DAYS = 60;
export const MAX_TERM_DAYS = 180;

export const CONSIGNMENT_STATES = [
  'proposed',   // offered by the comrade, not yet on the shelf
  'listed',     // on the storefront, theirs still
  'sold',       // a buyer took it; we owe them
  'settled',    // we have paid them
  'returned',   // term ran out, given back
  'withdrawn',  // they took it back
  'declined',   // the council did not take it on
];

/** Every state can reach one of these. A consignment must never be able to hang forever. */
export const TERMINAL_STATES = ['settled', 'returned', 'withdrawn', 'declined'];

/** While in one of these, the item is committed to us and cannot be sold elsewhere. */
export const LIVE_STATES = ['proposed', 'listed', 'sold'];

export const isTerminal = (state) => TERMINAL_STATES.includes(state);
export const isLive = (state) => LIVE_STATES.includes(state);

/**
 * What the comrade gets, and what the yard keeps.
 *
 * The remainder goes to the CONSIGNOR rather than to us. It is their property and their sale; if a
 * credit cannot be split evenly it belongs on their side of the line. The two figures always add up
 * to exactly what the buyer paid — a collective that quietly keeps the rounding is a collective
 * skimming, however small the sum.
 */
export function splitSale(saleAuec, commissionPercent = DEFAULT_COMMISSION_PERCENT) {
  const sale = Math.max(0, roundAuec(saleAuec));
  const pct = Math.min(100, Math.max(0, Number(commissionPercent) || 0));
  if (sale === 0) return { sale_auec: 0, commission_auec: 0, payout_auec: 0, commission_percent: pct };

  const commission = Math.min(sale, percentOfAuec(sale, pct));
  return {
    sale_auec: sale,
    commission_auec: commission,
    payout_auec: roundAuec(sale - commission),
    commission_percent: pct,
  };
}

/**
 * Whether a price clears what the consignor said they would accept.
 *
 * The floor is the seller's own figure and the yard prices above it, not through it. A shelf price
 * that would leave them less than their floor is refused rather than quietly accepted — the whole
 * point of asking for a floor is that it means something.
 */
export function meetsFloor(saleAuec, floorAuec, commissionPercent = DEFAULT_COMMISSION_PERCENT) {
  const floor = Math.max(0, roundAuec(floorAuec));
  if (floor === 0) return { ok: true, reason: '' };
  const { payout_auec } = splitSale(saleAuec, commissionPercent);
  if (payout_auec >= floor) return { ok: true, reason: '' };
  return {
    ok: false,
    reason: `That would pay the consignor ${payout_auec.toLocaleString()} aUEC after the ${commissionPercent}% cut, and they said they would not go below ${floor.toLocaleString()}. Price it higher, or ask them to lower their floor — never simply through it.`,
  };
}

/** The least the shelf price can be while still clearing their floor. */
export function minimumShelfPrice(floorAuec, commissionPercent = DEFAULT_COMMISSION_PERCENT) {
  const floor = Math.max(0, roundAuec(floorAuec));
  if (floor === 0) return 0;
  const pct = Math.min(99, Math.max(0, Number(commissionPercent) || 0));
  return roundAuec(Math.ceil(floor / (1 - pct / 100)));
}

/** When this consignment's term runs out. */
export function termEndsAt(from = new Date(), days = DEFAULT_TERM_DAYS) {
  const d = Math.min(MAX_TERM_DAYS, Math.max(1, Math.floor(Number(days) || DEFAULT_TERM_DAYS)));
  return new Date(from.getTime() + d * 86400000).toISOString();
}

/** Whether the term has run out on a consignment still sitting on the shelf. */
export function termExpired(consignment, now = new Date()) {
  if (!consignment || consignment.status !== 'listed') return false;
  if (!consignment.term_ends_at) return false;
  const ends = new Date(consignment.term_ends_at);
  return !Number.isNaN(ends.getTime()) && ends <= now;
}

/**
 * Whether the comrade may take their property back.
 *
 * At any time before it sells, without a reason and without penalty. It is theirs — a consignment
 * that traps somebody's own goods on our shelf would be the worst possible version of this.
 */
export function canWithdraw(consignment) {
  if (!consignment) return { allowed: false, reason: 'No such consignment.' };
  if (consignment.status === 'sold') {
    return {
      allowed: false,
      reason: 'This has already sold, so there is nothing to take back — what is owed to you is the money, and that is settled separately.',
    };
  }
  if (isTerminal(consignment.status)) {
    return { allowed: false, reason: `This consignment is already ${consignment.status}.` };
  }
  return { allowed: true, reason: '' };
}

/** What the comrade is owed and has not been handed. */
export function outstandingPayout(consignment) {
  if (!consignment || consignment.status !== 'sold') return 0;
  return Math.max(0, roundAuec(consignment.payout_auec));
}
