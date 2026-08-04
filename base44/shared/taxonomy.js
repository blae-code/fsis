/**
 * The words the yard uses for things in the game, owned in one place.
 *
 * Every dropdown in this app was written where it was first needed, so the same idea ended up with
 * several vocabularies that do not quite agree:
 *
 *   - CONDITION was an enum on loot_item and product (`refurb`), a DIFFERENT enum on buyback_offer
 *     (`refurbished`), and free text on hall_lot, consignment and buyback_offer's own
 *     `condition_grade`. Five fields, three vocabularies, one idea. Worse, `respondToBuyback` wrote
 *     the free-text one straight into the enum field, so a bought-back part could land on the shelf
 *     with a condition the shelf does not recognise.
 *   - OP TYPE is one list on crew_operation (mining, recovery) and a different list on work_order
 *     (bounty, cargo, piracy). The same run described two ways depending on which record it landed in.
 *   - SIZE CLASS stops at S5 in three places and is free text in a fourth — and a Reclaimer carries
 *     components well past S5.
 *
 * The fix is not to pick a winner and break the other. Nothing here removes a value anybody may
 * already have stored: each vocabulary has a canonical list, and a normaliser that maps the older
 * spellings onto it. A record written last year still reads correctly; a record written today is
 * written in one voice.
 *
 * Two game concepts were missing entirely and are added because a scrapyard genuinely trades on
 * them: a component's GRADE (A–D) and its CLASS (Military, Civilian, Industrial, Competition,
 * Stealth). Those are not condition — a pristine Civilian-grade part and a battered Military one are
 * different goods at different prices, and the app could not say so.
 */

/* ────────────────────────────── condition ────────────────────────────── */

/** What state a thing is in. One vocabulary, whatever spelling arrives. */
export const CONDITIONS = [
  { key: 'new', label: 'NEW', aliases: ['new', 'unused', 'pristine', 'mint'] },
  { key: 'refurb', label: 'REFURBISHED', aliases: ['refurb', 'refurbished', 'reconditioned', 'repaired'] },
  { key: 'used', label: 'USED', aliases: ['used', 'serviceable', 'good', 'working'] },
  { key: 'worn', label: 'WORN', aliases: ['worn', 'damaged', 'battered', 'poor', 'salvaged'] },
];

/**
 * Any spelling of a condition, mapped to the one the app stores.
 *
 * Falls back to `used` rather than to `new`. An unknown condition described optimistically is how a
 * buyer ends up disappointed and a seller ends up accused; the middle of the range is the honest
 * default when nobody has actually said.
 */
export function normaliseCondition(value) {
  const s = String(value || '').trim().toLowerCase();
  if (!s) return 'used';
  const hit = CONDITIONS.find((c) => c.aliases.includes(s));
  if (hit) return hit.key;
  const partial = CONDITIONS.find((c) => c.aliases.some((a) => s.includes(a)));
  return partial ? partial.key : 'used';
}

export const conditionLabel = (key) =>
  (CONDITIONS.find((c) => c.key === normaliseCondition(key)) || CONDITIONS[2]).label;

/* ──────────────────────── grade and class (game) ─────────────────────── */

/**
 * A component's grade. A real thing in the game and a real thing in a price: an A-grade cooler and a
 * D-grade cooler are not the same part in better condition, they are different parts.
 */
export const COMPONENT_GRADES = [
  { key: 'A', label: 'A — best' },
  { key: 'B', label: 'B' },
  { key: 'C', label: 'C' },
  { key: 'D', label: 'D — stock' },
  { key: 'unknown', label: 'Not stated' },
];

/** What a component is tuned for. Also priced differently, and also missing until now. */
export const COMPONENT_CLASSES = [
  { key: 'military', label: 'Military' },
  { key: 'civilian', label: 'Civilian' },
  { key: 'industrial', label: 'Industrial' },
  { key: 'competition', label: 'Competition' },
  { key: 'stealth', label: 'Stealth' },
  { key: 'unknown', label: 'Not stated' },
];

export function normaliseGrade(value) {
  const s = String(value || '').trim().toUpperCase();
  return ['A', 'B', 'C', 'D'].includes(s) ? s : 'unknown';
}

export function normaliseClass(value) {
  const s = String(value || '').trim().toLowerCase();
  return COMPONENT_CLASSES.some((c) => c.key === s) ? s : 'unknown';
}

/* ──────────────────────────── size classes ───────────────────────────── */

/**
 * Ship component sizes run further than the S1–S5 three of these fields stopped at. A Reclaimer,
 * which is the yard's own trade, carries components past that — so the list could not describe the
 * ship the business is named after.
 */
export const SIZE_CLASSES = [
  'S0', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9', 'S10', 'S11', 'S12',
  'XS', 'S', 'M', 'L', 'XL', 'N/A',
];

export function normaliseSize(value) {
  const s = String(value || '').trim().toUpperCase().replace(/\s+/g, '');
  if (!s) return 'N/A';
  if (SIZE_CLASSES.includes(s)) return s;
  const digits = s.match(/^S?(\d{1,2})$/);
  if (digits) {
    const n = Number(digits[1]);
    if (n >= 0 && n <= 12) return `S${n}`;
  }
  return 'N/A';
}

/* ─────────────────────────────── op types ────────────────────────────── */

/**
 * One vocabulary for what a run IS, wide enough to cover both lists that existed.
 *
 * `cargo` and `hauling` were the same thing under two names; both now normalise to `hauling`.
 * `bounty` and `piracy` only existed on work_order and are kept, because they describe real work
 * even if the yard does not often do it.
 */
export const OP_TYPES = [
  { key: 'salvage', label: 'Salvage', aliases: ['salvage', 'scrapping', 'wreck'] },
  { key: 'hauling', label: 'Hauling', aliases: ['hauling', 'cargo', 'freight', 'transport', 'delivery'] },
  { key: 'mining', label: 'Mining', aliases: ['mining', 'prospecting'] },
  { key: 'escort', label: 'Escort', aliases: ['escort', 'security', 'protection'] },
  { key: 'recovery', label: 'Recovery', aliases: ['recovery', 'rescue', 'towing', 'tow'] },
  { key: 'repair', label: 'Repair & refuel', aliases: ['repair', 'refuel', 'rearm', 'servicing'] },
  { key: 'bounty', label: 'Bounty', aliases: ['bounty', 'hunting'] },
  { key: 'piracy', label: 'Piracy', aliases: ['piracy', 'raiding'] },
  { key: 'other', label: 'Other', aliases: ['other', 'misc'] },
];

export function normaliseOpType(value) {
  const s = String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  const hit = OP_TYPES.find((o) => o.aliases.includes(s));
  return hit ? hit.key : 'other';
}

/* ───────────────────────────── where things are ──────────────────────── */

/**
 * The systems the game actually has. Locations are free text in eighteen fields, which means the
 * yard cannot answer "what did we sell at Port Tressler" without matching strings by eye. This is
 * the coarse grouping; the `terminal` table already carries real places from UEX and is the right
 * thing for a location picker to read.
 */
export const STAR_SYSTEMS = [
  { key: 'stanton', label: 'Stanton' },
  { key: 'pyro', label: 'Pyro' },
  { key: 'nyx', label: 'Nyx' },
  { key: 'terra', label: 'Terra' },
  { key: 'magnus', label: 'Magnus' },
  { key: 'other', label: 'Elsewhere' },
];

export function normaliseSystem(value) {
  const s = String(value || '').trim().toLowerCase();
  const hit = STAR_SYSTEMS.find((x) => x.key === s || x.label.toLowerCase() === s);
  return hit ? hit.key : 'other';
}

/** Everything a dropdown might need, in one call, so the interface never hand-writes a list. */
export function vocabularies() {
  return {
    conditions: CONDITIONS.map(({ key, label }) => ({ key, label })),
    component_grades: COMPONENT_GRADES,
    component_classes: COMPONENT_CLASSES,
    size_classes: SIZE_CLASSES,
    op_types: OP_TYPES.map(({ key, label }) => ({ key, label })),
    star_systems: STAR_SYSTEMS,
  };
}
