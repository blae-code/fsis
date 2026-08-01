/**
 * Trade standing — the buyer's side of the same failure.
 *
 * A comrade who abandons work in hand costs the collective time. A buyer who never turns up to the
 * handoff costs exactly the same time, taken from the hand who flew out to meet them. So buyers keep
 * a record too — and it is kept in a wholly separate ledger. A trade mark never touches labour
 * standing, and labour standing never excuses a no-show.
 */

/** What a completed handoff is worth, and what failures cost. */
export const TRADE_AWARD = { handoffCompleted: 2 };
export const TRADE_COST = { handoff_no_show: -10, late_cancellation: -4 };

/** How long a trade mark stands before it lapses of its own accord. */
export const TRADE_MARK_LIFETIME_DAYS = 90;

/** Bounds on what trade standing may move a price by. */
export const TRADE_MAX_DISCOUNT_PERCENT = 6;
export const TRADE_MAX_SURCHARGE_PERCENT = 10;

/** The point at which the council's lock is applied automatically, and stated. */
export const TRADE_LOCK_AT = -20;

export const TRADE_TIERS = [
  { key: 'barred', label: 'TRADE BARRED', min: -Infinity, percent: -10, blurb: 'Hands have been left waiting — a surcharge stands' },
  { key: 'unreliable', label: 'UNRELIABLE AT HANDOFF', min: -12, percent: -5, blurb: 'Time lost at the meeting point has been counted' },
  { key: 'plain', label: 'PLAIN DEALING', min: 0, percent: 0, blurb: 'Nothing owed either way' },
  { key: 'steady', label: 'STEADY BUYER', min: 10, percent: 2, blurb: 'You turn up when you say you will' },
  { key: 'regular', label: 'REGULAR OF THE YARD', min: 30, percent: 4, blurb: 'The yard knows you' },
  { key: 'staunch', label: 'STAUNCH PATRON', min: 60, percent: 6, blurb: 'Trade returned in kind' },
];

export function tradeTierFor(points) {
  const p = Number(points) || 0;
  return [...TRADE_TIERS].reverse().find((t) => p >= t.min) || TRADE_TIERS[0];
}

/** Storefront adjustment carried by the buyer's trade record, clamped to the stated bounds. */
export function tradeAdjustment(user) {
  if (user?.trade_locked) return -TRADE_MAX_SURCHARGE_PERCENT;
  const pct = tradeTierFor(user?.trade_standing).percent;
  return Math.max(-TRADE_MAX_SURCHARGE_PERCENT, Math.min(TRADE_MAX_DISCOUNT_PERCENT, pct));
}

/** Sum of every trade event that still counts. */
export function totalFromTradeEvents(events, now = new Date()) {
  return (events || []).reduce((sum, e) => {
    if (e.voided) return sum;
    if (e.expires_at && new Date(e.expires_at) <= now) return sum;
    return sum + (Number(e.effective_delta) || 0);
  }, 0);
}

/** Recompute a buyer's cached trade standing, applying or lifting the lock as the total dictates. */
export async function recomputeTradeStanding(base44, userId) {
  const events = await base44.asServiceRole.entities.trade_event.filter({ patron_user_id: userId }, '-created_date', 500);
  const total = totalFromTradeEvents(events);
  const locked = total <= TRADE_LOCK_AT;
  await base44.asServiceRole.entities.User.update(userId, {
    trade_standing: total,
    trade_locked: locked,
    trade_locked_reason: locked
      ? `Repeated failures at handoff have left hands waiting. Trade standing stands at ${total}; the surcharge lifts as marks lapse or the council forgives them.`
      : '',
  });
  return { total, locked };
}