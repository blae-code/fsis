import React from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts';

/* ── palette ─────────────────────────────────────────────── */
const AMBER   = '#D4920B';
const BRONZE  = '#B0793A';
const TEAL    = '#6FA08F';
const BONE    = '#D8CFC0';
const DIM     = '#8A7E6C';
const DIMMER  = '#5C5044';
const BG      = '#0D0B09';
const PANEL   = '#121110';
const BORDER  = '#2A2118';
const GRID    = '#2A211844';

/* ── shared recharts theme ───────────────────────────────── */
const monoStyle = { fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fill: DIM, letterSpacing: '0.08em' };

function MonoTooltip({ active, payload, label, unit = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="font-mono text-[10px] px-3 py-2 border" style={{ background: '#0C0B0A', borderColor: '#5C4A33', color: BONE }}>
      <div style={{ color: DIM, marginBottom: 4 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.color || AMBER }}>
          {String(p.dataKey).toUpperCase()}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}{unit}
        </div>
      ))}
    </div>
  );
}

/* ── section label ───────────────────────────────────────── */
function SectionLabel({ children }) {
  return (
    <div className="font-mono text-[9px] tracking-[0.28em] mb-3 flex items-center gap-2" style={{ color: BRONZE }}>
      <span className="inline-block w-3 h-px" style={{ background: BRONZE }} />
      {children}
      <span className="flex-1 h-px" style={{ background: `${BRONZE}28` }} />
    </div>
  );
}

/* ── stat tile ───────────────────────────────────────────── */
function StatTile({ label, value, sub, accent = AMBER }) {
  return (
    <motion.div
      whileHover={{ y: -2, borderColor: '#5C4424', boxShadow: '0 0 14px rgba(212,146,11,0.08)' }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      className="border p-3 space-y-1"
      style={{ borderColor: BORDER, background: PANEL }}
    >
      <div className="font-mono text-[8px] tracking-[0.2em]" style={{ color: DIM }}>{label}</div>
      <div className="font-mono text-xl font-bold leading-none" style={{ color: accent }}>{value}</div>
      {sub && <div className="font-mono text-[9px]" style={{ color: DIMMER }}>{sub}</div>}
    </motion.div>
  );
}

/* ── main component ──────────────────────────────────────── */
export default function InventoryDashboard() {
  /* products — stock levels */
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.product.filter({ available: true }, 'sort_order'),
  });

  /* ledger — revenue over time */
  const { data: ledger = [] } = useQuery({
    queryKey: ['ledger_dashboard'],
    queryFn: () => base44.entities.ledger_entry.list('-entry_date', 200),
  });

  /* orders — for order-count stat */
  const { data: orders = [] } = useQuery({
    queryKey: ['orders_dashboard'],
    queryFn: () => base44.entities.order.list('-created_date', 200),
  });

  /* ── derived: stock bars (non-service, non-zero first, then out-of-stock) */
  const stockData = products
    .filter((p) => p.category !== 'service')
    .sort((a, b) => (b.stock || 0) - (a.stock || 0))
    .map((p) => ({
      name: p.code || p.product_name.slice(0, 6),
      stock: p.stock || 0,
      cap: 200,
    }));

  /* ── derived: daily revenue (last 30 days of income entries) */
  const today = new Date();
  const revenueByDay = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    revenueByDay[key] = 0;
  }
  ledger
    .filter((e) => e.entry_type === 'income' && e.entry_date)
    .forEach((e) => {
      const key = e.entry_date.slice(0, 10);
      if (key in revenueByDay) revenueByDay[key] += e.amount_auec || 0;
    });
  const revenueData = Object.entries(revenueByDay).map(([date, auec]) => ({
    date: date.slice(5),   // MM-DD
    auec,
  }));

  /* ── derived: stats */
  const totalRevenue    = ledger.filter((e) => e.entry_type === 'income').reduce((s, e) => s + (e.amount_auec || 0), 0);
  const totalExpenses   = ledger.filter((e) => e.entry_type === 'expense').reduce((s, e) => s + (e.amount_auec || 0), 0);
  const netProfit       = totalRevenue - totalExpenses;
  const totalStock      = stockData.reduce((s, p) => s + p.stock, 0);
  const deliveredOrders = orders.filter((o) => o.status === 'delivered').length;
  const openOrders      = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length;

  /* ── derived: order status breakdown */
  const statusColors = { new: '#C8A05B', confirmed: TEAL, in_fulfillment: AMBER, delivered: '#7BA05B', cancelled: '#C05050' };
  const statusData = ['new', 'confirmed', 'in_fulfillment', 'delivered', 'cancelled'].map((s) => ({
    status: s.replace('_', ' ').toUpperCase(),
    count: orders.filter((o) => o.status === s).length,
    fill: statusColors[s],
  })).filter((d) => d.count > 0);

  const fmtAuec = (n) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : String(n);

  return (
    <div className="space-y-6 max-w-5xl pb-4">

      {/* ── KPI tiles ───────────────────────────────────────── */}
      <div>
        <SectionLabel>OPERATIONAL SUMMARY</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          <StatTile label="TOTAL REVENUE"    value={fmtAuec(totalRevenue)}    sub="aUEC all time"       accent={AMBER} />
          <StatTile label="TOTAL EXPENSES"   value={fmtAuec(totalExpenses)}   sub="aUEC all time"       accent="#C8893B" />
          <StatTile label="NET PROFIT"       value={fmtAuec(netProfit)}        sub="revenue − expenses"  accent={netProfit >= 0 ? '#7BA05B' : '#C05050'} />
          <StatTile label="STOCK ON HAND"    value={totalStock.toLocaleString()} sub="SCU across wares"  accent={TEAL} />
          <StatTile label="OPEN ORDERS"      value={openOrders}                sub="awaiting fulfillment" accent={BONE} />
          <StatTile label="DELIVERED"        value={deliveredOrders}           sub="all time"            accent="#7BA05B" />
        </div>
      </div>

      {/* ── revenue area chart ──────────────────────────────── */}
      <div className="border p-4" style={{ borderColor: BORDER, background: PANEL }}>
        <SectionLabel>aUEC REVENUE — LAST 30 DAYS</SectionLabel>
        {revenueData.every((d) => d.auec === 0) ? (
          <div className="flex items-center justify-center h-32 font-mono text-[10px]" style={{ color: DIM }}>
            NO LEDGER INCOME ENTRIES IN RANGE
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={revenueData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={AMBER} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={AMBER} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={GRID} strokeDasharray="3 4" vertical={false} />
              <XAxis dataKey="date" tick={monoStyle} tickLine={false} axisLine={{ stroke: BORDER }} interval={4} />
              <YAxis tick={monoStyle} tickLine={false} axisLine={false} width={52}
                tickFormatter={(v) => fmtAuec(v)} />
              <Tooltip content={<MonoTooltip unit=" aUEC" />} />
              <Area type="monotone" dataKey="auec" stroke={AMBER} strokeWidth={1.5}
                fill="url(#revGrad)" dot={false} activeDot={{ r: 3, fill: AMBER }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── stock bar chart ─────────────────────────────────── */}
      <div className="border p-4" style={{ borderColor: BORDER, background: PANEL }}>
        <SectionLabel>SALVAGE INVENTORY LEVELS (SCU)</SectionLabel>
        {stockData.length === 0 ? (
          <div className="flex items-center justify-center h-32 font-mono text-[10px]" style={{ color: DIM }}>
            NO SALVAGE PRODUCTS LISTED
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(120, stockData.length * 36)}>
            <BarChart data={stockData} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }} barSize={14}>
              <CartesianGrid stroke={GRID} strokeDasharray="3 4" horizontal={false} />
              <XAxis type="number" tick={monoStyle} tickLine={false} axisLine={{ stroke: BORDER }} tickFormatter={(v) => `${v}`} />
              <YAxis type="category" dataKey="name" tick={{ ...monoStyle, fill: BONE, fontSize: 10 }} tickLine={false} axisLine={false} width={42} />
              <Tooltip content={<MonoTooltip unit=" SCU" />} />
              <Bar dataKey="stock" radius={[0, 2, 2, 0]}
                fill={TEAL}
                label={{
                  position: 'right',
                  style: { ...monoStyle, fill: DIM, fontSize: 9 },
                  formatter: (v) => v > 0 ? `${v} SCU` : 'OUT',
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── order status breakdown ──────────────────────────── */}
      {statusData.length > 0 && (
        <div className="border p-4" style={{ borderColor: BORDER, background: PANEL }}>
          <SectionLabel>ORDER STATUS BREAKDOWN</SectionLabel>
          <div className="space-y-2">
            {statusData.map((s) => {
              const pct = orders.length > 0 ? Math.round((s.count / orders.length) * 100) : 0;
              return (
                <div key={s.status} className="flex items-center gap-3 font-mono text-[10px]">
                  <span className="w-24 shrink-0 tracking-[0.1em]" style={{ color: DIM }}>{s.status}</span>
                  <div className="flex-1 h-3 relative" style={{ background: '#1A1510' }}>
                    <motion.div
                      className="absolute inset-y-0 left-0"
                      style={{ background: s.fill, clipPath: 'polygon(0 0, 100% 0, calc(100% - 4px) 100%, 0 100%)' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.7, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="w-8 text-right shrink-0" style={{ color: s.fill }}>{s.count}</span>
                  <span className="w-8 text-right shrink-0" style={{ color: DIMMER }}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}