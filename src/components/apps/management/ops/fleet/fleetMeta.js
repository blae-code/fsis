/** The order of battle: how hulls read, what they are for, and what they hold without being told. */

export const ROLE_META = {
  commander: { glyph: '★', label: 'WING LEAD', color: '#E0A22E' },
  salvage:   { glyph: '⬡', label: 'SALVAGE',   color: '#C8893B' },
  hauler:    { glyph: '▤', label: 'HAULER',    color: '#5FA0A0' },
  escort:    { glyph: '✦', label: 'ESCORT',    color: '#C05050' },
  mining:    { glyph: '◈', label: 'MINING',    color: '#8A8F45' },
  support:   { glyph: '⌗', label: 'SUPPORT',   color: '#9B8FC0' },
  scout:     { glyph: '▸', label: 'SCOUT',     color: '#6FA0C8' },
  medical:   { glyph: '✚', label: 'MEDICAL',   color: '#D08A6A' },
};

export const STATUS_META = {
  docked:      { label: 'DOCKED',  color: '#7A6E60' },
  ready:       { label: 'READY',   color: '#8A8F45' },
  underway:    { label: 'UNDERWAY', color: '#E0A22E' },
  damaged:     { label: 'DAMAGED', color: '#C05050' },
  maintenance: { label: 'IN YARD', color: '#C8893B' },
  lost:        { label: 'LOST',    color: '#5F564A' },
};

export const ORDERS = ['standby', 'follow', 'defend', 'collect', 'haul', 'patrol', 'trade', 'repair'];
export const ROLES = Object.keys(ROLE_META);
export const STATUSES = Object.keys(STATUS_META);

/** Nest the flat roster into the order of battle, and roll each wing's strength up to its lead. */
export function buildFleetTree(assets = []) {
  const byId = new Map(assets.map((a) => [a.id, { ...a, children: [] }]));
  const roots = [];
  byId.forEach((node) => {
    const parent = node.parent_id && byId.get(node.parent_id);
    if (parent && parent.id !== node.id) parent.children.push(node);
    else roots.push(node);
  });
  const sort = (list) => {
    list.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || String(a.callsign).localeCompare(String(b.callsign)));
    list.forEach((n) => sort(n.children));
  };
  sort(roots);
  const roll = (node) => {
    const kids = node.children.map(roll);
    node.rollup = kids.reduce((acc, k) => ({
      hulls: acc.hulls + k.rollup.hulls,
      scu: acc.scu + k.rollup.scu,
      crewed: acc.crewed + k.rollup.crewed,
      afloat: acc.afloat + k.rollup.afloat,
      hurt: acc.hurt + k.rollup.hurt,
    }), {
      hulls: 1,
      scu: node.capacity_scu || 0,
      crewed: node.pilot_handle ? 1 : 0,
      afloat: node.status === 'underway' ? 1 : 0,
      hurt: ['damaged', 'maintenance'].includes(node.status) ? 1 : 0,
    });
    return node;
  };
  roots.forEach(roll);
  return roots;
}

/** Every hull under a given one, so a wing can be reassigned or stood down whole. */
export function descendantIds(node) {
  return node.children.flatMap((c) => [c.id, ...descendantIds(c)]);
}