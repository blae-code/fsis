import React from 'react';

const RISK = { low: '#5F6B33', medium: '#8A6430', high: '#C05050' };

/** The board as taken from the terminal — tick up to ten and the route is drawn from them. */
export default function MissionPickList({ missions, picked, onToggle, limit = 10 }) {
  if (!missions.length) {
    return <p className="text-[9px] p-2" style={{ color: '#5F564A' }}>No open cargo contracts logged. Add them in the Trade room, or import a mission list.</p>;
  }
  return (
    <div className="divide-y" style={{ borderColor: '#1E1811' }}>
      {missions.map((m) => {
        const on = picked.has(m.id);
        const full = !on && picked.size >= limit;
        return (
          <button
            key={m.id}
            disabled={full}
            onClick={() => onToggle(m.id)}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-left disabled:opacity-30"
            style={{ background: on ? 'linear-gradient(90deg,#1B1309,#0B0906)' : 'transparent' }}
          >
            <span
              className="w-3 h-3 shrink-0 text-[7px] flex items-center justify-center"
              style={{ boxShadow: `inset 0 0 0 1px ${on ? '#E0A22E' : '#3A2F20'}`, color: '#E0A22E' }}
            >
              {on ? '✓' : ''}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[9px] truncate" style={{ color: on ? '#F0E7D6' : '#B8AC9A' }}>{m.mission_name}</span>
              <span className="block text-[7px] tracking-[0.14em] truncate" style={{ color: '#5F564A' }}>
                {(m.origin || '—').toUpperCase()} ▸ {(m.destination || '—').toUpperCase()}
              </span>
            </span>
            <span className="text-right shrink-0">
              <span className="block text-[9px] tabular-nums" style={{ color: '#E0A22E' }}>{(m.cargo_scu || 0)} SCU</span>
              <span className="block text-[7px] tabular-nums" style={{ color: RISK[m.risk_level] || '#8A6430' }}>
                {(m.reward_auec || 0).toLocaleString()} aUEC
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}