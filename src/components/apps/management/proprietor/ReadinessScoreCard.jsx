import React from 'react';

export default function ReadinessScoreCard({ checks = [], blockers = [] }) {
  const total = checks.length || 1;
  const passed = checks.filter((c) => c.status === 'pass').length;
  const blocked = checks.filter((c) => c.status === 'blocked').length + blockers.filter((b) => b.severity === 'blocker').length;
  const score = Math.round((passed / total) * 100);
  const state = blocked ? 'CRITICAL' : score >= 90 ? 'LAUNCH READY' : score >= 65 ? 'NEARLY READY' : 'NEEDS WORK';
  const color = blocked ? '#C05050' : score >= 90 ? '#8A8F45' : '#E0A22E';
  return (
    <div className="border p-4" style={{ borderColor: color, background: '#0C0A07' }}>
      <p className="text-[8px] tracking-[0.24em]" style={{ color: '#7A6E60' }}>LAUNCH READINESS SCORE</p>
      <div className="flex items-end justify-between gap-4 mt-2"><b className="text-4xl" style={{ color }}>{score}%</b><span className="text-[10px] tracking-[0.22em]" style={{ color }}>{state}</span></div>
      <div className="mt-3 h-2 bg-[#2A2118]"><div className="h-full" style={{ width: `${score}%`, background: color }} /></div>
      <p className="text-[9px] mt-2" style={{ color: '#A89C8A' }}>{passed}/{total} checks passed · {blocked} critical signals</p>
    </div>
  );
}