import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { IdleProcessor } from '@/components/brand/glyphs/EmptyStates';

const BRONZE   = '#E0A22E';
const TEAL     = '#6FA08F';
const DIM      = '#6B6155';
const SURFACE  = '#14110D';
const BORDER   = '#2A2118';
const BORDER_B = '#5C4424';

/** Skewed KPI tile */
function KpiTile({ label, value, sub, accent = BRONZE, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 280, damping: 24 }}
      whileHover={{ y: -2, boxShadow: `0 0 18px rgba(212,146,11,0.1)`, borderColor: BORDER_B }}
      className="border p-4 flex flex-col gap-1"
      style={{ background: SURFACE, borderColor: BORDER, clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
    >
      <span className="font-mono text-[9px] tracking-[0.22em]" style={{ color: DIM }}>{label}</span>
      <span className="font-mono text-2xl font-bold leading-none" style={{ color: accent, textShadow: `0 0 14px ${accent}44` }}>{value}</span>
      {sub && <span className="font-mono text-[10px]" style={{ color: TEAL }}>{sub}</span>}
    </motion.div>
  );
}

/** Custom recharts tooltip */
function BronzeTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="font-mono text-[10px] px-3 py-2 border" style={{ background: '#0E0B08', borderColor: BORDER_B, color: '#D8CFC0', clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}>
      <div style={{ color: BRONZE }} className="font-bold mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey}>{p.name}: <span style={{ color: p.color }}>{typeof p.value === 'number' && p.value > 999 ? p.value.toLocaleString() : p.value}</span></div>
      ))}
    </div>
  );
}

/** Horizontal bar gauge for commodity rankings */
function CommodityBar({ name, code, revenue, units, maxRevenue, rank, delay }) {
  const pct = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="space-y-1"
    >
      <div className="flex justify-between items-center font-mono text-[10px]">
        <span className="flex items-center gap-2">
          <span className="text-[9px] w-4 text-right" style={{ color: DIM }}>#{rank}</span>
          <span style={{ color: '#D8CFC0' }}>{name}</span>
          {code && <span style={{ color: TEAL }}>[{code}]</span>}
        </span>
        <span className="flex gap-4">
          <span style={{ color: DIM }}>{units.toLocaleString()} SCU</span>
          <span className="font-bold" style={{ color: BRONZE }}>{revenue.toLocaleString()} aUEC</span>
        </span>
      </div>
      <div className="h-1.5 w-full" style={{ background: '#1A1510', transform: 'skewX(-12deg)' }}>
        <motion.div
          className="h-full"
          style={{ background: `linear-gradient(90deg, ${BRONZE}, #B0793A)`, transformOrigin: 'left' }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: pct / 100 }}
          transition={{ delay: delay + 0.1, duration: 0.6, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}

function fmt(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toLocaleString();
}

export default function WeeklyReport() {
  // Fetch all delivered/confirmed orders from last 7 days
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['report_orders'],
    queryFn: () => base44.entities.order.filter({}, '-created_date', 200),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products_report'],
    queryFn: () => base44.entities.product.filter({ available: true }, 'sort_order'),
  });

  const now = Date.now();
  const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

  const { weekOrders, dailyRevenue, commodityMap, totalRevenue, totalUnits, completedCount, avgOrder } = useMemo(() => {
    const weekOrders = orders.filter((o) => {
      const age = now - new Date(o.created_date).getTime();
      return age <= WEEK_MS && o.status !== 'cancelled';
    });

    // Revenue by day (last 7 days, Sun–Sat labels)
    const dayMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now - i * 24 * 60 * 60 * 1000);
      const key = d.toLocaleDateString('en-US', { weekday: 'short' });
      dayMap[key] = { day: key, revenue: 0, orders: 0 };
    }
    weekOrders.forEach((o) => {
      const key = new Date(o.created_date).toLocaleDateString('en-US', { weekday: 'short' });
      if (dayMap[key]) {
        dayMap[key].revenue += o.total_auec || 0;
        dayMap[key].orders += 1;
      }
    });
    const dailyRevenue = Object.values(dayMap);

    // Commodity breakdown from line items
    const commodityMap = {};
    weekOrders.forEach((o) => {
      (o.items || []).forEach((item) => {
        const key = item.code || item.product_name;
        if (!commodityMap[key]) commodityMap[key] = { name: item.product_name, code: item.code, revenue: 0, units: 0 };
        commodityMap[key].revenue += (item.unit_price || 0) * (item.quantity || 0);
        commodityMap[key].units += item.quantity || 0;
      });
    });

    const totalRevenue = weekOrders.reduce((s, o) => s + (o.total_auec || 0), 0);
    const totalUnits = weekOrders.reduce((s, o) => s + (o.items || []).reduce((ss, i) => ss + (i.quantity || 0), 0), 0);
    const completedCount = weekOrders.filter((o) => o.status === 'delivered').length;
    const avgOrder = weekOrders.length > 0 ? Math.round(totalRevenue / weekOrders.length) : 0;

    return { weekOrders, dailyRevenue, commodityMap, totalRevenue, totalUnits, completedCount, avgOrder };
  }, [orders]);

  const topCommodities = Object.values(commodityMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const maxRevenue = topCommodities[0]?.revenue || 1;

  // Inventory snapshot from products
  const salvageProducts = products.filter((p) => p.category === 'salvage_commodity');
  const totalStock = salvageProducts.reduce((s, p) => s + (p.stock || 0), 0);
  const stockData = salvageProducts.map((p) => ({ name: p.code || p.product_name.slice(0, 6), stock: p.stock || 0 }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: BORDER_B, borderTopColor: BRONZE }} />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[9px] tracking-[0.3em]" style={{ color: TEAL }}>// FSIS OPERATIONS</p>
          <h2 className="font-mono text-sm font-bold tracking-[0.18em]" style={{ color: '#EDE5D6' }}>WEEKLY REPORT — LAST 7 DAYS</h2>
        </div>
        <div className="font-mono text-[9px] px-3 py-1 border" style={{ borderColor: BORDER_B, color: DIM, background: SURFACE }}>
          {new Date(now - WEEK_MS).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(now).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiTile label="TOTAL REVENUE" value={fmt(totalRevenue)} sub="aUEC gross" accent={BRONZE} delay={0} />
        <KpiTile label="ORDERS PLACED" value={weekOrders.length} sub={`${completedCount} delivered`} accent={TEAL} delay={0.06} />
        <KpiTile label="AVG ORDER VALUE" value={fmt(avgOrder)} sub="aUEC / order" accent={BRONZE} delay={0.12} />
        <KpiTile label="CARGO MOVED" value={`${totalUnits.toLocaleString()}`} sub="SCU this week" accent={TEAL} delay={0.18} />
      </div>

      {weekOrders.length === 0 ? (
        <div className="border p-10 flex flex-col items-center gap-4" style={{ borderColor: BORDER, background: SURFACE }}>
          <IdleProcessor width={160} />
          <p className="font-mono text-xs" style={{ color: DIM }}>No orders recorded in the last 7 days.</p>
        </div>
      ) : (
        <>
          {/* Revenue chart */}
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="border p-4" style={{ borderColor: BORDER, background: SURFACE }}
          >
            <p className="font-mono text-[9px] tracking-[0.2em] mb-3" style={{ color: DIM }}>// DAILY REVENUE — aUEC</p>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={dailyRevenue} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="bronzeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={BRONZE} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={BRONZE} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fill: DIM, fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: DIM, fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} tickFormatter={fmt} />
                <Tooltip content={<BronzeTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke={BRONZE} strokeWidth={1.5} fill="url(#bronzeGrad)" dot={{ fill: BRONZE, r: 2, strokeWidth: 0 }} activeDot={{ r: 4, fill: BRONZE }} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Top commodities */}
          {topCommodities.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
              className="border p-4 space-y-3" style={{ borderColor: BORDER, background: SURFACE }}
            >
              <p className="font-mono text-[9px] tracking-[0.2em]" style={{ color: DIM }}>// TOP COMMODITIES BY REVENUE</p>
              {topCommodities.map((c, i) => (
                <CommodityBar key={c.code || c.name} name={c.name} code={c.code} revenue={c.revenue} units={c.units} maxRevenue={maxRevenue} rank={i + 1} delay={0.3 + i * 0.06} />
              ))}
            </motion.div>
          )}
        </>
      )}

      {/* Inventory snapshot */}
      {salvageProducts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }}
          className="border p-4" style={{ borderColor: BORDER, background: SURFACE }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="font-mono text-[9px] tracking-[0.2em]" style={{ color: DIM }}>// SALVAGE INVENTORY — CURRENT STOCK</p>
            <span className="font-mono text-[10px]" style={{ color: TEAL }}>{totalStock.toLocaleString()} SCU TOTAL</span>
          </div>
          <ResponsiveContainer width="100%" height={90}>
            <BarChart data={stockData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={18}>
              <XAxis dataKey="name" tick={{ fill: DIM, fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: DIM, fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }} axisLine={false} tickLine={false} />
              <Tooltip content={<BronzeTooltip />} />
              <Bar dataKey="stock" name="Stock (SCU)" radius={[2, 2, 0, 0]}>
                {stockData.map((entry, i) => (
                  <Cell key={i} fill={entry.stock < 50 ? '#C8893B' : TEAL} opacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="font-mono text-[9px] mt-2" style={{ color: DIM }}>Amber bars indicate low stock (&lt; 50 SCU).</p>
        </motion.div>
      )}

      {/* Order status breakdown */}
      {weekOrders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
          className="border p-4" style={{ borderColor: BORDER, background: SURFACE }}
        >
          <p className="font-mono text-[9px] tracking-[0.2em] mb-3" style={{ color: DIM }}>// ORDER STATUS BREAKDOWN</p>
          <div className="flex flex-wrap gap-3">
            {['new', 'confirmed', 'in_fulfillment', 'delivered', 'cancelled'].map((status) => {
              const count = weekOrders.filter((o) => o.status === status).length;
              if (count === 0) return null;
              const colors = { new: '#8A7E6C', confirmed: TEAL, in_fulfillment: BRONZE, delivered: '#7BA05B', cancelled: '#C05050' };
              return (
                <div key={status} className="flex items-center gap-2 font-mono text-[10px]">
                  <span className="w-2 h-2 rounded-full" style={{ background: colors[status] }} />
                  <span style={{ color: DIM }}>{status.replace('_', ' ').toUpperCase()}</span>
                  <span className="font-bold" style={{ color: colors[status] }}>{count}</span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}