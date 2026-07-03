import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Loader2 } from 'lucide-react';

const AMBER = '#E0A22E';
const TEAL = '#6FA08F';
const DIM = '#7A6E60';
const DIMMER = '#3A3028';
const PANEL = { background: '#111009', borderColor: '#2A2118' };

function fmt(n) {
  if (!n && n !== 0) return '—';
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return Number(n).toLocaleString();
}

function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-2 text-[9px] tracking-[0.22em] font-mono mb-2" style={{ color: '#B0793A' }}>
      <span className="w-3 h-px" style={{ background: '#B0793A' }} />
      {children}
      <span className="flex-1 h-px" style={{ background: 'rgba(90,62,28,0.25)' }} />
    </div>
  );
}

function ChartTip({ active, payload, label, suffix }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="border px-2 py-1.5 font-mono text-[10px]" style={{ background: '#0C0A07', borderColor: '#5C4424', color: '#D8CFC0' }}>
      <div style={{ color: AMBER }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ color: p.fill || p.color }}>{p.name}: {fmt(p.value)}{suffix}</div>
      ))}
    </div>
  );
}

export default function LootSummaryDashboard({ lootItems = [] }) {
  const { data: crates = [], isLoading: loadingCrates } = useQuery({
    queryKey: ['loot_dash_crates'],
    queryFn: () => base44.entities.cargo_crate.list('-updated_date', 500),
  });
  const { data: locations = [], isLoading: loadingLocs } = useQuery({
    queryKey: ['loot_dash_locations'],
    queryFn: () => base44.entities.warehouse_location.list('-updated_date', 200),
  });
  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['loot_dash_orders'],
    queryFn: () => base44.entities.order.list('-created_date', 500),
  });

  const loading = loadingCrates || loadingLocs || loadingOrders;

  const summary = useMemo(() => {
    const crateValue = crates.reduce((s, c) => s + (c.cargo_value_auec || 0), 0);
    const lootValue = lootItems
      .filter((i) => !['sold', 'scrapped'].includes(i.status || 'raw'))
      .reduce((s, i) => s + (i.est_sell_auec || 0), 0);

    // Top-selling: aggregate delivered/fulfillment order line items
    const sold = {};
    orders
      .filter((o) => ['delivered', 'in_fulfillment', 'confirmed'].includes(o.status))
      .forEach((o) => (o.items || []).forEach((li) => {
        const key = li.code || li.product_name || 'UNKNOWN';
        if (!sold[key]) sold[key] = { name: key, qty: 0, revenue: 0 };
        sold[key].qty += li.quantity || 0;
        sold[key].revenue += (li.unit_price || 0) * (li.quantity || 0);
      }));
    const topSellers = Object.values(sold).sort((a, b) => b.revenue - a.revenue).slice(0, 6);

    // Space utilization per active warehouse location
    const util = locations
      .filter((l) => l.status !== 'offline' && (l.capacity_scu || 0) > 0)
      .map((l) => ({
        name: l.code || l.name,
        used: l.current_scu || 0,
        free: Math.max(0, (l.capacity_scu || 0) - (l.current_scu || 0)),
        pct: Math.min(100, Math.round(((l.current_scu || 0) / (l.capacity_scu || 1)) * 100)),
      }))
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 8);
    const totalCap = locations.reduce((s, l) => s + (l.capacity_scu || 0), 0);
    const totalUsed = locations.reduce((s, l) => s + (l.current_scu || 0), 0);

    return { crateValue, lootValue, topSellers, util, totalCap, totalUsed };
  }, [crates, locations, orders, lootItems]);

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin" style={{ color: AMBER }} /></div>;
  }

  const totalValue = summary.crateValue + summary.lootValue;
  const overallPct = summary.totalCap > 0 ? Math.round((summary.totalUsed / summary.totalCap) * 100) : 0;
  const utilColor = overallPct >= 90 ? '#C05050' : overallPct >= 70 ? '#C8893B' : TEAL;

  return (
    <div className="space-y-4 mt-3 font-mono">
      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {[
          { label: 'TOTAL WAREHOUSE VALUE', value: `${fmt(totalValue)} ¤`, color: AMBER, sub: 'crates + active loot' },
          { label: 'CRATED CARGO VALUE', value: `${fmt(summary.crateValue)} ¤`, color: TEAL, sub: `${crates.length} crates` },
          { label: 'LOOT PIPELINE VALUE', value: `${fmt(summary.lootValue)} ¤`, color: '#B0793A', sub: 'unsold items' },
          { label: 'SPACE UTILIZATION', value: `${overallPct}%`, color: utilColor, sub: `${fmt(summary.totalUsed)} / ${fmt(summary.totalCap)} SCU` },
        ].map((t) => (
          <div key={t.label} className="border p-3 text-center" style={PANEL}>
            <div className="text-xl font-bold" style={{ color: t.color }}>{t.value}</div>
            <div className="text-[9px]" style={{ color: TEAL }}>{t.sub}</div>
            <div className="text-[8px] tracking-[0.16em] mt-0.5" style={{ color: DIMMER }}>{t.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Top-selling commodities */}
        <div className="border p-4" style={PANEL}>
          <SectionLabel>TOP-SELLING COMMODITIES</SectionLabel>
          {summary.topSellers.length === 0 ? (
            <div className="text-[10px] py-10 text-center" style={{ color: DIMMER }}>NO SALES RECORDED YET</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={summary.topSellers} layout="vertical" margin={{ left: 8, right: 56 }}>
                <XAxis type="number" tick={{ fill: DIM, fontSize: 9, fontFamily: 'JetBrains Mono' }} tickFormatter={fmt} axisLine={{ stroke: DIMMER }} tickLine={false} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fill: '#D8CFC0', fontSize: 9, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: DIMMER }} tickLine={false} />
                <Tooltip content={<ChartTip suffix=" ¤" />} cursor={{ fill: 'rgba(224,162,46,0.06)' }} />
                <Bar dataKey="revenue" name="Revenue" radius={[0, 2, 2, 0]} barSize={14}>
                  {summary.topSellers.map((_, i) => (
                    <Cell key={i} fill={i === 0 ? AMBER : i === 1 ? '#C8893B' : '#8A6430'} />
                  ))}
                  <LabelList dataKey="revenue" position="right" formatter={(v) => `${Number(v).toLocaleString()} ¤`} style={{ fill: '#D8CFC0', fontSize: 9, fontFamily: 'JetBrains Mono' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
          <p className="text-[8px] mt-1" style={{ color: DIMMER }}>Revenue from confirmed, in-fulfillment & delivered orders</p>
        </div>

        {/* Space utilization by location */}
        <div className="border p-4" style={PANEL}>
          <SectionLabel>SPACE UTILIZATION BY LOCATION</SectionLabel>
          {summary.util.length === 0 ? (
            <div className="text-[10px] py-10 text-center" style={{ color: DIMMER }}>NO WAREHOUSE LOCATIONS WITH CAPACITY</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={summary.util} margin={{ right: 8 }}>
                <XAxis dataKey="name" tick={{ fill: '#D8CFC0', fontSize: 8, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: DIMMER }} tickLine={false} interval={0} angle={-25} textAnchor="end" height={44} />
                <YAxis tick={{ fill: DIM, fontSize: 9, fontFamily: 'JetBrains Mono' }} tickFormatter={fmt} axisLine={{ stroke: DIMMER }} tickLine={false} width={40} />
                <Tooltip content={<ChartTip suffix=" SCU" />} cursor={{ fill: 'rgba(224,162,46,0.06)' }} />
                <Bar dataKey="used" name="Used" stackId="scu" barSize={20}>
                  {summary.util.map((u, i) => (
                    <Cell key={i} fill={u.pct >= 90 ? '#C05050' : u.pct >= 70 ? '#C8893B' : TEAL} />
                  ))}
                </Bar>
                <Bar dataKey="free" name="Free" stackId="scu" fill="#2A2118" radius={[2, 2, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}
          <p className="text-[8px] mt-1" style={{ color: DIMMER }}>Amber ≥70% · Red ≥90% capacity</p>
        </div>
      </div>
    </div>
  );
}