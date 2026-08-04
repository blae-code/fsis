/**
 * What the deck is actually flying: musters called, places still unfilled, freight staged
 * and holds still loaded. Solo or fleet, the same question — what needs a hand right now.
 */

const HOUR = 3600 * 1000;
const RANK = { critical: 0, warning: 1, notice: 2 };

export const placesWanted = (op) => (op.role_slots?.length
  ? op.role_slots.reduce((s, r) => s + (r.wanted || 0), 0)
  : op.crew_needed || 0);

export const handsIn = (op) => (op.rsvps || []).filter((r) => r.response === 'in' && !r.waitlisted).length;

export function buildOpsSignals({ operations = [], plans = [], crates = [], fleet = [] }) {
  const out = [];
  const push = (s) => { if (s.count > 0) out.push(s); };
  const now = Date.now();

  const underway = operations.filter((o) => o.status === 'underway');
  const mustering = operations.filter((o) => o.status === 'mustering');
  const soon = operations.filter((o) => o.status === 'scheduled' && o.starts_at && new Date(o.starts_at).getTime() - now < 48 * HOUR && new Date(o.starts_at).getTime() > now);
  const shortHanded = [...underway, ...mustering, ...soon].filter((o) => handsIn(o) < placesWanted(o));
  const overloaded = [...underway, ...mustering].filter((o) => (o.expected_haul_scu || 0) > (o.hull_capacity_scu || 0) && o.hull_capacity_scu > 0);
  const staged = plans.filter((p) => ['staged', 'loaded'].includes(p.status));
  const heldHolds = crates.filter((c) => ['loaded', 'packed'].includes(c.stage));

  push({ id: 'short', severity: 'critical', count: shortHanded.length, label: 'MUSTERS SHORT-HANDED', detail: 'Places called for and nobody stood in them yet.', stage: 'telemetry' });
  push({ id: 'over', severity: 'critical', count: overloaded.length, label: 'HAUL OVER HULL', detail: 'The run expects more than the hull will hold.', stage: 'hull' });
  push({ id: 'underway', severity: 'warning', count: underway.length, label: 'RUNS UNDERWAY', detail: 'Hands afloat right now — log costs as they fall.', stage: 'expense' });
  push({ id: 'mustering', severity: 'warning', count: mustering.length, label: 'MUSTERING NOW', detail: 'Gathering at the pad, not yet away.', stage: 'telemetry' });
  push({ id: 'holds', severity: 'warning', count: heldHolds.length, label: 'HOLDS STILL LOADED', detail: 'Cargo packed or loaded and not yet delivered.', stage: 'haul' });
  push({ id: 'staged', severity: 'notice', count: staged.length, label: 'FREIGHT STAGED', detail: 'Plans ready to fly — pick the terminal.', stage: 'haul' });
  push({ id: 'seats', severity: 'critical', count: fleet.filter((h) => !h.pilot_handle && h.status !== 'lost').length, label: 'HULLS WITHOUT A PILOT', detail: 'Commissioned and nobody in the seat.', stage: 'fleet' });
  push({ id: 'hurt', severity: 'warning', count: fleet.filter((h) => ['damaged', 'maintenance'].includes(h.status)).length, label: 'HULLS OUT OF ACTION', detail: 'Damaged or held in the yard.', stage: 'fleet' });
  push({ id: 'soon', severity: 'notice', count: soon.length, label: 'CALLED WITHIN 48H', detail: 'Scheduled runs coming up on the board.', stage: 'telemetry' });

  return out.sort((a, b) => RANK[a.severity] - RANK[b.severity] || b.count - a.count);
}

export function fleetModel({ operations = [], plans = [], crates = [] }) {
  const now = Date.now();
  const live = operations.filter((o) => ['underway', 'mustering'].includes(o.status));
  const wanted = live.reduce((s, o) => s + placesWanted(o), 0);
  const filled = live.reduce((s, o) => s + handsIn(o), 0);
  const week = operations.filter((o) => o.starts_at && new Date(o.starts_at).getTime() >= now - 7 * 24 * HOUR);
  const loaded = crates.filter((c) => ['loaded', 'packed'].includes(c.stage));
  const flying = plans.filter((p) => ['staged', 'loaded'].includes(p.status));
  return {
    live: live.length,
    crew: filled,
    unfilled: Math.max(0, wanted - filled),
    crewed: wanted ? (filled / wanted) * 100 : 0,
    weekRuns: week.length,
    expectedScu: live.reduce((s, o) => s + (o.expected_haul_scu || 0), 0),
    holdScu: loaded.reduce((s, c) => s + (c.scu_used || 0), 0),
    holdValue: loaded.reduce((s, c) => s + (c.cargo_value_auec || 0), 0),
    plansFlying: flying.length,
    planValue: flying.reduce((s, p) => s + (p.final_sale_auec || 0), 0),
  };
}