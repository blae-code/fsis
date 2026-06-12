import React from 'react';

/** Top-line KPI tiles for the Performance dashboard */
export default function KpiTiles({ tiles }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {tiles.map((t) => (
        <div
          key={t.label}
          className="border p-3"
          style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 8%)' }}
        >
          <div className="text-[9px] tracking-[0.2em] text-muted-foreground">{t.label}</div>
          <div className="text-lg font-bold mt-1" style={{ color: t.color || 'hsl(42, 85%, 60%)' }}>
            {t.value}
          </div>
          {t.sub && <div className="text-[9px] text-muted-foreground mt-0.5">{t.sub}</div>}
        </div>
      ))}
    </div>
  );
}