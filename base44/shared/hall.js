/**
 * The hall — members trading with one another, FSIS keeping the hall and not the goods.
 *
 * The rules that matter most here are the ones that stop a lot becoming a trap:
 *
 *   - EVERY lot reaches a terminal state. A lot that can hang open forever is a lot somebody's
 *     property is stuck inside, and "we'll sort it out later" is how that becomes never.
 *   - ONE ITEM, ONE LIVE COMMITMENT. The same physical thing cannot sit in the hall while also
 *     offered to buyback or listed on the storefront. Selling the same wreck twice is not a bug in
 *     an auction house, it is fraud committed by accident.
 *   - A LOT THAT CAN BE SNIPED IS NOT TRUSTED. A bid in the last seconds extends the close, so the
 *     hall rewards the highest offer rather than the best connection.
 *   - FSIS RECUSES ITSELF. The council can see reserves. Any lot the council has an interest in is
 *     declared, and they do not bid on what they can see through.
 *
 * Settlement happens in-game: the hall records a trade, it does not hold the goods or the money.
 * Everything here is a record of what two comrades did, which is why both of them have to say so.
 */

import { roundAuec, percentOfAuec } from './money.js';

/** Where a lot can be in its life. */
export const LOT_STATES = [
  'draft',            // being written, not yet in the hall
  'listed',           // open, no bids yet
  'bidding',          // open, bids standing
  'won',              // closed above reserve, awaiting settlement
  'settled',          // both parties confirmed the trade happened
  'reserve_not_met',  // closed, best bid below reserve
  'no_bids',          // closed, nobody offered
  'withdrawn',        // seller pulled it
  'expired',          // ran out of time with nothing to settle
  'disputed',         // something went wrong; an Owner rules
  'void',             // set aside — a patch reset, a duplicate, an error
];

/** A lot in one of these is finished. Every other state must be able to reach one of them. */
export const TERMINAL_STATES = ['settled', 'reserve_not_met', 'no_bids', 'withdrawn', 'expired', 'void'];

/** A lot in one of these holds a live commitment on the item behind it. */
export const LIVE_STATES = ['draft', 'listed', 'bidding', 'won', 'disputed'];

/** How long a late bid pushes the close out. A hall that can be sniped is not trusted. */
export const SOFT_CLOSE_SECONDS = 120;

/** What the hall keeps for keeping the hall. */
export const DEFAULT_COMMISSION_PERCENT = 5;

/** How long a seller has to pay what they owe the hall. */
export const COMMISSION_DUE_DAYS = 30;

/** Nobody floods the hall. */
export const MAX_LIVE_LOTS_NEW_MEMBER = 3;
export const MAX_LIVE_LOTS = 20;
/** Standing at which a member is trusted with the larger allowance. */
export const ESTABLISHED_STANDING = 25;

export const isTerminal = (state) => TERMINAL_STATES.includes(state);
export const isLive = (state) => LIVE_STATES.includes(state);
export const isOpen = (state) => ['listed', 'bidding'].includes(state);

/**
 * How many lots a member may have live at once.
 *
 * New members are held to fewer until they have earned some standing — not as suspicion, but
 * because a hall filled with junk lots by one account costs every other seller their visibility,
 * and the cost of being wrong in the other direction is somebody waiting a week to list a fourth
 * item.
 */
export function liveLotAllowance(user) {
  if (!user) return 0;
  const standing = Number(user.reputation) || 0;
  if (user.standing_locked || user.trade_locked) return 0;
  return standing >= ESTABLISHED_STANDING ? MAX_LIVE_LOTS : MAX_LIVE_LOTS_NEW_MEMBER;
}

/**
 * The commission owed on a completed sale.
 * Rounded to whole credits through the shared money rule, so the hall's books and the seller's
 * arithmetic cannot disagree by a credit.
 */
export function commissionOn(saleAuec, percent = DEFAULT_COMMISSION_PERCENT) {
  return percentOfAuec(saleAuec, percent);
}

/** When commission falls due. */
export function commissionDueAt(from = new Date(), days = COMMISSION_DUE_DAYS) {
  return new Date(from.getTime() + days * 86400000).toISOString();
}

/**
 * When a lot actually closes, given a bid just landed.
 *
 * A bid inside the last two minutes pushes the close out by two minutes from THAT bid. Two comrades
 * genuinely competing keep extending it between them, which is the point: the lot goes to whoever
 * wants it most, not to whoever timed a click best.
 */
export function closeAfterBid(closesAt, bidAt = new Date(), seconds = SOFT_CLOSE_SECONDS) {
  const closes = new Date(closesAt);
  if (Number.isNaN(closes.getTime())) return null;
  const earliest = new Date(bidAt.getTime() + seconds * 1000);
  return earliest > closes ? earliest.toISOString() : closes.toISOString();
}

/** Whether a lot's time is up. */
export function hasClosed(lot, now = new Date()) {
  if (!lot?.closes_at) return false;
  const closes = new Date(lot.closes_at);
  return !Number.isNaN(closes.getTime()) && closes <= now;
}

/**
 * What a lot becomes when its time runs out.
 *
 * Every path leads somewhere terminal. A lot that met its reserve is `won` and awaits settlement;
 * one that did not is closed honestly as such rather than left open in the hope somebody bids
 * later.
 */
export function endStateFor(lot) {
  const bids = Number(lot?.bid_count) || 0;
  if (bids === 0) return 'no_bids';
  const best = roundAuec(lot?.current_bid_auec);
  const reserve = roundAuec(lot?.reserve_auec);
  return best >= reserve ? 'won' : 'reserve_not_met';
}

/**
 * Whether a bid is one the hall can accept, and why not where it cannot.
 *
 * The reserve is deliberately NOT checked here: a hall that tells bidders where the reserve sits
 * lets them find it by probing, and one that rejects bids under it tells them the same thing more
 * slowly. Bidding below the reserve is allowed and simply may not win.
 */
export function bidRefusal(lot, bidder, amountAuec, now = new Date()) {
  if (!lot) return 'No such lot.';
  if (!isOpen(lot.status)) return 'That lot is not open for bidding.';
  if (hasClosed(lot, now)) return 'That lot has closed.';
  if (lot.seller_user_id === bidder?.id) return 'You cannot bid on your own lot.';
  if (bidder?.trade_locked) return 'Your trade standing is locked, so you may not bid until the council lifts it.';

  const amount = roundAuec(amountAuec);
  if (amount <= 0) return 'A bid must be a real figure.';

  const start = roundAuec(lot.start_auec);
  if (amount < start) return `Bidding opens at ${start.toLocaleString()} aUEC.`;

  const current = roundAuec(lot.current_bid_auec);
  const step = minimumIncrement(current);
  if (current > 0 && amount < current + step) {
    return `The standing bid is ${current.toLocaleString()} aUEC; the next must be at least ${(current + step).toLocaleString()}.`;
  }
  return '';
}

/**
 * The least a bid must rise by. Proportional, so a hundred-credit step on a ten-million lot does
 * not turn an auction into a war of attrition nobody enjoys.
 */
export function minimumIncrement(currentAuec) {
  const current = roundAuec(currentAuec);
  if (current < 10000) return 100;
  if (current < 100000) return 1000;
  if (current < 1000000) return 10000;
  return 50000;
}
