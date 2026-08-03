/**
 * The buyback arithmetic, held in one place.
 *
 * One item or forty, the figure is reached the same way — a second copy of this sum living in a bulk
 * screen is how a haul comes to be appraised on different terms than the item beside it.
 */

/** Condition takes its cut of the fraction, stated as a factor rather than folded silently into the number. */
export const CONDITIONS = [
  { key: 'new', label: 'NEW', factor: 1.0, color: '#6FA05B' },
  { key: 'refurbished', label: 'REFURBISHED', factor: 0.9, color: '#5BA08F' },
  { key: 'used', label: 'USED', factor: 0.75, color: '#C8893B' },
  { key: 'worn', label: 'WORN', factor: 0.55, color: '#C05050' },
];

export const conditionOf = (key) => CONDITIONS.find((c) => c.key === key) || CONDITIONS[2];

/** offer = market × base fraction × condition factor, plus tier standing as points on the fraction. */
export function computeOffer({ marketEach, quantity, baseFraction, conditionKey, tierBonus }) {
  const cond = conditionOf(conditionKey);
  const base = Math.min(100, Math.max(1, Number(baseFraction) || 60));
  const qty = Math.max(1, Number(quantity) || 1);
  const fraction = Math.min(100, Math.round(base * cond.factor + (Number(tierBonus) || 0)));
  const marketTotal = (Number(marketEach) || 0) * qty;
  return { cond, base, qty, fraction, marketTotal, offer: Math.round(marketTotal * fraction / 100) };
}

/**
 * A pasted haul, read line by line: `item | qty | market each | condition`.
 *
 * Bad lines are reported individually with the reason rather than thrown away with the good ones —
 * a mistyped price in row three must not cost somebody the other thirty-seven rows they typed.
 */
export function parseHaulLines(text) {
  const rows = [];
  const rejected = [];
  (text || '').split('\n').forEach((raw, i) => {
    const line = raw.trim();
    if (!line) return;
    const parts = line.split('|').map((p) => p.trim());
    const [name, qtyRaw, marketRaw, condRaw] = parts;
    const lineNo = i + 1;
    if (!name) return rejected.push({ lineNo, line, reason: 'No item named.' });
    if (parts.length < 3) return rejected.push({ lineNo, line, reason: 'Needs item | qty | market each, and optionally a condition.' });
    const quantity = Number(qtyRaw);
    const marketEach = Number(marketRaw);
    if (!Number.isFinite(quantity) || quantity <= 0) return rejected.push({ lineNo, line, reason: `Quantity "${qtyRaw}" is not a number above zero.` });
    if (!Number.isFinite(marketEach) || marketEach <= 0) return rejected.push({ lineNo, line, reason: `Market figure "${marketRaw}" is not a number above zero.` });
    const key = (condRaw || 'used').toLowerCase();
    if (condRaw && !CONDITIONS.some((c) => c.key === key)) {
      return rejected.push({ lineNo, line, reason: `Condition "${condRaw}" is not one of new / refurbished / used / worn.` });
    }
    rows.push({ lineNo, name, quantity, marketEach, conditionKey: key });
  });
  return { rows, rejected };
}