/**
 * Standing as the worker sees it — the same figures the backend settles on, stated openly.
 * Mirrors base44/shared/reputation.js; keep the two in step.
 */
export const MAX_DISCOUNT_PERCENT = 10;
export const MAX_SURCHARGE_PERCENT = 15;
export const MAX_TOTAL_DISCOUNT_PERCENT = 20;
export const MARK_LIFETIME_DAYS = 120;
export const APPEAL_WINDOW_DAYS = 14;
export const APPEAL_ANSWER_DAYS = 7;

export const TIERS = [
  { key: 'marked', label: 'MARKED', min: -Infinity, discount_percent: -15, color: '#C05050', blurb: 'Standing forfeit — a surcharge stands until the council is satisfied' },
  { key: 'strained', label: 'STRAINED', min: -20, discount_percent: -5, color: '#C8893B', blurb: 'Work withheld has been counted against you' },
  { key: 'standing', label: 'IN GOOD STANDING', min: 0, discount_percent: 0, color: '#8A7E6C', blurb: 'Nothing owed either way' },
  { key: 'proven', label: 'PROVEN HAND', min: 25, discount_percent: 3, color: '#6FA0C8', blurb: 'Labour given and counted' },
  { key: 'trusted', label: 'TRUSTED HAND', min: 60, discount_percent: 6, color: '#8A8F45' , blurb: 'The yard knows your work' },
  { key: 'veteran', label: 'VETERAN OF THE YARD', min: 120, discount_percent: 10, color: '#E0A22E', blurb: 'The collective returns what you have built' },
];

export function tierFor(points) {
  const p = Number(points) || 0;
  return [...TIERS].reverse().find((t) => p >= t.min) || TIERS[0];
}

/** The storefront adjustment a member currently carries, clamped to stated bounds. */
export function storefrontAdjustment(user) {
  if (user?.standing_locked) return -MAX_SURCHARGE_PERCENT;
  const pct = tierFor(user?.reputation).discount_percent;
  return Math.max(-MAX_SURCHARGE_PERCENT, Math.min(MAX_DISCOUNT_PERCENT, pct));
}

/** Standing needed to reach the next tier, or null at the top. */
export function nextTier(points) {
  const p = Number(points) || 0;
  return TIERS.find((t) => t.min > p) || null;
}

export const EVENT_META = {
  work_credited: { label: 'WORK CREDITED', color: '#8A8F45' },
  muster_stood: { label: 'MUSTER STOOD', color: '#8A8F45' },
  work_abandoned: { label: 'WORK HANDED BACK', color: '#C05050' },
  dismissed: { label: 'DISMISSED', color: '#C05050' },
  reinstated: { label: 'REINSTATED', color: '#6FA0C8' },
  council_adjustment: { label: 'COUNCIL ADJUSTMENT', color: '#E0A22E' },
  amnesty: { label: 'AMNESTY', color: '#6FA0C8' },
  decay: { label: 'MARK LAPSED', color: '#6B6155' },
};

export const APPEAL_META = {
  none: { label: '', color: '#6B6155' },
  filed: { label: 'APPEAL FILED', color: '#E0A22E' },
  upheld: { label: 'APPEAL DENIED — MARK UPHELD', color: '#C05050' },
  denied: { label: 'APPEAL DENIED', color: '#C05050' },
  reduced: { label: 'MARK REDUCED', color: '#8A8F45' },
  neutralised: { label: 'MARK NEUTRALISED', color: '#8A8F45' },
  increased: { label: 'MARK INCREASED', color: '#C05050' },
};

/** A mark still counts only while it is neither voided nor lapsed. */
export const stillCounts = (e) => !e.voided && !(e.expires_at && new Date(e.expires_at) <= new Date());