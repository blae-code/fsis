/**
 * Where bespoke visual work can go, and what it must never be allowed to become.
 *
 * The app is full of places that would carry an image well — a trade for every task category, a
 * badge for every standing tier, a silhouette for every kind of lot in the hall. None of them have
 * anywhere to live, so any bespoke work would end up hard-coded into whichever component happened
 * to need it first, and the second use would be a copy.
 *
 * Two rules govern everything here, and the first one is the important one:
 *
 *   1. **Every slot degrades.** An asset is decoration on top of something that already works. No
 *      screen may require one, no figure may be conveyed only by an image, and a missing asset must
 *      render as its absence rather than as a broken page. This is stated in code, tested, and
 *      repeated in the contract, because the failure mode is somebody building a beautiful screen
 *      that is unusable until an artist delivers.
 *
 *   2. **The hand that made it is credited.** An asset is labour like any other, and this collective
 *      does not take work and file the maker's name off it. Credit is a field, not a comment.
 *
 * Slot keys are DERIVED from the real enums rather than written out again, so the day somebody adds
 * a task category or a muster role, the slot for it exists and shows up as unfilled. A hand-written
 * list would drift within a month and nobody would notice until the icon was missing.
 */

import { TIERS } from './reputation.js';
import { TRADE_TIERS } from './trade.js';
import { MUSTER_ROLES } from './musters.js';
import { SKILL_TAGS } from './skills.js';
import { NOTICE_KINDS } from './notices.js';
import { LOT_STATES } from './hall.js';
import { INSTRUMENT_KINDS } from './instruments.js';

/** What kind of thing an asset is, which tells the interface how to place it. */
export const ASSET_KINDS = ['icon', 'badge', 'illustration', 'banner', 'portrait', 'texture', 'seal'];

/** Some work reads differently on a dark ground than a light one. */
export const ASSET_THEMES = ['any', 'dark', 'light'];

/**
 * The families of slot, each derived from the enum it decorates.
 *
 * `derived_from` is recorded so anyone reading this knows the list is not hand-maintained, and
 * `guidance` says what the work is actually for — an artist given "salvage: an icon" makes something
 * worse than one told what the icon has to do on the page.
 */
export const SLOT_FAMILIES = [
  {
    family: 'task_category',
    label: 'Labour categories',
    kind: 'icon',
    derived_from: 'labour_task.category',
    values: ['salvage', 'hauling', 'escort', 'repair', 'intake', 'delivery', 'admin', 'other'],
    guidance: 'Read at a glance on a dense board, at small size, next to a title. The trade, not the tool.',
  },
  {
    family: 'muster_role',
    label: 'Places on a run',
    kind: 'icon',
    derived_from: 'shared/musters.js MUSTER_ROLES',
    values: MUSTER_ROLES,
    guidance: 'Sits in a row of filled and empty places. Must read as clearly when greyed out as when filled.',
  },
  {
    family: 'standing_tier',
    label: 'Labour standing',
    kind: 'badge',
    derived_from: 'shared/reputation.js TIERS',
    values: TIERS.map((t) => t.key),
    guidance: 'Worn by a comrade beside their name. A record of labour given — never a rank, never a medal, and the marked tier must not look like a punishment badge.',
  },
  {
    family: 'trade_tier',
    label: 'Buyer trade standing',
    kind: 'badge',
    derived_from: 'shared/trade.js TRADE_TIERS',
    values: TRADE_TIERS.map((t) => t.key),
    guidance: 'Kept visually distinct from labour standing — the two ledgers are separate and must not be mistaken for one another.',
  },
  {
    family: 'skill',
    label: 'Declared trades',
    kind: 'icon',
    derived_from: 'shared/skills.js SKILL_TAGS',
    values: SKILL_TAGS,
    guidance: 'Shown on a comrade\'s own profile, from what they said they do. Never a qualification.',
  },
  {
    family: 'op_type',
    label: 'Kinds of run',
    kind: 'illustration',
    derived_from: 'crew_operation.op_type',
    values: ['salvage', 'hauling', 'escort', 'mining', 'recovery', 'other'],
    guidance: 'Heads a muster card. Wide, low, and legible behind text.',
  },
  {
    family: 'lot_item_type',
    label: 'Hall lot kinds',
    kind: 'icon',
    derived_from: 'hall_lot.item_type',
    values: ['ship_component', 'vehicle_component', 'fps_gear', 'weapon', 'bulk_cargo', 'other'],
    guidance: 'Stands in for a lot with no photograph. Must never imply a condition or a grade.',
  },
  {
    family: 'lot_state',
    label: 'Hall lot states',
    kind: 'badge',
    derived_from: 'shared/hall.js LOT_STATES',
    values: LOT_STATES,
    guidance: 'A lot that did not sell is an ordinary outcome, not a failure. Do not make reserve_not_met look like an error.',
  },
  {
    family: 'notice_kind',
    label: 'Notices',
    kind: 'icon',
    derived_from: 'shared/notices.js NOTICE_KINDS',
    values: NOTICE_KINDS,
    guidance: 'Small, in a list. A mark and an amnesty must be distinguishable at a glance without either shouting.',
  },
  {
    family: 'instrument_kind',
    label: 'Instruments',
    kind: 'seal',
    derived_from: 'shared/instruments.js INSTRUMENT_KINDS',
    values: INSTRUMENT_KINDS,
    guidance: 'A mark of a mutual undertaking. Should feel signed rather than issued — nothing officious.',
  },
];

/**
 * Slots that decorate a place rather than a value in an enum.
 * These are written out because there is no list to derive them from.
 */
export const STANDALONE_SLOTS = [
  { key: 'brand.mark', kind: 'seal', guidance: 'The collective\'s own mark.' },
  { key: 'storefront.hero', kind: 'banner', guidance: 'The public front door. Seen by people who owe us nothing.' },
  { key: 'workboard.hero', kind: 'banner', guidance: 'Heads the labour board.' },
  { key: 'hall.hero', kind: 'banner', guidance: 'Heads the hall. A room, not a shop.' },
  { key: 'empty.board', kind: 'illustration', guidance: 'No work posted. Should read as a quiet yard, not a fault.' },
  { key: 'empty.hall', kind: 'illustration', guidance: 'Nothing listed yet.' },
  { key: 'empty.notices', kind: 'illustration', guidance: 'Nothing owed to you — a good state, not an empty one.' },
  { key: 'empty.orders', kind: 'illustration', guidance: 'No orders in hand.' },
  { key: 'run.underway', kind: 'illustration', guidance: 'A run in progress, for the live console.' },
  { key: 'payday.published', kind: 'illustration', guidance: 'A settled pay day. Plain, not celebratory.' },
];

/** One key per slot: `family.value`, or the standalone key as written. */
export function slotKey(family, value) {
  return value === undefined || value === null || value === '' ? String(family) : `${family}.${value}`;
}

/**
 * Every slot the app has room for.
 * @returns {any[]}
 */
export function allSlots() {
  const derived = SLOT_FAMILIES.flatMap((f) =>
    (f.values || []).map((value) => ({
      key: slotKey(f.family, value),
      family: f.family,
      family_label: f.label,
      value,
      kind: f.kind,
      derived_from: f.derived_from,
      guidance: f.guidance,
    })));
  const standalone = STANDALONE_SLOTS.map((s) => ({
    key: s.key,
    family: 'standalone',
    family_label: 'Places',
    value: s.key,
    kind: s.kind,
    derived_from: '',
    guidance: s.guidance,
  }));
  return [...derived, ...standalone];
}

/** Whether a key names a slot the app actually has room for. */
export function isKnownSlot(key) {
  return allSlots().some((slot) => slot.key === key);
}

/**
 * The asset for a slot, or null.
 *
 * Null is the ordinary case and callers must render it as absence. Retired assets are never
 * returned; a theme-specific asset wins over an `any`, and an `any` is better than nothing.
 */
export function assetFor(assets, key, { theme = 'any' } = {}) {
  const candidates = (assets || []).filter(
    (a) => a && a.slot_key === key && a.status !== 'retired' && a.image_url,
  );
  if (candidates.length === 0) return null;
  return candidates.find((a) => a.theme === theme && theme !== 'any')
    || candidates.find((a) => !a.theme || a.theme === 'any')
    || candidates[0];
}

/** Assets keyed by slot, for an interface that wants to look them up as it renders. */
export function bySlot(assets, { theme = 'any' } = {}) {
  const out = {};
  for (const slot of allSlots()) {
    const found = assetFor(assets, slot.key, { theme });
    if (found) out[slot.key] = found;
  }
  return out;
}

/**
 * What is still unmade.
 *
 * The point of the whole registry: an artist should be able to ask what the app wants and get a
 * list with guidance, rather than being handed a screenshot and asked to make it nicer.
 *
 * @returns {any[]}
 */
export function unfilledSlots(assets, { theme = 'any' } = {}) {
  return allSlots().filter((slot) => !assetFor(assets, slot.key, { theme }));
}
