import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3 } from 'lucide-react';

const COMMODITY_NAMES = { RMC: 'Recycled Material Composite', CMR: 'Construction Mat. (Reclaimed)', CMS: 'Construction Mat. (Salvaged)' };
const BAR_COLORS = ['hsl(168, 80%, 55%)', 'hsl(155, 50%, 45%)', 'hsl(190, 50%, 45%)'];

const tooltipStyle = {
  background: 'hsl(180, 12%, 7%)',
  border: '1px solid hsl(170, 25%, 18%)',
  borderRadius: 4,
  fontSize: 10,
  fontFamily: 'JetBrains Mono, monospace',
};

export default function SalvageAnalytics({ bestPrices }) {
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['salvage_sessions_analytics'],
    queryFn: () => base44.entities.salvage_session.list('created_date', 200),
  });

  if (isLoading) {
    return <div className="text-center py-12 text-xs font-mono text-muted-foreground">Loading session data…</div>;
  }

  if (sessions.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
        <p className="text-xs font-mono text-muted-foreground">No salvage sessions logged yet — analytics will appear here.</p>
      </div>
    );
  }

  // Line chart: profit (estimated value) per session, oldest → newest
  const profitData = sessions.map((s) => ({
    name: s.session_name?.length > 14 ? s.session_name.slice(0, 14) + '…' : s.session_name,
    date: new Date(s.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    profit: s.estimated_value || 0,
  }));

  // Bar chart: total processed SCU × best known sell price per commodity
  const totals = { RMC: 0, CMR: 0, CMS: 0 };
  sessions.forEach((s) => {
    totals.RMC += s.rmc_scu || 0;
    totals.CMR += s.cmr_scu || 0;
    totals.CMS += s.cms_scu || 0;
  });
  const commodityData = Object.entries(totals).map(([code, scu]) => ({
    code,
    scu,
    value: Math.round(scu * 100 * (bestPrices?.[code]?.price_sell || 0)), // SCU → 100 units each
  }));
  const hasPriceData = commodityData.some((c) => c.value > 0);

  return (
    <div className="p-4 space-y-5 font-mono">
      {/* Profit per session */}
      <div className="rounded border p-3" style={{ borderColor: 'hsl(170, 25%, 18%)', background: 'hsl(180, 12%, 8%)' }}>
        <div className="text-[9px] text-muted-foreground tracking-[0.2em] mb-3">ESTIMATED PROFIT PER SESSION (aUEC)</div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={profitData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid stroke="hsl(170, 25%, 18%)" strokeDasharray="3 3" opacity={0.4} />
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(165, 20%, 50%)', fontFamily: 'monospace' }} stroke="hsl(170, 25%, 18%)" />
            <YAxis tick={{ fontSize: 9, fill: 'hsl(165, 20%, 50%)', fontFamily: 'monospace' }} stroke="hsl(170, 25%, 18%)" tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: 'hsl(165, 40%, 88%)' }}
              formatter={(v) => [`${v.toLocaleString()} aUEC`, 'Est. profit']}
            />
            <Line type="monotone" dataKey="profit" stroke="hsl(168, 80%, 55%)" strokeWidth={2} dot={{ r: 3, fill: 'hsl(168, 80%, 55%)' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Commodity value processed */}
      <div className="rounded border p-3" style={{ borderColor: 'hsl(170, 25%, 18%)', background: 'hsl(180, 12%, 8%)' }}>
        <div className="text-[9px] text-muted-foreground tracking-[0.2em] mb-3">
          MOST VALUABLE COMMODITIES PROCESSED {hasPriceData ? '(aUEC @ BEST SELL)' : '(SCU — no price data synced)'}
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={commodityData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid stroke="hsl(170, 25%, 18%)" strokeDasharray="3 3" opacity={0.4} />
            <XAxis dataKey="code" tick={{ fontSize: 10, fill: 'hsl(165, 40%, 88%)', fontFamily: 'monospace' }} stroke="hsl(170, 25%, 18%)" />
            <YAxis tick={{ fontSize: 9, fill: 'hsl(165, 20%, 50%)', fontFamily: 'monospace' }} stroke="hsl(170, 25%, 18%)" tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: 'hsl(165, 40%, 88%)' }}
              formatter={(v, key, { payload }) =>
                hasPriceData
                  ? [`${v.toLocaleString()} aUEC (${payload.scu.toLocaleString()} SCU)`, COMMODITY_NAMES[payload.code]]
                  : [`${payload.scu.toLocaleString()} SCU`, COMMODITY_NAMES[payload.code]]
              }
            />
            <Bar dataKey={hasPriceData ? 'value' : 'scu'} radius={[3, 3, 0, 0]}>
              {commodityData.map((entry, i) => (
                <Cell key={entry.code} fill={BAR_COLORS[i % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[9px] text-muted-foreground/60 tracking-[0.1em]">
        Based on {sessions.length} logged session{sessions.length === 1 ? '' : 's'}. Commodity values use the current best sell price from the UEX cache.
      </p>
    </div>
  );
}