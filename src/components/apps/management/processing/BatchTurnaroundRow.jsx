import React from 'react';

const num = (n) => Math.round(Number(n) || 0).toLocaleString();
const hrs = (h) => (h >= 1 ? `${Math.round(h * 10) / 10} H` : `${Math.max(1, Math.round(h * 60))} MIN`);

/** One batch on the floor: its mass, where it sits, and how long until it is actually out. */
export default function BatchTurnaroundRow({ b, longest }) {
  const pct = longest > 0 ? Math.min(100, (b.hours / longest) * 100) : 0;
  const soon = !b.ready && b.hours <= 2;
  const tone = b.ready ? '#E0A22E' : soon ? '#8A8F45' : '#8A7E6C';

  return (
    <div className="px-1 py-1.5">
      <div className="flex items-baseline gap-2">
        <span className="text-[8px] truncate flex-1" style={{ color: '#EDE5D6' }}>{b.label}</span>
        <span className="text-[7px] tabular-nums w-16 text-right" style={{ color: '#8A7E6C' }}>{num(b.scu)} SCU</span>
        <span className="text-[7px] tabular-nums w-20 text-right" style={{ color: tone }}>
          {b.ready ? 'OUT NOW' : hrs(b.hours)}
        </span>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <span className="flex-1 h-1" style={{ background: '#120D08' }}>
          <span
            className="block h-1"
            style={{ width: b.ready ? '100%' : `${100 - pct}%`, background: b.ready ? '#E0A22E' : soon ? '#8A8F45' : '#3F3018' }}
          />
        </span>
        <span className="text-[7px] tracking-[0.1em] truncate w-40" style={{ color: '#4A4136' }}>
          {[b.material, b.location].filter(Boolean).join(' · ').toUpperCase() || 'NO LOCATION STATED'}
        </span>
      </div>
    </div>
  );
}