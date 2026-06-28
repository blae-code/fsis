export const missionInputStyle = { borderColor: '#5C4424', background: '#0B0906', color: '#EDE5D6' };
export const riskPenalty = { low: 1, medium: 0.78, high: 0.52 };
export const priorityBoost = { low: 0, normal: 2500, high: 7500 };

export function missionScore(m) {
  return (((m.reward_auec || 0) / Math.max(1, m.cargo_scu || 1)) + (priorityBoost[m.priority] || 0)) * (riskPenalty[m.risk_level] || 0.78);
}

function routeFit(m, lastStop) {
  if (!lastStop) return 0;
  const origin = (m.origin || '').toLowerCase().trim();
  const dest = (m.destination || '').toLowerCase().trim();
  const stop = lastStop.toLowerCase().trim();
  if (origin && origin === stop) return 12000;
  if (origin && stop.includes(origin)) return 6500;
  if (dest && dest === stop) return -5000;
  return 0;
}

export function optimizeMissions(missions) {
  const remaining = [...missions];
  const chain = [];
  while (remaining.length && chain.length < 10) {
    const lastStop = chain[chain.length - 1]?.destination;
    remaining.sort((a, b) => (missionScore(b) + routeFit(b, lastStop)) - (missionScore(a) + routeFit(a, lastStop)));
    chain.push(remaining.shift());
  }
  return chain.map((m, i) => ({ ...m, chain_position: i + 1 }));
}

export function chainStats(missions = [], capacity = 0) {
  const totalScu = missions.reduce((sum, m) => sum + (Number(m.cargo_scu) || 0), 0);
  const totalReward = missions.reduce((sum, m) => sum + (Number(m.reward_auec) || 0), 0);
  const highRisk = missions.filter((m) => m.risk_level === 'high').length;
  return { totalScu, totalReward, highRisk, overCapacity: capacity > 0 && totalScu > capacity };
}