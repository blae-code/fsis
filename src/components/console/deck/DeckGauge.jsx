import React from 'react';

export const fmtAuec = (v) => {
  const n = Math.round(v || 0);
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
};

/** One instrument well — etched label, lit readout, tick baseline. */
export default function DeckGauge({ label, value, sub, color = '#EDE5D6', fill }) {
  return (
    <div className="relative px-2 py-1.5 overflow-hidden" style={{ background: 'linear-gradient(160deg,#100C08,#0A0806)', boxShadow: 'inset 0 0 0 1px #241C14' }}>
      <div className="pointer-events-none absolute inset-0 opacity-[0.10]" style={{ background: 'repeating-linear-gradient(180deg,rgba(255,225,170,.14) 0 1px,transparent 1px 4px)' }} />
      <div className="relative text-[6px] tracking-[0.26em]" style={{ color: '#544A3D' }}>{label}</div>
      <div className="relative text-[13px] font-bold leading-tight tabular-nums" style={{ color, textShadow: `0 0 12px ${color}44` }}>{value}</div>
      <div className="relative h-[3px] mt-1" style={{ background: 'repeating-linear-gradient(90deg,#241C14 0 1px,transparent 1px 4px)' }}>
        {typeof fill === 'number' && (
          <div className="h-full" style={{ width: `${Math.max(0, Math.min(100, fill))}%`, background: color, boxShadow: `0 0 6px ${color}88` }} />
        )}
      </div>
      {sub && <div className="relative text-[6px] tracking-[0.14em] mt-0.5" style={{ color: '#5F564A' }}>{String(sub).toUpperCase()}</div>}
    </div>
  );
}