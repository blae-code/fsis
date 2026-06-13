import React from 'react';

const LOW_AT = 50;
const CAP = 200; // visual full-bar reference
const SEGMENTS = 12;

/** Segmented industrial stock gauge — skewed fill cells, hazard-striped when
 *  low, hollow red cells when out. Flags low inventory to nudge buyers. */
export default function StockBar({ stock = 0, unit = 'SCU' }) {
  const low = stock > 0 && stock <= LOW_AT;
  const out = stock <= 0;
  const filled = out ? 0 : Math.max(1, Math.round((Math.min(stock, CAP) / CAP) * SEGMENTS));

  return (
    <div className="space-y-1">
      <div className="flex gap-[2px] h-1.5 px-0.5">
        {Array.from({ length: SEGMENTS }).map((_, i) => {
          const isFilled = i < filled;
          return (
            <div
              key={i}
              className="flex-1 transition-colors"
              style={{
                transform: 'skewX(-18deg)',
                background: out
                  ? 'transparent'
                  : isFilled
                    ? (low ? '#C8893B' : '#7BA05B')
                    : '#241C12',
                backgroundImage: low && isFilled
                  ? 'repeating-linear-gradient(45deg, rgba(0, 0, 0, 0.35) 0 2px, transparent 2px 4px)'
                  : undefined,
                boxShadow: out ? 'inset 0 0 0 1px rgba(192, 80, 80, 0.3)' : undefined,
              }}
            />
          );
        })}
      </div>
      <div className="font-mono text-[10px]" style={{ color: out ? '#C05050' : low ? '#E0A22E' : '#9C9080' }}>
        {out ? 'OUT OF STOCK' : low ? `LOW STOCK — ${stock} ${unit} LEFT` : `${stock} ${unit} in stock`}
      </div>
    </div>
  );
}