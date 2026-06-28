import React, { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const labels = {
  salvage_commodity: 'Salvage',
  fps_gear: 'FPS Gear',
  weapon: 'Weapons',
  ship_component: 'Ship Parts',
  vehicle_component: 'Vehicle Parts',
  service: 'Services',
  other: 'Other',
};

const fmt = (n) => `${Math.round(Number(n || 0)).toLocaleString()} aUEC`;
const short = (n) => Number(n || 0) >= 1000000 ? `${(Number(n) / 1000000).toFixed(1)}M` : Number(n || 0) >= 1000 ? `${Math.round(Number(n) / 1000)}K` : `${Math.round(Number(n || 0))}`;
const dayKey = (d) => d.toISOString().slice(5, 10);

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload || {};
  return <div className="border p-2 text-[10px] font-mono" style={{ borderColor: '#5C4424', background: '#0A0806', color: '#D8CFC0' }}><b style={{ color: '#E0A22E' }}>{label}</b><div>Revenue: {fmt(row.revenue)}</div><div>Profit: {fmt(row.profit)}</div><div>Margin: {row.margin.toFixed(1)}%</div></div>;
}

export default function SoloRevenueAnalyticsChart({ orders = [], products = [] }) {
  const [filter, setFilter] = useState('all');
  const analytics = useMemo(() => {
    const productById = Object.fromEntries(products.map((p) => [p.id, p]));
    const start = new Date();
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
    const buckets = Array.from({ length: 30 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return { day: dayKey(d), revenue: 0, cost: 0, profit: 0, margin: 0 };
    });
    const bucketByDay = Object.fromEntries(buckets.map((b) => [b.day, b]));
    const typeSet = new Set();

    orders.filter((o) => o.status !== 'cancelled').forEach((order) => {
      const d = new Date(order.created_date || order.updated_date || Date.now());
      if (d < start) return;
      const bucket = bucketByDay[dayKey(d)];
      if (!bucket) return;
      (order.items || []).forEach((item) => {
        const product = productById[item.product_id] || products.find((p) => p.product_name === item.product_name || p.code === item.code) || {};
        const type = product.category || (item.code ? 'salvage_commodity' : 'other');
        typeSet.add(type);
        if (filter !== 'all' && type !== filter) return;
        const qty = Number(item.quantity || 0);
        const revenue = Number(item.unit_price || product.price_auec || 0) * qty;
        const marginRate = Number(product.margin_percent || 0) / 100;
        const inferredCost = marginRate > 0 ? Number(item.unit_price || product.price_auec || 0) / (1 + marginRate) : 0;
        const cost = Number(product.market_ref_auec || inferredCost || 0) * qty;
        bucket.revenue += revenue;
        bucket.cost += cost;
      });
    });

    buckets.forEach((b) => {
      b.profit = b.revenue - b.cost;
      b.margin = b.revenue > 0 ? (b.profit / b.revenue) * 100 : 0;
    });
    const totals = buckets.reduce((a, b) => ({ revenue: a.revenue + b.revenue, profit: a.profit + b.profit, cost: a.cost + b.cost }), { revenue: 0, profit: 0, cost: 0 });
    totals.margin = totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0;
    return { buckets, totals, types: Array.from(typeSet).sort() };
  }, [orders, products, filter]);

  return <section className="border p-4 font-mono space-y-4" style={{ borderColor: '#5C4424', background: 'linear-gradient(180deg,#14100B,#0B0906)' }}><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] tracking-[0.2em]" style={{ color: '#8A8F45' }}>30-DAY REVENUE + MARGIN ANALYTICS</p><p className="text-[9px] mt-1" style={{ color: '#8A7E6C' }}>Filtered by commodity type from completed and active buyer orders.</p></div><div className="flex flex-wrap gap-1">{['all', ...analytics.types].map((t) => <button key={t} onClick={() => setFilter(t)} className="border px-2 py-1 text-[8px] tracking-[0.12em]" style={{ borderColor: filter === t ? '#E0A22E' : '#3A2F20', color: filter === t ? '#E0A22E' : '#8A7E6C', background: filter === t ? '#171006' : '#080604' }}>{t === 'all' ? 'ALL' : (labels[t] || t).toUpperCase()}</button>)}</div></div><div className="grid md:grid-cols-3 gap-2 text-[10px]"><div className="border p-2" style={{ borderColor:'#3A2F20' }}><span style={{ color:'#8A7E6C' }}>Revenue</span><b className="block text-lg" style={{ color:'#E0A22E' }}>{fmt(analytics.totals.revenue)}</b></div><div className="border p-2" style={{ borderColor:'#3A2F20' }}><span style={{ color:'#8A7E6C' }}>Profit</span><b className="block text-lg" style={{ color: analytics.totals.profit >= 0 ? '#8A8F45' : '#C05050' }}>{fmt(analytics.totals.profit)}</b></div><div className="border p-2" style={{ borderColor:'#3A2F20' }}><span style={{ color:'#8A7E6C' }}>Margin</span><b className="block text-lg" style={{ color:'#C8893B' }}>{analytics.totals.margin.toFixed(1)}%</b></div></div><div className="grid xl:grid-cols-[1.4fr_0.8fr] gap-4"><div className="h-56"><ResponsiveContainer width="100%" height="100%"><LineChart data={analytics.buckets}><CartesianGrid stroke="#2A2118" strokeDasharray="3 3" /><XAxis dataKey="day" stroke="#8A7E6C" tick={{ fontSize: 9 }} /><YAxis stroke="#8A7E6C" tick={{ fontSize: 9 }} tickFormatter={short} /><Tooltip content={<CustomTooltip />} /><Line type="monotone" dataKey="revenue" stroke="#E0A22E" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="profit" stroke="#8A8F45" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div><div className="h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={analytics.buckets}><CartesianGrid stroke="#2A2118" strokeDasharray="3 3" /><XAxis dataKey="day" stroke="#8A7E6C" tick={{ fontSize: 9 }} /><YAxis stroke="#8A7E6C" tick={{ fontSize: 9 }} tickFormatter={(v) => `${v}%`} /><Tooltip content={<CustomTooltip />} /><Bar dataKey="margin" fill="#C8893B" /></BarChart></ResponsiveContainer></div></div></section>;
}