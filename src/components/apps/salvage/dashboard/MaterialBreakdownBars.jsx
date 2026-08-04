import React from 'react';
import { fmtAuec } from '@/components/console/deck/DeckGauge';

/** Material mix as plain stamped bars — SCU held, unit price and what it comes to. */
export default function MaterialBreakdownBars({ breakdown }) {
  return (
    <div className="space-y-2">
      {breakdown.map((m) => (
        <div key={m.code} className="space-y-1">
          <div className="flex items-baseline justify-between gap-2">
            <div className="flex items-baseline gap-2 min-w-0">
              <span className="text-[10px] font-bold tracking-[0.2em]" style={{ color: m.color }}>{m.code}</span>
              <span className="text-[7px] tracking-[0.16em] truncate" style={{ color: '#5F564A' }}>{m.label}</span>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[11px] tabular-nums" style={{ color: '#EDE5D6' }}>{m.scu.toLocaleString()} SCU</span>
              <span className="text-[9px] tabular-nums ml-2" style={{ color: m.color }}>{fmtAuec(m.value)} ¤</span>
            </div>
          </div>
          <div className="h-2.5 relative overflow-hidden" style={{ background: '#0C0A07', boxShadow: 'inset 0 0 0 1px #241C14' }}>
            <div
              className="h-full"
              style={{ width: `${Math.min(100, m.share * 100)}%`, background: `linear-gradient(90deg,${m.color},${m.color}55)` }}
            />
            <div className="pointer-events-none absolute inset-0 opacity-[0.18]" style={{ background: 'repeating-linear-gradient(90deg,rgba(0,0,0,.6) 0 1px,transparent 1px 4px)' }} />
          </div>
          <div className="text-[7px] tracking-[0.16em] tabular-nums" style={{ color: '#5F564A' }}>
            {(m.share * 100).toFixed(1)}% OF MASS · {m.price > 0 ? `${m.price.toFixed(2)} aUEC/SCU AT BEST SELL` : 'NO MARKET PRICE SYNCED'}
          </div>
        </div>
      ))}
    </div>
  );
}