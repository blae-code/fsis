import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import { IdleProcessor } from '@/components/brand/glyphs/EmptyStates';

/* ── palette ──────────────────────────────────────────── */
const AMBER  = '#D4920B';
const TEAL   = '#6FA08F';
const BONE   = '#D8CFC0';
const DIM    = '#7A6E60';
const DIMMER = '#4A4038';
const PANEL  = '#111009';
const BDR    = '#2A2118';
const BDR_HI = '#5C4424';
const GRID   = 'rgba(90,62,28,0.18)';

const MONO = { fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fill: DIM, letterSpacing: '0.06em' };

/* ── helpers ──────────────────────────────────────────── */
function fmtAuec(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}k`;
  return n.toLocaleString();
}

/* ── sub-components ───────────────────────────────────── */
function SectionHead({ children }) {
  return (
    <div className="flex items-center gap-2 font-mono text-[9px] tracking-[0.28em] mb-3" style={{ color: '#B0793A' }}>
      <span className="w-2.5 h-px shrink-0" style={{ background: '#B0793A' }} />
      {children}
      <span className="flex-1 h-px" style={{ background: GRID }} />
    </div>
  );
}

function KpiCard({ label, value, sub, accent = AMBER, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 280, damping: 24 }}
      whileHover={{ y: -2, borderColor: BDR_HI, boxShadow: '0 0 14px rgba(212,146,11,0.09)' }}
      className="border p-3 flex flex-col gap-0.5"
      style={{
        background: PANEL, borderColor: BDR,
        clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
      }}
    >
      <span className="font-mono text-[8px] tracking-[0.22em] uppercase" style={{ color: DIM }}>{label}</span>
      <span className="font-mono text-xl font-bold leading-none" style={{ color: accent, textShadow: `0 0 18px ${accent}33` }}>{value}</span>
      {sub && <span className="font-mono text-[9px]" style={{ color: DIMMER }}>{sub}</span>}
    </motion.div>
  );
}

function MonoTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="font-mono text-[10px] px-3 py-2 border"
      style={{ background: '#0C0A07', borderColor: BDR_HI, color: BONE,
        clipPath: 'polygon(5px 0,100% 0,100% calc(100% - 5px),calc(100% - 5px) 100%,0 100%,0 5px)' }}>
      <div style={{ color: AMBER, marginBottom: 3 }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey}>
          {String(p.name || p.dataKey).toUpperCase()}:{' '}
          <span style={{ color: p.color || AMBER }}>
            {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── main ─────────────────────────────────────────────── */
export default function StoreDashboard() {
  /* data */
  const { data: products = [], isLoading: prodLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.product.filter({ available: true }, 'sort_order'),
  });

  const { data: ledger = [], isLoading: ledgerLoading } = useQuery({
    queryKey: ['ledger_dashboard'],
    queryFn: () => base44.entities.ledger_entry.list('-entry_date', 300),
    retry: 2,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['orders_dashboard'],
    queryFn: () => base44.entities.order.list('-created_date', 300),
    retry: 2,
  });

  /* ── derived: revenue by day (last 30 days) */
  const revenueData = useMemo(() => {
    const map = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map[key] = { date: key.slice(5), income: 0, expense: 0 };
    }
    ledger.forEach((e) => {
      const key = (e.entry_date || '').slice(0, 10);
      if (!map[key]) return;
      if (e.entry_type === 'income')  map[key].income  += e.amount_auec || 0;
      if (e.entry_type === 'expense') map[key].expense += e.amount_auec || 0;
    });
    return Object.values(map);
  }, [ledger]);

  /* ── derived: salvage inventory */
  const stockData = useMemo(() =>
    products
      .filter((p) => p.category !== 'service')
      .sort((a, b) => (b.stock || 0) - (a.stock || 0))
      .map((p) => ({ name: p.code || p.product_name.slice(0, 7), stock: p.stock || 0, low: (p.stock || 0) < 50 })),
  [products]);

  /* ── derived: KPIs */
  const totalIncome   = ledger.filter((e) => e.entry_type === 'income').reduce((s, e) => s + (e.amount_auec || 0), 0);
  const totalExpense  = ledger.filter((e) => e.entry_type === 'expense').reduce((s, e) => s + (e.amount_auec || 0), 0);
  const netProfit     = totalIncome - totalExpense;
  const totalStock    = stockData.reduce((s, p) => s + p.stock, 0);
  const deliveredCnt  = orders.filter((o) => o.status === 'delivered').length;
  const openCnt       = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length;

  /* ── derived: order volume by day (last 14 days) */
  const orderVolData = useMemo(() => {
    const map = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map[key] = { date: key.slice(5), orders: 0 };
    }
    orders.forEach((o) => {
      const key = (o.created_date || '').slice(0, 10);
      if (map[key]) map[key].orders += 1;
    });
    return Object.values(map);
  }, [orders]);

  const isLoading = prodLoading || ledgerLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: BDR_HI, borderTopColor: AMBER }} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl pb-6">

      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[9px] tracking-[0.3em]" style={{ color: TEAL }}>// FSIS — OPERATIONS INTELLIGENCE</p>
          <h2 className="font-mono text-sm font-bold tracking-[0.18em]" style={{ color: BONE }}>INVENTORY & REVENUE DASHBOARD</h2>
        </div>
        <span className="font-mono text-[9px] px-2.5 py-1 border" style={{ borderColor: BDR_HI, color: DIM, background: PANEL }}>
          LIVE DATA
        </span>
      </div>

      {/* ── KPI row ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <KpiCard label="Total Revenue"  value={fmtAuec(totalIncome)}  sub="aUEC all time"       accent={AMBER}   delay={0.00} />
        <KpiCard label="Total Expenses" value={fmtAuec(totalExpense)} sub="aUEC all time"       accent="#C8893B" delay={0.05} />
        <KpiCard label="Net Profit"     value={fmtAuec(netProfit)}    sub="revenue − expenses"  accent={netProfit >= 0 ? '#7BA05B' : '#C05050'} delay={0.10} />
        <KpiCard label="Stock on Hand"  value={`${totalStock.toLocaleString()} SCU`} sub="salvage inventory" accent={TEAL} delay={0.15} />
        <KpiCard label="Open Orders"    value={openCnt}               sub="awaiting fulfillment" accent={BONE}   delay={0.20} />
        <KpiCard label="Delivered"      value={deliveredCnt}          sub="all time"            accent="#7BA05B" delay={0.25} />
      </div>

      {/* ── revenue area chart ───────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
        className="border p-4" style={{ background: PANEL, borderColor: BDR }}
      >
        <SectionHead>aUEC REVENUE vs EXPENSES — LAST 30 DAYS</SectionHead>
        {revenueData.every((d) => d.income === 0 && d.expense === 0) ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <IdleProcessor width={140} />
            <p className="font-mono text-[10px]" style={{ color: DIM }}>No ledger entries found — log income and expenses in the Ops terminal.</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={revenueData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={AMBER} stopOpacity={0.28} />
                  <stop offset="95%" stopColor={AMBER} stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#C8893B" stopOpacity={0.18} />
                  <stop offset="95%" stopColor="#C8893B" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={GRID} strokeDasharray="3 5" vertical={false} />
              <XAxis dataKey="date" tick={MONO} tickLine={false} axisLine={{ stroke: BDR }} interval={4} />
              <YAxis tick={MONO} tickLine={false} axisLine={false} width={48} tickFormatter={fmtAuec} />
              <Tooltip content={<MonoTip />} />
              <Area type="monotone" dataKey="income"  name="Income"  stroke={AMBER}    strokeWidth={1.5} fill="url(#incGrad)" dot={false} activeDot={{ r: 3, fill: AMBER }} />
              <Area type="monotone" dataKey="expense" name="Expense" stroke="#C8893B" strokeWidth={1.2} fill="url(#expGrad)" dot={false} activeDot={{ r: 3, fill: '#C8893B' }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      {/* ── inventory bar chart ──────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}
        className="border p-4" style={{ background: PANEL, borderColor: BDR }}
      >
        <div className="flex items-center justify-between mb-0">
          <SectionHead>SALVAGE INVENTORY — CURRENT STOCK (SCU)</SectionHead>
          <span className="font-mono text-[10px] mb-3" style={{ color: TEAL }}>{totalStock.toLocaleString()} SCU TOTAL</span>
        </div>
        {stockData.length === 0 ? (
          <p className="font-mono text-[10px] py-6 text-center" style={{ color: DIM }}>No salvage products listed.</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={Math.max(90, stockData.length * 30)}>
              <BarChart data={stockData} layout="vertical" margin={{ top: 0, right: 48, left: 0, bottom: 0 }} barSize={12}>
                <CartesianGrid stroke={GRID} strokeDasharray="3 5" horizontal={false} />
                <XAxis type="number" tick={MONO} tickLine={false} axisLine={{ stroke: BDR }} tickFormatter={(v) => `${v}`} />
                <YAxis type="category" dataKey="name" tick={{ ...MONO, fill: BONE, fontSize: 10 }} tickLine={false} axisLine={false} width={44} />
                <Tooltip content={<MonoTip />} />
                <Bar dataKey="stock" name="Stock" radius={[0, 2, 2, 0]}
                  label={{ position: 'right', style: { ...MONO, fill: DIM }, formatter: (v) => v > 0 ? `${v}` : 'OUT' }}
                >
                  {stockData.map((d, i) => (
                    <Cell key={i} fill={d.stock === 0 ? '#5A3030' : d.low ? '#C8893B' : TEAL} opacity={0.9} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <p className="font-mono text-[9px] mt-2" style={{ color: DIMMER }}>
              Amber = low stock (&lt; 50 SCU) · Red = out of stock
            </p>
          </>
        )}
      </motion.div>

      {/* ── order volume chart ───────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.44 }}
        className="border p-4" style={{ background: PANEL, borderColor: BDR }}
      >
        <SectionHead>ORDER VOLUME — LAST 14 DAYS</SectionHead>
        <ResponsiveContainer width="100%" height={100}>
          <BarChart data={orderVolData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }} barSize={14}>
            <CartesianGrid stroke={GRID} strokeDasharray="3 5" vertical={false} />
            <XAxis dataKey="date" tick={MONO} tickLine={false} axisLine={{ stroke: BDR }} />
            <YAxis tick={MONO} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip content={<MonoTip />} />
            <Bar dataKey="orders" name="Orders" radius={[2, 2, 0, 0]}>
              {orderVolData.map((d, i) => (
                <Cell key={i} fill={d.orders > 0 ? AMBER : DIMMER} opacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

    </div>
  );
}