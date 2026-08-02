import React from 'react';

/** At-a-glance reading of the board: what you hold, what is open, what has been credited to you. */
export default function BoardStatStrip({ stats = [] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {stats.map((s) => (
        <div
          key={s.label}
          className="border px-2.5 py-2 relative overflow-hidden"
          style={{ borderColor: '#221B12', background: 'linear-gradient(180deg, #100D09, #0B0906)' }}
        >
          <span className="absolute left-0 top-0 bottom-0 w-px" style={{ background: `linear-gradient(180deg, ${s.color}, transparent)` }} />
          <div className="text-[7px] font-bold tracking-[0.2em] mb-0.5" style={{ color: '#6B6155' }}>{s.label}</div>
          <div className="text-[16px] leading-none tabular-nums" style={{ color: s.color }}>{s.value}</div>
          {s.hint && <div className="text-[7px] mt-1 truncate" style={{ color: '#5F564A' }}>{s.hint}</div>}
        </div>
      ))}
    </div>
  );
}