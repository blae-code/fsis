import React from 'react';

const LOW_AT = 50;
const CAP = 200; // visual full-bar reference

/** Stock urgency bar — flags low inventory to nudge buyers */
export default function StockBar({ stock = 0, unit = 'SCU' }) {
  const low = stock > 0 && stock <= LOW_AT;
  const out = stock <= 0;
  const widthPct = Math.min(100, Math.max(3, (stock / CAP) * 100));
  return (
    <div className="space-y-1">
      <div className="h-1 w-full" style={{ background: '#241C12' }}>
        <div
          className="h-full transition-all"
          style={{
            width: out ? '0%' : `${widthPct}%`,
            background: low ? '#C8893B' : '#7BA05B',
          }}
        />
      </div>
      <div className="font-mono text-[10px]" style={{ color: out ? '#C05050' : low ? '#E0A22E' : '#9C9080' }}>
        {out ? 'OUT OF STOCK' : low ? `LOW STOCK — ${stock} ${unit} LEFT` : `${stock} ${unit} in stock`}
      </div>
    </div>
  );
}