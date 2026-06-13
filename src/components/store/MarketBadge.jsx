import React from 'react';
import DeltaGlyph from '@/components/brand/glyphs/DeltaGlyph';

/** Compares an FSIS price against the live UEX best-sell and shows the value delta */
export default function MarketBadge({ price, marketBest }) {
  if (!marketBest || !price) return null;
  const pct = Math.round(((marketBest - price) / marketBest) * 100);
  const below = pct > 1;
  const above = pct < -1;
  const label = below ? `${pct}% BELOW MARKET` : above ? `${Math.abs(pct)}% OVER MARKET` : 'AT MARKET';
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 font-mono text-[8px] font-bold tracking-[0.12em] border"
      style={{
        borderColor: below ? '#4A6B3A' : '#3A2F20',
        color: below ? '#7BA05B' : above ? '#C8A05B' : '#8A7E6C',
        background: below ? 'rgba(123, 160, 91, 0.08)' : '#0E0C09',
      }}
      title={`UEX best sell: ${marketBest.toLocaleString()} aUEC`}
    >
      <DeltaGlyph dir={below ? 'down' : above ? 'up' : 'par'} className="w-2 h-2 shrink-0" />
      {label}
    </span>
  );
}