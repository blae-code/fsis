/**
 * What FSIS will pay for a comrade's gear, and how that figure is reached.
 *
 * This lives here rather than in a form because it is PRICING POLICY. A condition factor typed into
 * a component is a rule nobody voted on, that nothing records, and that cannot be explained six
 * months later when a member asks why their offer was what it was. Policy belongs somewhere it can
 * be read, argued with, versioned and shown back.
 *
 * The rule the whole feature rests on: **the fraction is stated, never hidden inside the number.**
 * That means the fraction recorded on an offer must be the fraction the member actually got — not a
 * headline figure that some further arithmetic then quietly moved. If condition takes a cut, the cut
 * is named. If standing adds something, that is named too.
 *
 * A note on standing: a better labour record earns a slightly better price, because the collective
 * returns value to those who make it. It is deliberately SMALL and bounded — buyback is not a
 * loyalty scheme, and a comrade with no standing must never feel they are being penalised for being
 * new. It is also drawn from LABOUR standing, not from the storefront's buyer pricing tiers: what a
 * buyer pays for a product and what the collective pays a seller for their gear are unrelated, and
 * treating one as the other is a category error rather than a generous policy.
 */

import { roundAuec, percentOfAuec } from './money.js';
import { tierFor } from './reputation.js';

/** The default share of market the hall offers, before condition and standing. */
export const DEFAULT_BASE_FRACTION = 60;

/** No offer exceeds market: the collective buys to resell, and says so. */
export const MAX_FRACTION = 100;
export const MIN_FRACTION = 1;

/**
 * What condition does to the figure, as a factor rather than a silent adjustment.
 * Stated openly so a member can see exactly what "worn" cost them.
 */
export const CONDITIONS = [
  { key: 'new', label: 'NEW', factor: 1.0, blurb: 'As it left the factory' },
  { key: 'refurbished', label: 'REFURBISHED', factor: 0.9, blurb: 'Brought back to working order' },
  { key: 'used', label: 'USED', factor: 0.75, blurb: 'Honest wear, works as it should' },
  { key: 'worn', label: 'WORN', factor: 0.55, blurb: 'Serviceable, and looks its age' },
];

export const conditionFor = (key) => CONDITIONS.find((c) => c.key === key) || CONDITIONS[2];

/**
 * What a comrade's labour standing adds to the fraction, in points.
 *
 * Small on purpose. A veteran of the yard gets a few points more; a comrade with nothing on their
 * record gets the plain rate and is not made to feel it. Nobody is ever penalised below the base
 * rate for their standing — a poor labour record is a matter for the standing ledger, not something
 * to be taken out of what we pay them for their own property.
 */
export const STANDING_BONUS = {
  veteran: 6,
  trusted: 4,
  proven: 2,
  standing: 0,
  strained: 0,
  marked: 0,
};

export function standingBonusFor(user) {
  if (!user) return 0;
  const tier = tierFor(user.reputation);
  return Math.max(0, STANDING_BONUS[tier.key] ?? 0);
}

/**
 * The appraisal, with every part of it named.
 *
 * Returns the EFFECTIVE fraction — the one the member actually receives — alongside the pieces it
 * was built from, so the offer can state its own arithmetic rather than asserting a headline number.
 *
 * @param {{ market_each_auec?: number, quantity?: number, base_fraction_percent?: number,
 *           condition_key?: string, standing_bonus_percent?: number }} input
 */
export function appraise(input = {}) {
  const marketEach = Math.max(0, roundAuec(input.market_each_auec));
  const quantity = Math.max(1, Math.floor(Number(input.quantity) || 1));
  const rawBase = Number(input.base_fraction_percent);
  const base = Number.isFinite(rawBase) && rawBase > 0
    ? Math.min(MAX_FRACTION, rawBase)
    : DEFAULT_BASE_FRACTION;

  const condition = conditionFor(input.condition_key);
  const bonus = Math.max(0, Number(input.standing_bonus_percent) || 0);

  const effective = Math.min(
    MAX_FRACTION,
    Math.max(MIN_FRACTION, Math.round(base * condition.factor + bonus)),
  );
  const marketTotal = roundAuec(marketEach * quantity);

  return {
    market_each_auec: marketEach,
    quantity,
    market_total_auec: marketTotal,
    base_fraction_percent: base,
    condition_key: condition.key,
    condition_label: condition.label,
    condition_factor: condition.factor,
    standing_bonus_percent: bonus,
    // The figure the member actually gets, and the one recorded on the offer.
    fraction_percent: effective,
    offer_auec: percentOfAuec(marketTotal, effective),
  };
}

/**
 * The arithmetic in words, for the member to read.
 *
 * An offer a comrade cannot check is a number they have to take on trust, and this is the one place
 * in the app where the collective is on the other side of the table from one of its own.
 */
export function appraisalBasis(a) {
  if (!a || a.market_total_auec <= 0) {
    return 'Stated outright rather than reckoned from a market figure.';
  }
  const parts = [
    `${a.base_fraction_percent}% of market is the hall's plain rate`,
    a.condition_factor !== 1
      ? `condition ${a.condition_label.toLowerCase()} takes it to ${Math.round(a.base_fraction_percent * a.condition_factor)}%`
      : '',
    a.standing_bonus_percent > 0
      ? `and your standing adds ${a.standing_bonus_percent} points`
      : '',
  ].filter(Boolean);

  return `${parts.join(', ')} — ${a.fraction_percent}% of ${a.market_total_auec.toLocaleString()} aUEC, which is ${a.offer_auec.toLocaleString()} aUEC.`;
}
