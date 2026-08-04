import React from 'react';

const num = (n) => Math.round(Number(n) || 0).toLocaleString();

/** The load drawn to scale: what comes out, what the hopper eats, and what the fee takes off the return. */
export default function YieldFlowBar({ est }) {
  const input = Math.max(1, est.input);
  const outPct = (est.outScu / input) * 100;
  const gross = est.net + est.cost;
  const feePct = gross > 0 ? Math.min(100, (est.cost / gross) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[7px] font-bold tracking-[0.2em]" style={{ color: '#8A7E6C' }}>MASS THROUGH THE HOPPER</span>
          <span className="text-[7px] tabular-nums" style={{ color: '#5F564A' }}>{num(est.input)} SCU IN</span>
        </div>
        <div className="flex h-4 overflow-hidden" style={{ boxShadow: 'inset 0 0 0 1px #2E2519', background: '#090705' }}>
          <div className="flex items-center justify-center" style={{ width: `${outPct}%`, background: 'linear-gradient(180deg,#3A2A10,#1B1309)' }}>
            <span className="text-[7px] tabular-nums tracking-[0.1em] px-1 truncate" style={{ color: '#E0A22E' }}>{est.outScu} OUT</span>
          </div>
          <div className="flex-1 flex items-center justify-center" style={{ background: 'repeating-linear-gradient(45deg,#2A1210 0 4px,#120A08 4px 8px)' }}>
            <span className="text-[7px] tabular-nums tracking-[0.1em] px-1 truncate" style={{ color: '#C05050' }}>{est.lostScu} LOST</span>
          </div>
        </div>
        <p className="text-[7px]" style={{ color: '#4A4136' }}>{est.yieldPct}% of the load survives refining by this method.</p>
      </div>

      <div className="space-y-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[7px] font-bold tracking-[0.2em]" style={{ color: '#8A7E6C' }}>WHERE THE RETURN GOES</span>
          <span className="text-[7px] tabular-nums" style={{ color: '#5F564A' }}>{num(gross)} aUEC GROSS</span>
        </div>
        <div className="flex h-4 overflow-hidden" style={{ boxShadow: 'inset 0 0 0 1px #2E2519', background: '#090705' }}>
          <div className="flex items-center justify-center" style={{ width: `${feePct}%`, background: 'repeating-linear-gradient(45deg,#3F3018 0 4px,#120D08 4px 8px)' }}>
            <span className="text-[7px] tabular-nums px-1 truncate" style={{ color: '#8A7E6C' }}>FEE {num(est.cost)}</span>
          </div>
          <div className="flex-1 flex items-center justify-center" style={{ background: est.net > 0 ? 'linear-gradient(180deg,#252B10,#111406)' : '#2A1210' }}>
            <span className="text-[7px] tabular-nums px-1 truncate" style={{ color: est.net > 0 ? '#8A8F45' : '#C05050' }}>KEPT {num(est.net)}</span>
          </div>
        </div>
        <p className="text-[7px]" style={{ color: '#4A4136' }}>
          {est.net > 0 ? 'The load pays for itself and leaves the balance above.' : 'This load loses money — the fee outruns the refined value.'}
        </p>
      </div>
    </div>
  );
}