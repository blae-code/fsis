/** Frontend mirror of the buyer's trade ledger. Kept plain, and always shown back to the buyer. */
export const TRADE_TIERS = [
  { key: 'barred', label: 'TRADE BARRED', min: -Infinity, percent: -10, color: '#C05050' },
  { key: 'unreliable', label: 'UNRELIABLE AT HANDOFF', min: -12, percent: -5, color: '#C8893B' },
  { key: 'plain', label: 'PLAIN DEALING', min: 0, percent: 0, color: '#7A6E60' },
  { key: 'steady', label: 'STEADY BUYER', min: 10, percent: 2, color: '#8A8F45' },
  { key: 'regular', label: 'REGULAR OF THE YARD', min: 30, percent: 4, color: '#8A8F45' },
  { key: 'staunch', label: 'STAUNCH PATRON', min: 60, percent: 6, color: '#E0A22E' },
];

export const TRADE_KIND_LABEL = {
  handoff_completed: 'TURNED UP AT HANDOFF',
  handoff_no_show: 'LEFT A HAND WAITING',
  late_cancellation: 'CANCELLED LATE',
  council_adjustment: 'COUNCIL ADJUSTMENT',
  amnesty: 'FORGIVEN',
  decay: 'MARK LAPSED',
};

export function tradeTierFor(points) {
  const p = Number(points) || 0;
  return [...TRADE_TIERS].reverse().find((t) => p >= t.min) || TRADE_TIERS[0];
}

export function tradeAdjustment(user) {
  if (user?.trade_locked) return -10;
  return tradeTierFor(user?.trade_standing).percent;
}