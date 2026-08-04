/** The trades a salvage contract breaks into, and the checks that keep two of them off one hull. */
export const ASPECTS = [
  { id: 'scan', label: 'SCAN', glyph: '◉', note: 'Find and mark the wrecks' },
  { id: 'tow', label: 'TOW', glyph: '⇢', note: 'Bring the hulk to the scrapers' },
  { id: 'strip', label: 'STRIP', glyph: '⬡', note: 'Panel scraping to RMC' },
  { id: 'munch', label: 'MUNCH', glyph: '✦', note: 'Hull breaking to CMR' },
  { id: 'haul', label: 'HAUL', glyph: '▸', note: 'Carry the yield out' },
  { id: 'sell', label: 'SELL', glyph: '◆', note: 'Terminal run and payout' },
  { id: 'escort', label: 'ESCORT', glyph: '⌖', note: 'Cover the site and the lane' },
  { id: 'repair', label: 'REPAIR', glyph: '✛', note: 'Keep the hulls flying' },
];

export const STATUSES = [
  { id: 'planned', label: 'PLANNED', color: '#8A7E6C' },
  { id: 'underway', label: 'UNDERWAY', color: '#E0A22E' },
  { id: 'done', label: 'DONE', color: '#5F6B33' },
  { id: 'blocked', label: 'BLOCKED', color: '#C05050' },
  { id: 'dropped', label: 'DROPPED', color: '#4A4136' },
];

export const aspectMeta = (id) => ASPECTS.find((a) => a.id === id) || ASPECTS[2];
export const statusMeta = (id) => STATUSES.find((s) => s.id === id) || STATUSES[0];

/**
 * A hull can only be in one place. Where the same hull is underway on two contracts at
 * once, say so — an orchestration that quietly double-books a ship is worse than none.
 */
export function hullConflicts(assignments = []) {
  const live = assignments.filter((a) => a.status === 'underway' && a.hull_id);
  const byHull = new Map();
  live.forEach((a) => byHull.set(a.hull_id, [...(byHull.get(a.hull_id) || []), a]));
  return [...byHull.entries()]
    .filter(([, list]) => new Set(list.map((a) => a.contract_id)).size > 1)
    .map(([hull_id, list]) => ({
      hull_id,
      callsign: list[0].hull_callsign || 'UNNAMED HULL',
      contracts: [...new Set(list.map((a) => a.contract_title || 'a contract'))],
    }));
}

export function contractProgress(list = []) {
  const active = list.filter((a) => a.status !== 'dropped');
  const done = active.filter((a) => a.status === 'done').length;
  return {
    total: active.length,
    done,
    blocked: active.filter((a) => a.status === 'blocked').length,
    underway: active.filter((a) => a.status === 'underway').length,
    openSeats: active.filter((a) => !a.pilot_handle && a.status !== 'done').length,
    pct: active.length ? Math.round((done / active.length) * 100) : 0,
  };
}