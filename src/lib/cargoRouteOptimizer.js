/**
 * Turns a bundle of cargo missions into a single flight path.
 *
 * A mission board gives you contracts; it does not give you an order to fly them in.
 * This walks the stops instead of the missions: at every landing it lifts what fits and
 * sets down what is owed there, always preferring a stop that frees the hold over one
 * that fills it. Ten contracts become one route with no location visited twice.
 */

const key = (s) => String(s || '').trim().toLowerCase();

export function buildStopPlan(missions = [], capacity = 0) {
  const items = missions.map((m, i) => ({
    id: m.id || String(i),
    name: m.mission_name || 'UNNAMED CONTRACT',
    scu: Number(m.cargo_scu) || 0,
    reward: Number(m.reward_auec) || 0,
    origin: m.origin || '—',
    destination: m.destination || '—',
    state: 'waiting',
  }));

  const warnings = [];
  items.forEach((it) => {
    if (capacity > 0 && it.scu > capacity) warnings.push(`${it.name} calls for ${it.scu} SCU — more than this hull holds.`);
  });

  const stops = [];
  let load = 0;
  let guard = 0;

  while (items.some((i) => i.state !== 'delivered') && guard++ < 40) {
    const map = new Map();
    items.forEach((it) => {
      const at = it.state === 'waiting' ? it.origin : it.state === 'held' ? it.destination : null;
      if (!at) return;
      const k = key(at);
      const e = map.get(k) || { label: at, pick: [], drop: [] };
      (it.state === 'waiting' ? e.pick : e.drop).push(it);
      map.set(k, e);
    });

    let best = null;
    for (const e of map.values()) {
      const free = capacity > 0 ? capacity - load : Number.POSITIVE_INFINITY;
      let space = free + e.drop.reduce((s, i) => s + i.scu, 0);
      const fits = [];
      [...e.pick]
        .sort((a, b) => b.reward / Math.max(1, b.scu) - a.reward / Math.max(1, a.scu))
        .forEach((p) => {
          if (p.scu <= space) { fits.push(p); space -= p.scu; }
        });
      const score = e.drop.length * 3 + fits.length * 2;
      if (score > 0 && (!best || score > best.score)) best = { label: e.label, drop: e.drop, fits, score };
    }

    if (!best) {
      warnings.push('The hold fills before the remaining pickups can be lifted — split the chain or fly a larger hull.');
      break;
    }

    best.drop.forEach((i) => { i.state = 'delivered'; load -= i.scu; });
    best.fits.forEach((i) => { i.state = 'held'; load += i.scu; });

    stops.push({
      label: best.label,
      pickups: best.fits.map((i) => ({ id: i.id, name: i.name, scu: i.scu, to: i.destination })),
      dropoffs: best.drop.map((i) => ({ id: i.id, name: i.name, scu: i.scu, reward: i.reward })),
      load: Math.max(0, load),
    });
  }

  const order = [];
  stops.forEach((s) => s.pickups.forEach((p) => { if (!order.includes(p.id)) order.push(p.id); }));

  return {
    stops,
    warnings,
    order,
    peakLoad: stops.reduce((m, s) => Math.max(m, s.load), 0),
    totalReward: missions.reduce((s, m) => s + (Number(m.reward_auec) || 0), 0),
    totalScu: missions.reduce((s, m) => s + (Number(m.cargo_scu) || 0), 0),
    stranded: items.filter((i) => i.state !== 'delivered').map((i) => i.name),
  };
}