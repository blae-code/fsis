import React from 'react';

const fmt = (v) => {
  const n = Math.round(v || 0);
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
};

const NOTCH = 'polygon(7px 0, 100% 0, 100% 100%, 0 100%, 0 7px)';

/** One instrument well — etched label, lit readout, tick baseline. */
function Gauge({ label, value, sub, color, fill }) {
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
      {sub && <div className="relative text-[6px] tracking-[0.14em] mt-0.5" style={{ color: '#5F564A' }}>{sub.toUpperCase()}</div>}
    </div>
  );
}

/** The yard's vital signs — read at a glance, never scrolled for. */
export default function GaugeColumn({ g }) {
  return (
    <div className="relative flex flex-col h-full min-h-0" style={{ clipPath: NOTCH, background: '#090705', boxShadow: 'inset 0 0 0 1px #2E2519' }}>
      <div className="flex items-center gap-2 px-3 py-2 shrink-0" style={{ background: 'linear-gradient(180deg,#171009,#0D0A07)', boxShadow: 'inset 0 -1px 0 #241C14' }}>
        <span className="text-[9px]" style={{ color: '#E0A22E' }}>◍</span>
        <span className="text-[8px] font-bold tracking-[0.28em]" style={{ color: '#EDE5D6' }}>VITALS</span>
        <span className="ml-auto text-[7px] tracking-[0.2em]" style={{ color: '#5F564A' }}>30D</span>
      </div>
      <div className="flex-1 min-h-0 overflow-auto p-1.5 grid grid-cols-2 gap-1 content-start">
        <Gauge label="TAKEN IN" value={`${fmt(g.income)} ¤`} color="#E0A22E" />
        <Gauge label="PAID OUT" value={`${fmt(g.expense)} ¤`} color="#C05050" />
        <Gauge label="NET" value={`${fmt(g.net)} ¤`} color={g.net >= 0 ? '#8A8F45' : '#C05050'} />
        <Gauge label="MARGIN" value={`${g.margin.toFixed(1)}%`} color={g.margin >= 0 ? '#5FA0A0' : '#C05050'} fill={g.margin} />
        <Gauge label="OPEN ORDERS" value={g.openOrders} sub="not delivered" color="#EDE5D6" />
        <Gauge label="DELIVERED" value={g.deliveredToday} sub="today" color="#8A8F45" />
        <Gauge label="SHELF VALUE" value={`${fmt(g.shelfValue)} ¤`} sub="listed stock" color="#C8893B" />
        <Gauge label="LOOT HELD" value={g.lootHeld} sub="unsold" color="#C8893B" />
        <div className="col-span-2">
          <Gauge label="INVOICES UNPAID" value={g.unpaidInvoices} sub="awaiting settlement" color={g.unpaidInvoices > 0 ? '#D08A6A' : '#5F6B33'} />
        </div>
      </div>
      <div className="shrink-0 h-[3px]" style={{ background: 'repeating-linear-gradient(45deg,#3F3018 0 5px,#120D08 5px 10px)' }} />
    </div>
  );
}