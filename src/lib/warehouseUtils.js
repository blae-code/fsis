export const FREIGHT_STAGES = ['intake','inspected','priced','listed','reserved','picked','packed','loaded','delivered','closed'];

export const SOLO_SHIPS = [
  { name: 'Cutter Scout', scu: 4 },
  { name: 'Avenger Titan', scu: 8 },
  { name: 'Cutlass Black', scu: 46 },
  { name: 'Freelancer MAX', scu: 120 },
  { name: 'C2 Hercules', scu: 696 },
  { name: 'Reclaimer Hold', scu: 420 },
];

export const stageLabel = (stage) => (stage || 'intake').replace(/_/g, ' ').toUpperCase();
export const riskColor = (risk) => risk === 'high' ? '#C0502D' : risk === 'low' ? '#8A8F45' : '#C8893B';

export function warehouseMetrics(crates = [], locations = []) {
  const scu = crates.reduce((s, c) => s + (Number(c.scu_used) || 0), 0);
  const value = crates.reduce((s, c) => s + (Number(c.cargo_value_auec) || 0), 0);
  const loaded = crates.filter((c) => ['packed','loaded'].includes(c.stage)).length;
  const capacity = locations.reduce((s, l) => s + (Number(l.capacity_scu) || 0), 0);
  return { scu, value, loaded, capacity, utilization: capacity ? Math.round((scu / capacity) * 100) : 0 };
}