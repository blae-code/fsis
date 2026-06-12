import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Cell } from 'recharts';
import { TrendingUp, Package, Coins, Scale } from 'lucide-react';

const COMMODITY_NAMES = { RMC: 'Recycled Material Composite', CMR: 'Construction Mat. (Reclaimed)', CMS: 'Construction Mat. (Salvaged)' };
const BAR_COLORS = ['hsl(42, 85%, 60%)', 'hsl(20, 60%, 50%)', 'hsl(210, 45%, 55%)'];

const tooltipStyle = {
  background: 'hsl(30, 10%, 7%)',
  border: '1px solid hsl(33, 18%, 18%)',
  borderRadius: 4,
  fontSize: 10,
  fontFamily: 'JetBrains Mono, monospace',
};

const fmtK = (v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v);
const monthKey = (d) => {
  const date = new Date(d);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};
const monthLabel = (key) => new Date(`${key}-15`).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

function KpiCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="rounded border p-3 flex-1 min-w-[140px]" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 8%)' }}>
      <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground tracking-[0.15em] mb-1.5">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <div className="text-lg font-bold" style={{ color: color || 'hsl(42, 85%, 60%)' }}>{value}</div>
      {sub && <div className="text-[9px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

/** Management profit dashboard — salvage volume + revenue over time, commodity profit ranking */
export default function ProfitDashboard({ bestPrices }) {
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['salvage_sessions_profit'],
    queryFn: () => base44.entities.salvage_session.list('created_date', 200),
  });
  const { data: ledger = [], isLoading: ledgerLoading } = useQuery({
    queryKey: ['ledger_entries_profit'],
    queryFn: () => base44.entities.ledger_entry.list('-entry_date', 500),
  });

  if (sessionsLoading || ledgerLoading) {
    return <div className="text-center py-12 text-xs font-mono text-muted-foreground">Loading profit data…</div>;
  }

  // ---- KPIs ----
  const totalScu = sessions.reduce((s, x) => s + (x.rmc_scu || 0) + (x.cmr_scu || 0) + (x.cms_scu || 0), 0);
  const totalIncome = ledger.filter((e) => e.entry_type === 'income').reduce((s, e) => s + (e.amount_auec || 0), 0);
  const totalExpense = ledger.filter((e) => e.entry_type === 'expense').reduce((s, e) => s + (e.amount_auec || 0), 0);
  const net = totalIncome - totalExpense;

  // ---- Monthly series: revenue (ledger income) + salvage volume (sessions) ----
  const months = {};
  ledger.forEach((e) => {
    const key = monthKey(e.entry_date || e.created_date);
    if (!months[key]) months[key] = { revenue: 0, expense: 0, scu: 0 };
    if (e.entry_type === 'income') months[key].revenue += e.amount_auec || 0;
    else months[key].expense += e.amount_auec || 0;
  });
  sessions.forEach((s) => {
    const key = monthKey(s.created_date);
    if (!months[key]) months[key] = { revenue: 0, expense: 0, scu: 0 };
    months[key].scu += (s.rmc_scu || 0) + (s.cmr_scu || 0) + (s.cms_scu || 0);
  });
  const timeline = Object.keys(months).sort().map((key) => ({
    month: monthLabel(key),
    revenue: Math.round(months[key].revenue),
    net: Math.round(months[key].revenue - months[key].expense),
    scu: Math.round(months[key].scu),
  }));

  // ---- Profit by commodity: volume × current best sell ----
  const totals = { RMC: 0, CMR: 0, CMS: 0 };
  sessions.forEach((s) => {
    totals.RMC += s.rmc_scu || 0;
    totals.CMR += s.cmr_scu || 0;
    totals.CMS += s.cms_scu || 0;
  });
  const commodityData = Object.entries(totals)
    .map(([code, scu]) => ({
      code,
      scu: Math.round(scu),
      value: Math.round(scu * 100 * (bestPrices?.[code]?.price_sell || 0)),
    }))
    .sort((a, b) => b.value - a.value);
  const topCommodity = commodityData[0];

  if (sessions.length === 0 && ledger.length === 0) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
        <p className="text-xs font-mono text-muted-foreground">No sessions or ledger entries yet — profit telemetry will appear here.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 font-mono">
      {/* KPI row */}
      <div className="flex flex-wrap gap-3">
        <KpiCard icon={Package} label="TOTAL SALVAGE VOLUME" value={`${totalScu.toLocaleString()} SCU`} sub={`${sessions.length} sessions logged`} />
        <KpiCard icon={Coins} label="TOTAL REVENUE" value={`${fmtK(totalIncome)} aUEC`} sub={`${ledger.filter((e) => e.entry_type === 'income').length} income entries`} />
        <KpiCard icon={Scale} label="NET PROFIT" value={`${fmtK(net)} aUEC`} sub={`${fmtK(totalExpense)} expenses`} color={net >= 0 ? 'hsl(95, 35%, 55%)' : 'hsl(0, 60%, 55%)'} />
        <KpiCard icon={TrendingUp} label="TOP EARNER" value={topCommodity?.value > 0 ? topCommodity.code : '—'} sub={topCommodity?.value > 0 ? `${fmtK(topCommodity.value)} aUEC processed` : 'no price data'} />
      </div>

      {/* Revenue + volume over time */}
      <div className="rounded border p-3" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 8%)' }}>
        <div className="text-[9px] text-muted-foreground tracking-[0.2em] mb-3">REVENUE & SALVAGE VOLUME OVER TIME</div>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={timeline} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid stroke="hsl(33, 18%, 18%)" strokeDasharray="3 3" opacity={0.4} />
            <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'hsl(35, 12%, 52%)', fontFamily: 'monospace' }} stroke="hsl(33, 18%, 18%)" />
            <YAxis yAxisId="auec" tick={{ fontSize: 9, fill: 'hsl(35, 12%, 52%)', fontFamily: 'monospace' }} stroke="hsl(33, 18%, 18%)" tickFormatter={fmtK} />
            <YAxis yAxisId="scu" orientation="right" tick={{ fontSize: 9, fill: 'hsl(210, 45%, 55%)', fontFamily: 'monospace' }} stroke="hsl(33, 18%, 18%)" />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: 'hsl(38, 25%, 85%)' }}
              formatter={(v, name) => (name === 'Volume (SCU)' ? [`${v.toLocaleString()} SCU`, name] : [`${v.toLocaleString()} aUEC`, name])}
            />
            <Legend wrapperStyle={{ fontSize: 9, fontFamily: 'monospace' }} />
            <Bar yAxisId="scu" dataKey="scu" name="Volume (SCU)" fill="hsl(210, 45%, 55%)" opacity={0.5} radius={[3, 3, 0, 0]} />
            <Area yAxisId="auec" type="monotone" dataKey="revenue" name="Revenue" stroke="hsl(42, 85%, 60%)" fill="hsl(42, 85%, 60%)" fillOpacity={0.15} strokeWidth={2} />
            <Area yAxisId="auec" type="monotone" dataKey="net" name="Net profit" stroke="hsl(95, 35%, 55%)" fill="transparent" strokeWidth={1.5} strokeDasharray="5 3" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Profit by commodity */}
      <div className="rounded border p-3" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 8%)' }}>
        <div className="text-[9px] text-muted-foreground tracking-[0.2em] mb-3">PROFIT BY COMMODITY (VOLUME × CURRENT BEST SELL)</div>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={commodityData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid stroke="hsl(33, 18%, 18%)" strokeDasharray="3 3" opacity={0.4} />
            <XAxis type="number" tick={{ fontSize: 9, fill: 'hsl(35, 12%, 52%)', fontFamily: 'monospace' }} stroke="hsl(33, 18%, 18%)" tickFormatter={fmtK} />
            <YAxis type="category" dataKey="code" width={40} tick={{ fontSize: 10, fill: 'hsl(38, 25%, 85%)', fontFamily: 'monospace' }} stroke="hsl(33, 18%, 18%)" />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: 'hsl(38, 25%, 85%)' }}
              formatter={(v, key, { payload }) => [`${v.toLocaleString()} aUEC (${payload.scu.toLocaleString()} SCU)`, COMMODITY_NAMES[payload.code]]}
            />
            <Bar dataKey="value" radius={[0, 3, 3, 0]}>
              {commodityData.map((entry, i) => (
                <Cell key={entry.code} fill={BAR_COLORS[i % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[9px] text-muted-foreground/60 tracking-[0.1em]">
        Revenue & net from the ledger ({ledger.length} entries) • volume from {sessions.length} salvage sessions • commodity values at current UEX best sell.
      </p>
    </div>
  );
}