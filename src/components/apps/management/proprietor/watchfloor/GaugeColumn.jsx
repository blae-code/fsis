import React from 'react';

const fmt = (v) => {
  const n = Math.round(v || 0);
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
};

function Gauge({ label, value, sub, color, fill }) {
  return (
    <div className="border px-2 py-1.5" style={{ borderColor: '#241C14', background: '#0B0906' }}>
      <div className="text-[7px] tracking-[0.22em]" style={{ color: '#5F564A' }}>{label}</div>
      <div className="text-sm font-bold leading-tight" style={{ color }}>{value}</div>
      {typeof fill === 'number' && (
        <div className="h-[2px] mt-1" style={{ background: '#241C14' }}>
          <div className="h-full" style={{ width: `${Math.max(0, Math.min(100, fill))}%`, background: color }} />
        </div>
      )}
      {sub && <div className="text-[7px] mt-0.5" style={{ color: '#6B6155' }}>{sub}</div>}
    </div>
  );
}

/** The yard's vital signs — read at a glance, never scrolled for. */
export default function GaugeColumn({ g }) {
  return (
    <div className="flex flex-col h-full min-h-0 border" style={{ borderColor: '#3A2F20', background: '#0A0806' }}>
      <div className="px-3 py-2 border-b shrink-0" style={{ borderColor: '#241C14', background: '#120D08' }}>
        <span className="text-[9px] font-bold tracking-[0.24em]" style={{ color: '#EDE5D6' }}>VITALS</span>
        <span className="ml-2 text-[7px]" style={{ color: '#5F564A' }}>30 DAYS</span>
      </div>
      <div className="flex-1 min-h-0 overflow-auto p-2 grid grid-cols-2 gap-1.5 content-start">
        <Gauge label="TAKEN IN" value={`${fmt(g.income)} ¤`} color="#E0A22E" />
        <Gauge label="PAID OUT" value={`${fmt(g.expense)} ¤`} color="#C05050" />
        <Gauge label="NET" value={`${fmt(g.net)} ¤`} color={g.net >= 0 ? '#8A8F45' : '#C05050'} />
        <Gauge label="MARGIN" value={`${g.margin.toFixed(1)}%`} color={g.margin >= 0 ? '#5FA0A0' : '#C05050'} fill={g.margin} />
        <Gauge label="OPEN ORDERS" value={g.openOrders} sub="not yet delivered" color="#EDE5D6" />
        <Gauge label="DELIVERED" value={g.deliveredToday} sub="today" color="#8A8F45" />
        <Gauge label="SHELF VALUE" value={`${fmt(g.shelfValue)} ¤`} sub="listed stock" color="#C8893B" />
        <Gauge label="LOOT HELD" value={g.lootHeld} sub="unsold items" color="#C8893B" />
        <div className="col-span-2">
          <Gauge label="INVOICES UNPAID" value={g.unpaidInvoices} sub="awaiting settlement" color={g.unpaidInvoices > 0 ? '#D08A6A' : '#5F6B33'} />
        </div>
      </div>
    </div>
  );
}