const H = 3600000;
const hoursUntil = (iso) => (new Date(iso).getTime() - Date.now()) / H;

const isOut = (j) => j.status === 'ready' || (j.status === 'running' && hoursUntil(j.ready_at) <= 0);
const isCooking = (j) => j.status === 'running' && hoursUntil(j.ready_at) > 0;

/**
 * Read the whole refining floor off the hopper records: what mass has passed through,
 * how much of the floor is presently in use, and when each batch is actually due out.
 * Every figure comes from real records — nothing here is modelled or assumed.
 */
export function throughputModel(jobs, { windowDays = 30 } = {}) {
  const since = Date.now() - windowDays * 24 * H;
  const scu = (j) => Number(j.quantity_scu) || 0;
  const val = (j) => Number(j.est_value_auec) || 0;

  const cooking = jobs.filter(isCooking);
  const out = jobs.filter(isOut);
  const collected = jobs.filter((j) => j.status === 'collected');
  const abandoned = jobs.filter((j) => j.status === 'abandoned');

  const recent = collected.filter((j) => new Date(j.collected_at || j.ready_at).getTime() >= since);
  const throughputScu = recent.reduce((s, j) => s + scu(j), 0);
  const throughputValue = recent.reduce((s, j) => s + val(j), 0);

  // Turnaround = hopper start to the moment somebody actually collected it, which is the
  // figure that matters: a batch out at 03:00 that nobody fetches until noon took until noon.
  const turnarounds = recent
    .filter((j) => j.started_at && j.collected_at)
    .map((j) => (new Date(j.collected_at) - new Date(j.started_at)) / H)
    .filter((h) => h > 0);
  const avgTurnaround = turnarounds.length ? turnarounds.reduce((a, b) => a + b, 0) / turnarounds.length : 0;
  const worstTurnaround = turnarounds.length ? Math.max(...turnarounds) : 0;

  // Collection lag: how long refined stock sits out before anyone goes and gets it.
  const lags = recent
    .filter((j) => j.ready_at && j.collected_at)
    .map((j) => (new Date(j.collected_at) - new Date(j.ready_at)) / H)
    .filter((h) => h >= 0);
  const avgLag = lags.length ? lags.reduce((a, b) => a + b, 0) / lags.length : 0;

  const inFloor = cooking.length + out.length;
  const capacityScu = cooking.reduce((s, j) => s + scu(j), 0) + out.reduce((s, j) => s + scu(j), 0);

  const locations = [...new Set(jobs.map((j) => j.location).filter(Boolean))];
  const byLocation = locations
    .map((loc) => {
      const here = jobs.filter((j) => j.location === loc);
      return {
        loc,
        cooking: here.filter(isCooking).length,
        out: here.filter(isOut).length,
        scu: here.filter((j) => isCooking(j) || isOut(j)).reduce((s, j) => s + scu(j), 0),
      };
    })
    .filter((l) => l.cooking + l.out > 0)
    .sort((a, b) => b.scu - a.scu);

  const queue = [...cooking, ...out]
    .map((j) => ({
      id: j.id,
      label: j.label,
      material: j.material,
      location: j.location,
      scu: scu(j),
      value: val(j),
      hours: Math.max(0, hoursUntil(j.ready_at)),
      ready: isOut(j),
    }))
    .sort((a, b) => a.hours - b.hours);

  const dueSoon = queue.filter((q) => !q.ready && q.hours <= 2).length;
  const rate = avgTurnaround > 0 ? throughputScu / Math.max(1, windowDays) : 0;

  return {
    windowDays,
    throughputScu,
    throughputValue,
    batchesDone: recent.length,
    avgTurnaround,
    worstTurnaround,
    avgLag,
    inFloor,
    capacityScu,
    cookingCount: cooking.length,
    outCount: out.length,
    abandonedCount: abandoned.length,
    byLocation,
    queue,
    dueSoon,
    dailyScu: rate,
  };
}