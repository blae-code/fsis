/**
 * Whether the yard is actually making money.
 *
 * The app could describe labour in enormous detail and could not answer the first question anybody
 * running a scrapyard asks: did we make anything on that? What we paid for a bought-back part was
 * written into a PROSE SENTENCE in the notes field — "Bought back for 40,000 aUEC at 60% of a
 * 67,000 market reference" — so working out the margin on a shelf meant reading English, item by
 * item. A business that cannot query its own cost of goods is a business running on feel.
 *
 * The second question follows immediately and is the one that actually kills scrapyards: how long
 * has that been sitting there? Stock is cash the collective has already spent and cannot use.
 * A pawn shop lives or dies on the difference between stock that turns and stock that sits, and
 * nothing here has ever measured it.
 *
 * Nothing in this module judges anybody. It measures items.
 */

import { roundAuec } from './money.js';

/** How stock came to be ours. Each has a different cost basis and a different risk. */
export const ACQUISITION_SOURCES = [
  'salvage',      // we went and got it — cost is crew time, not credits
  'buyback',      // we bought it outright at a fraction of market
  'consignment',  // somebody else's, sold on their behalf — never our cash
  'fabrication',  // we made it
  'other',
];

/** Past this, an item is sitting rather than selling. */
export const SLOW_AFTER_DAYS = 30;
export const DEAD_AFTER_DAYS = 90;

const DAY = 86400000;

/** How long this has been ours, in whole days. */
export function daysHeld(item, now = new Date()) {
  const from = item?.acquired_at || item?.created_date;
  if (!from) return 0;
  const at = new Date(from);
  if (Number.isNaN(at.getTime())) return 0;
  return Math.max(0, Math.floor((now.getTime() - at.getTime()) / DAY));
}

/**
 * What an item is worth to the collective, and what it cost.
 *
 * Consigned stock is deliberately excluded from cost: it is not ours and never was. Counting
 * somebody else's property as capital tied up would make the yard look poorer than it is, and
 * counting it as an asset would make it look richer — both are worse than saying it is not ours.
 */
export function itemMargin(item) {
  const consigned = item?.acquisition_source === 'consignment';
  const cost = consigned ? 0 : Math.max(0, roundAuec(item?.acquisition_cost_auec));
  const sold = roundAuec(item?.actual_sell_auec);
  const asking = roundAuec(item?.est_sell_auec);

  if (sold > 0) {
    return {
      state: 'sold',
      consigned,
      cost_auec: cost,
      realised_auec: sold,
      margin_auec: roundAuec(sold - cost),
      margin_percent: cost > 0 ? Math.round(((sold - cost) / cost) * 100) : null,
      basis: cost > 0
        ? `Sold for ${sold.toLocaleString()} against ${cost.toLocaleString()} paid.`
        : consigned
          ? `Sold for ${sold.toLocaleString()} — consigned, so none of it was our cash at risk.`
          : `Sold for ${sold.toLocaleString()}. No acquisition cost recorded, so the margin cannot be stated.`,
    };
  }
  return {
    state: 'held',
    consigned,
    cost_auec: cost,
    realised_auec: 0,
    // What we hope for, clearly labelled as a hope.
    expected_margin_auec: asking > 0 ? roundAuec(asking - cost) : null,
    margin_percent: null,
    basis: asking > 0 && cost > 0
      ? `Asking ${asking.toLocaleString()} against ${cost.toLocaleString()} paid — not yet realised.`
      : 'Still on the shelf.',
  };
}

/** Sitting, or selling. */
export function ageBand(item, now = new Date()) {
  const days = daysHeld(item, now);
  if (days >= DEAD_AFTER_DAYS) return 'dead';
  if (days >= SLOW_AFTER_DAYS) return 'slow';
  return 'fresh';
}

/**
 * The whole shelf, read as a business rather than as a list.
 *
 * `capital_tied_up` is the number that matters and the one nobody had: credits the collective has
 * already spent that are sitting on a shelf instead of being available. A yard can be busy,
 * well-run and completely out of cash at the same time, and that is exactly how it happens.
 *
 * @param {any[]} items
 * @param {Date} [now]
 */
export function stockPosition(items, now = new Date()) {
  const held = (items || []).filter((i) => i && !(Number(i.actual_sell_auec) > 0));
  const sold = (items || []).filter((i) => i && Number(i.actual_sell_auec) > 0);

  const ours = held.filter((i) => i.acquisition_source !== 'consignment');
  const consigned = held.filter((i) => i.acquisition_source === 'consignment');

  const bands = { fresh: [], slow: [], dead: [] };
  for (const item of ours) bands[ageBand(item, now)].push(item);

  const sum = (rows, field) => roundAuec(rows.reduce((t, r) => t + (Number(r[field]) || 0), 0));
  const realised = sold.map((i) => itemMargin(i));
  const withCost = realised.filter((m) => m.cost_auec > 0);

  return {
    held_count: held.length,
    consigned_count: consigned.length,
    // Our cash, sitting still.
    capital_tied_up_auec: sum(ours, 'acquisition_cost_auec'),
    asking_total_auec: sum(ours, 'est_sell_auec'),
    ageing: {
      fresh: bands.fresh.length,
      slow: bands.slow.length,
      dead: bands.dead.length,
      dead_capital_auec: sum(bands.dead, 'acquisition_cost_auec'),
      slow_capital_auec: sum(bands.slow, 'acquisition_cost_auec'),
    },
    realised: {
      sold_count: sold.length,
      revenue_auec: sum(sold, 'actual_sell_auec'),
      cost_auec: roundAuec(withCost.reduce((t, m) => t + m.cost_auec, 0)),
      margin_auec: roundAuec(withCost.reduce((t, m) => t + m.margin_auec, 0)),
      // Only across items whose cost we actually know — an average over unknowns is a fiction.
      margin_percent: withCost.length > 0
        ? Math.round((withCost.reduce((t, m) => t + (m.margin_percent || 0), 0)) / withCost.length)
        : null,
      priced_without_cost: realised.length - withCost.length,
    },
    note: bands.dead.length > 0
      ? `${bands.dead.length} item(s) have sat over ${DEAD_AFTER_DAYS} days, holding ${sum(bands.dead, 'acquisition_cost_auec').toLocaleString()} aUEC of the collective's cash. Stock that does not turn is money the yard cannot use.`
      : 'Nothing has been sitting long enough to worry about.',
  };
}

/**
 * Whether the collective can afford to buy this.
 *
 * Advisory, never a refusal. An Owner who knows something the ledger does not — a sale about to
 * land, a part worth taking at any price — should not be stopped by arithmetic. But committing
 * credits with no idea what is left is how a yard ends up rich in shelves and unable to fuel a ship,
 * and nothing was telling anybody.
 */
export function affordability(offerAuec, { balance_auec = 0, capital_tied_up_auec = 0 } = {}) {
  const offer = roundAuec(offerAuec);
  const balance = roundAuec(balance_auec);
  const after = roundAuec(balance - offer);

  if (offer <= 0) return { ok: true, warning: '', after_auec: balance };
  if (balance <= 0) {
    return {
      ok: true,
      warning: 'No treasury position is recorded, so whether this can be afforded is unknown. It is not being refused — but nobody can say what is left either.',
      after_auec: after,
    };
  }
  if (offer > balance) {
    return {
      ok: false,
      warning: `This offer is ${offer.toLocaleString()} aUEC against a recorded balance of ${balance.toLocaleString()}. Making it would commit money the yard does not have on the books.`,
      after_auec: after,
    };
  }
  if (offer > balance * 0.5) {
    return {
      ok: true,
      warning: `This is over half the recorded balance and would leave ${after.toLocaleString()} aUEC, with ${capital_tied_up_auec.toLocaleString()} already sitting in stock. Worth being sure it turns.`,
      after_auec: after,
    };
  }
  return { ok: true, warning: '', after_auec: after };
}
