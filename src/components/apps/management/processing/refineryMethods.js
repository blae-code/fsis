/**
 * Refinery methods as the game offers them: yield traded against time and cost.
 * The fastest method is rarely the one that returns the most, and the choice is
 * worth stating openly before 300 SCU of ore is committed to a hopper.
 */
export const METHODS = [
  { id: 'dinyx',      label: 'DINYX SOLVENTATION',   yield: 1.00, time: 1.00, cost: 1.00, note: 'The balanced default' },
  { id: 'ferron',     label: 'FERRON EXCHANGE',      yield: 1.10, time: 1.35, cost: 1.15, note: 'More out, slower and dearer' },
  { id: 'cormack',    label: 'CORMACK',              yield: 1.06, time: 1.15, cost: 1.05, note: 'A little more, a little slower' },
  { id: 'electro',    label: 'ELECTROSTAROLYSIS',    yield: 0.94, time: 0.80, cost: 0.95, note: 'Quicker, at a cost in yield' },
  { id: 'thermonatic', label: 'THERMONATIC DEP.',    yield: 0.88, time: 0.62, cost: 1.10, note: 'Fast out of the hopper' },
  { id: 'pyroclastic', label: 'PYROCLASTIC SUBL.',   yield: 1.15, time: 1.60, cost: 1.30, note: 'Best yield, longest wait' },
  { id: 'gaslight',   label: 'GASLIGHT',             yield: 0.90, time: 0.72, cost: 0.85, note: 'Cheap and quick, lossy' },
  { id: 'kazen',      label: 'KAZEN WINNOWING',      yield: 0.98, time: 0.90, cost: 0.90, note: 'Cheap without much loss' },
  { id: 'xcr',        label: 'XCR REACTION',         yield: 1.03, time: 1.05, cost: 1.02, note: 'Marginal gain, near-even' },
];

/** What comes out of a hopper, and what comes out of a scraper, refined the same way. */
export const FEEDSTOCKS = [
  { id: 'quantanium',  label: 'QUANTANIUM',  base: 0.62, hoursPerHundred: 3.4, kind: 'ore' },
  { id: 'taranite',    label: 'TARANITE',    base: 0.71, hoursPerHundred: 2.6, kind: 'ore' },
  { id: 'bexalite',    label: 'BEXALITE',    base: 0.74, hoursPerHundred: 2.4, kind: 'ore' },
  { id: 'laranite',    label: 'LARANITE',    base: 0.78, hoursPerHundred: 2.0, kind: 'ore' },
  { id: 'agricium',    label: 'AGRICIUM',    base: 0.80, hoursPerHundred: 1.8, kind: 'ore' },
  { id: 'hephaestani', label: 'HEPHAESTANITE', base: 0.79, hoursPerHundred: 1.9, kind: 'ore' },
  { id: 'titanium',    label: 'TITANIUM',    base: 0.85, hoursPerHundred: 1.4, kind: 'ore' },
  { id: 'gold',        label: 'GOLD',        base: 0.83, hoursPerHundred: 1.6, kind: 'ore' },
  { id: 'copper',      label: 'COPPER',      base: 0.88, hoursPerHundred: 1.1, kind: 'ore' },
  { id: 'aluminium',   label: 'ALUMINIUM',   base: 0.92, hoursPerHundred: 0.9, kind: 'ore' },
  { id: 'rmc',         label: 'RMC (SCRAP)', base: 0.95, hoursPerHundred: 0.7, kind: 'salvage' },
  { id: 'cmr',         label: 'CMR (HULL)',  base: 0.93, hoursPerHundred: 0.8, kind: 'salvage' },
  { id: 'cms',         label: 'CMS (SHIP)',  base: 0.90, hoursPerHundred: 1.0, kind: 'salvage' },
];

export const methodMeta = (id) => METHODS.find((m) => m.id === id) || METHODS[0];
export const feedMeta = (id) => FEEDSTOCKS.find((f) => f.id === id) || FEEDSTOCKS[0];

/** Reckon a hopper before it is filled: what comes out, when, what it costs, what it is worth. */
export function refineEstimate({ feedId, methodId, scu, unitPrice = 0 }) {
  const f = feedMeta(feedId);
  const m = methodMeta(methodId);
  const input = Math.max(0, Number(scu) || 0);
  const outScu = input * f.base * m.yield;
  const hours = (input / 100) * f.hoursPerHundred * m.time;
  const cost = input * 55 * m.cost;
  const gross = outScu * (Number(unitPrice) || 0);
  return {
    input,
    outScu: Math.round(outScu * 10) / 10,
    lostScu: Math.round((input - outScu) * 10) / 10,
    yieldPct: Math.round(f.base * m.yield * 100),
    hours: Math.round(hours * 10) / 10,
    readyAt: new Date(Date.now() + hours * 3600000),
    cost: Math.round(cost),
    gross: Math.round(gross),
    net: Math.round(gross - cost),
  };
}