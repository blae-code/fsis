export const missionInputStyle = { borderColor: '#5C4424', background: '#0B0906', color: '#EDE5D6' };
export const riskPenalty = { low: 1, medium: 0.78, high: 0.52 };
export const priorityBoost = { low: 0, normal: 2500, high: 7500 };

export function missionScore(m) {
  return (((m.reward_auec || 0) / Math.max(1, m.cargo_scu || 1)) + (priorityBoost[m.priority] || 0)) * (riskPenalty[m.risk_level] || 0.78);
}

export function optimizeMissions(missions) {
  return [...missions]
    .sort((a, b) => missionScore(b) - missionScore(a) || (a.origin || '').localeCompare(b.origin || '') || (a.destination || '').localeCompare(b.destination || ''))
    .map((m, i) => ({ ...m, chain_position: i + 1 }));
}