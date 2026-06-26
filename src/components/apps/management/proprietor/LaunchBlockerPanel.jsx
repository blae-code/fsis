import React from 'react';

export default function LaunchBlockerPanel({ blockers = [] }) {
  return (
    <div className="border p-3" style={{ borderColor: '#2A2118', background: '#100E0B' }}>
      <p className="text-[8px] tracking-[0.24em]" style={{ color: '#E0A22E' }}>PHASE 5 · LAUNCH BLOCKER TRIAGE</p>
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-2 mt-3">
        {blockers.length ? blockers.map((b) => <div key={b.label} className="border p-3" style={{ borderColor: b.severity === 'blocker' ? '#8A3A2E' : '#5C4424', background: '#0A0806' }}><b className="text-[9px]" style={{ color: b.severity === 'blocker' ? '#C05050' : '#E0A22E' }}>{b.label}</b><p className="text-[8px] mt-2" style={{ color: '#A89C8A' }}>{b.detail}</p></div>) : <p className="text-[10px]" style={{ color: '#8A8F45' }}>No computed launch blockers detected.</p>}
      </div>
    </div>
  );
}