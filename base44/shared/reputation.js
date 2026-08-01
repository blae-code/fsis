/**
 * Standing as a record of labour given and labour withheld — never a credit score.
 *
 * Every figure here is stated openly and shown back to the worker. Standing is earned by work
 * credited and musters actually stood, and reduced only for harm done to the collective's
 * operations. Marks lapse; the council may forgive them; and no adjustment may ever price a
 * lot below what it cost us to acquire.
 */

/** Standing awarded for labour given. */
export const AWARD = {
  /** A task credited in full. */
  workCredited: 4,
  /** Bonus weight for urgent work nobody else would take. */
  urgentBonus: 3,
  elevatedBonus: 1,
  /** A muster actually stood, not merely answered. */
  musterStood: 3,
};

/** How long a mark stands before it lapses of its own accord. */
export const MARK_LIFETIME_DAYS = 120;

/** Filing window for an appeal, and the answer the council owes in return. */
export const APPEAL_WINDOW_DAYS = 14;
export const APPEAL_ANSWER_DAYS = 7;

/** Hard bounds. The collective returns value to those who make it — within stated limits. */
export const MAX_DISCOUNT_PERCENT = 10;
export const MAX_SURCHARGE_PERCENT = 15;
/** A standing adjustment and a discount code together may never exceed this. */
export const MAX_TOTAL_DISCOUNT_PERCENT = 20;

/**
 * Tiers, lowest first. `discount_percent` is what the tier returns at the storefront;
 * a negative figure is a surcharge carried by a comrade who has taken from the collective.
 */
export const TIERS = [
  { key: 'marked', label: 'MARKED', min: -Infinity, discount_percent: -15, blurb: 'Standing forfeit — a surcharge stands until the council is satisfied' },
  { key: 'strained', label: 'STRAINED', min: -20, discount_percent: -5, blurb: 'Work withheld has been counted against you' },
  { key: 'standing', label: 'IN GOOD STANDING', min: 0, discount_percent: 0, blurb: 'Nothing owed either way' },
  { key: 'proven', label: 'PROVEN HAND', min: 25, discount_percent: 3, blurb: 'Labour given and counted' },
  { key: 'trusted', label: 'TRUSTED HAND', min: 60, discount_percent: 6, blurb: 'The yard knows your work' },
  { key: 'veteran', label: 'VETERAN OF THE YARD', min: 120, discount_percent: 10, blurb: 'The collective returns what you have built' },
];

/** The tier a given standing total falls in. */
export function tierFor(points) {
  const p = Number(points) || 0;
  return [...TIERS].reverse().find((t) => p >= t.min) || TIERS[0];
}

/**
 * Storefront adjustment for a member, clamped to the stated bounds.
 * A locked (dismissed) comrade carries the full surcharge regardless of past standing.
 */
export function storefrontAdjustment(user) {
  if (user?.standing_locked) return -MAX_SURCHARGE_PERCENT;
  const pct = tierFor(user?.reputation).discount_percent;
  return Math.max(-MAX_SURCHARGE_PERCENT, Math.min(MAX_DISCOUNT_PERCENT, pct));
}

/**
 * The cost of walking away from work in hand, weighted by the harm actually done:
 * how close the deadline stood, how urgent the work was, and how much was agreed for it.
 * Returned as a negative figure.
 */
export function abandonmentCost(task) {
  let cost = 5;
  if (task?.priority === 'urgent') cost += 8;
  else if (task?.priority === 'elevated') cost += 3;

  const credit = Number(task?.agreed_credit_auec) || 0;
  cost += Math.min(10, Math.floor(credit / 50000));

  if (task?.due_date) {
    const daysLeft = Math.ceil((new Date(task.due_date).setHours(23, 59, 59) - Date.now()) / 86400000);
    if (daysLeft <= 0) cost += 8;
    else if (daysLeft <= 1) cost += 6;
    else if (daysLeft <= 3) cost += 3;
  }
  return -cost;
}

/** Standing earned when filed work is credited. */
export function creditAward(task) {
  let award = AWARD.workCredited;
  if (task?.priority === 'urgent') award += AWARD.urgentBonus;
  else if (task?.priority === 'elevated') award += AWARD.elevatedBonus;
  return award;
}

/** Sum of every event that still counts — voided and lapsed marks fall away. */
export function totalFromEvents(events, now = new Date()) {
  return (events || []).reduce((sum, e) => {
    if (e.voided) return sum;
    if (e.expires_at && new Date(e.expires_at) <= now) return sum;
    return sum + (Number(e.effective_delta) || 0);
  }, 0);
}

/** Recompute a member's cached standing from their whole record and write it back. */
export async function recomputeStanding(base44, userId) {
  const events = await base44.asServiceRole.entities.standing_event.filter({ member_user_id: userId }, '-created_date', 500);
  const total = totalFromEvents(events);
  await base44.asServiceRole.entities.User.update(userId, { reputation: total });
  return total;
}