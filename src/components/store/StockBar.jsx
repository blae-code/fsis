import React from 'react';

const LOW_AT = 50;
const CAP = 200; // visual full-gauge reference
const CELLS = 14;

/** Segmented industrial stock gauge — skewed fill cells replace the plain bar.
 *  Green when healthy, amber when low, hollow red-rimmed cells when out. */
export default function StockBar({ stock = 0, unit = 'SCU' }) {
  const low = stock > 0 && stock <= LOW_AT;
  const out = stock <= 0;
  const filled = out ? 0 : Math.max(1, Math.round(Math.min(1, stock / CAP) * CELLS));
  const fill = low ? '#C8893B' : '#7BA05B';

  return (
    <div className="space-y-1">
      <svg width="100%" height="6" viewBox={`0 0 ${CELLS * 9} 8`} preserveAspectRatio="none" role="img" aria-label={`${stock} ${unit} in stock`}>
        {Array.from({ length: CELLS }).map((_, i) => (
          <path
            key={i}
            d={`M${i * 9 + 2} 8 L${i * 9 + 4} 0 L${i * 9 + 9} 0 L${i * 9 + 7} 8 Z`}
            fill={i < filled ? fill : 'rgba(36, 28, 18, 0.8)'}
            stroke={out ? 'rgba(192, 80, 80, 0.45)' : i < filled ? 'none' : '#3A2F20'}
            strokeWidth="0.8"
          />
        ))}
      </svg>
      <div className="font-mono text-[10px]" style={{ color: out ? '#C05050' : low ? '#E0A22E' : '#9C9080' }}>
        {out ? 'OUT OF STOCK' : low ? `LOW STOCK — ${stock} ${unit} LEFT` : `${stock} ${unit} in stock`}
      </div>
    </div>
  );
}