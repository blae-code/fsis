import React from 'react';

const statuses = ['not_tested', 'pass', 'review', 'blocked'];
const colors = { not_tested: '#7A6E60', pass: '#8A8F45', review: '#E0A22E', blocked: '#C05050' };

export default function QaChecklistPanel({ checks = [], onStatus }) {
  const groups = checks.reduce((acc, c) => ({ ...acc, [c.phase]: [...(acc[c.phase] || []), c] }), {});
  return (
    <div className="border p-3" style={{ borderColor: '#2A2118', background: '#100E0B' }}>
      <p className="text-[8px] tracking-[0.24em]" style={{ color: '#E0A22E' }}>PHASES 2–7 · PERSISTENT QA CHECKLIST</p>
      <div className="grid xl:grid-cols-2 gap-3 mt-3">
        {Object.entries(groups).map(([phase, rows]) => <div key={phase} className="border p-3" style={{ borderColor: '#3A2F20', background: '#0A0806' }}><b className="text-[10px]" style={{ color: '#D8CFC0' }}>{phase}</b><div className="space-y-2 mt-3">{rows.map((c) => <div key={c.check_key} className="border-l-2 pl-2" style={{ borderColor: colors[c.status] || '#7A6E60' }}><p className="text-[9px]" style={{ color: '#CFC4B4' }}>{c.label}</p><div className="flex flex-wrap gap-1 mt-1">{statuses.map((s) => <button key={s} onClick={() => onStatus(c, s)} className="px-2 py-1 text-[8px] border" style={{ borderColor: c.status === s ? colors[s] : '#2A2118', color: c.status === s ? colors[s] : '#7A6E60' }}>{s.replace('_', ' ')}</button>)}</div></div>)}</div></div>)}
      </div>
    </div>
  );
}