/**
 * What the yard owes an answer on, and its vitals. Read-only arithmetic over records
 * already fetched — the same figures the desks below act on, never a second truth.
 */
export function yardModel({ loot = [], crates = [], jobs = [], fabs = [] }) {
  const raw = loot.filter((l) => l.status === 'raw');
  const unpriced = loot.filter((l) => !['sold', 'scrapped'].includes(l.status) && !Number(l.est_sell_auec));
  const repairing = loot.filter((l) => l.status === 'repairing');
  const readyToList = loot.filter((l) => l.status === 'repaired' && !l.linked_product_id);
  const held = loot.filter((l) => !['sold', 'scrapped'].includes(l.status));

  const unstowed = crates.filter((c) => !c.location_code && !['delivered', 'closed'].includes(c.stage));
  const openCrates = crates.filter((c) => !['delivered', 'closed'].includes(c.stage));

  const ready = jobs.filter((j) => j.status === 'ready' || (j.status === 'running' && j.ready_at && new Date(j.ready_at) <= new Date()));
  const running = jobs.filter((j) => j.status === 'running');
  const gathering = fabs.filter((f) => f.status === 'gathering');
  const crafting = fabs.filter((f) => f.status === 'crafting');

  const counts = {
    intake: raw.length,
    warehouse: unstowed.length,
    inventory: unpriced.length,
    salvage: readyToList.length,
    refining: ready.length,
    fab: gathering.length + crafting.length,
  };

  const signals = [
    ready.length && { desk: 'refining', severity: 'critical', count: ready.length, label: 'OUT OF THE HOPPER', detail: 'Refined and waiting to be collected — a run nobody fetches is a run wasted.' },
    unpriced.length && { desk: 'inventory', severity: 'warning', count: unpriced.length, label: 'HELD WITHOUT A VALUE', detail: 'Stock on the floor nobody has appraised.' },
    unstowed.length && { desk: 'warehouse', severity: 'warning', count: unstowed.length, label: 'CRATES UNSTOWED', detail: 'No bay assigned — cargo that cannot be found is cargo we do not have.' },
    raw.length && { desk: 'intake', severity: 'notice', count: raw.length, label: 'RAW, UNWORKED', detail: 'Came in and has not been through a bench yet.' },
    readyToList.length && { desk: 'salvage', severity: 'notice', count: readyToList.length, label: 'REPAIRED, UNLISTED', detail: 'Ready for the shelf and not yet on it.' },
    gathering.length && { desk: 'fab', severity: 'notice', count: gathering.length, label: 'BENCH WANTS MATERIAL', detail: 'Fabrication runs gathering and not yet crafting.' },
  ].filter(Boolean);

  const gauges = {
    held: held.length,
    heldValue: held.reduce((s, l) => s + Number(l.est_sell_auec || 0) * Number(l.quantity || 1), 0),
    unpriced: unpriced.length,
    repairing: repairing.length,
    openCrates: openCrates.length,
    stowed: openCrates.length - unstowed.length,
    crateValue: openCrates.reduce((s, c) => s + Number(c.cargo_value_auec || 0), 0),
    running: running.length,
    ready: ready.length,
    fabOpen: fabs.filter((f) => f.status !== 'complete').length,
  };

  return { counts, signals, gauges };
}