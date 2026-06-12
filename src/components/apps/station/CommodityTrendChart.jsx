import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { BarChart3 } from 'lucide-react';

const COMMODITIES = [
  { code: 'RMC', key: 'rmc_scu', color: 'hsl(42, 85%, 60%)' },
  { code: 'CMR', key: 'cmr_scu', color: 'hsl(205, 45%, 55%)' },
  { code: 'CMS', key: 'cms_scu', color: 'hsl(20, 60%, 50%)' },
];

/** Monthly salvage volume & revenue by commodity — management portal trend chart */
export default function CommodityTrendChart() {
  const [metric, setMetric] = useState('revenue'); // 'volume' | 'revenue'
  const [hidden, setHidden] = useState([]);

  const { data: sessions = [] } = useQuery({
    queryKey: ['station_sessions'],
    queryFn: () => base44.entities.salvage_session.list('-created_date', 100),
  });
  const { data: prices = [] } = useQuery({
    queryKey: ['commodity_prices'],
    queryFn: () => base44.entities.commodity_price.list(),
  });

  // Best sell price per commodity (aUEC/unit) — used to value SCU volumes
  const bestPrice = useMemo(() => {
    const out = {};
    prices.forEach((p) => {
      if (!out[p.commodity_code] || p.price_sell > out[p.commodity_code]) {
        out[p.commodity_code] = p.price_sell;
      }
    });
    return out;
  }, [prices]);

  const monthly = useMemo(() => {
    const buckets = {};
    sessions.forEach((s) => {
      const month = (s.created_date || '').slice(0, 7);
      if (!month) return;
      if (!buckets[month]) buckets[month] = { month };
      COMMODITIES.forEach(({ code, key }) => {
        const scu = s[key] || 0;
        buckets[month][`${code}_vol`] = (buckets[month][`${code}_vol`] || 0) + scu;
        // 1 SCU = 100 units for sell-price valuation
        buckets[month][`${code}_rev`] = (buckets[month][`${code}_rev`] || 0) + scu * 100 * (bestPrice[code] || 0);
      });
    });
    return Object.values(buckets)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((b) => ({
        ...b,
        label: new Date(b.month + '-02').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      }));
  }, [sessions, bestPrice]);

  const suffix = metric === 'volume' ? '_vol' : '_rev';
  const fmt = (v) =>
    metric === 'volume'
      ? `${Math.round(v).toLocaleString()} SCU`
      : `${Math.round(v).toLocaleString()} aUEC`;

  return (
    <div className="rounded border" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 8%)' }}>
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'hsl(33, 18%, 18%)' }}>
        <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground tracking-[0.15em]">
          <BarChart3 className="w-3 h-3" style={{ color: 'hsl(42, 60%, 50%)' }} />
          MONTHLY SALVAGE BY COMMODITY
        </div>
        <div className="flex rounded overflow-hidden border" style={{ borderColor: 'hsl(33, 18%, 18%)' }}>
          {['revenue', 'volume'].map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className="px-2.5 py-1 text-[9px] font-mono tracking-wider transition-colors"
              style={
                metric === m
                  ? { background: 'hsl(38, 72%, 52%)', color: 'hsl(30, 15%, 6%)' }
                  : { background: 'transparent', color: 'hsl(35, 12%, 52%)' }
              }
            >
              {m === 'revenue' ? 'REVENUE (aUEC)' : 'VOLUME (SCU)'}
            </button>
          ))}
        </div>
      </div>

      {monthly.length === 0 ? (
        <p className="text-[10px] text-muted-foreground text-center py-10">
          No salvage sessions logged yet — trends will appear here once runs are recorded.
        </p>
      ) : (
        <div className="p-3" style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly} margin={{ top: 5, right: 5, left: 5, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(33, 18%, 15%)" />
              <XAxis dataKey="label" tick={{ fill: 'hsl(35, 12%, 52%)', fontSize: 9, fontFamily: 'JetBrains Mono' }} />
              <YAxis
                tick={{ fill: 'hsl(35, 12%, 52%)', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
              />
              <Tooltip
                formatter={(value, name) => [fmt(value), name]}
                contentStyle={{
                  background: 'hsl(30, 10%, 7%)',
                  border: '1px solid hsl(33, 18%, 18%)',
                  borderRadius: 4,
                  fontSize: 10,
                  fontFamily: 'JetBrains Mono',
                }}
                cursor={{ fill: 'hsl(38, 72%, 52%, 0.06)' }}
              />
              <Legend
                wrapperStyle={{ fontSize: 10, fontFamily: 'JetBrains Mono', cursor: 'pointer' }}
                onClick={(e) =>
                  setHidden((h) => (h.includes(e.value) ? h.filter((x) => x !== e.value) : [...h, e.value]))
                }
              />
              {COMMODITIES.map(({ code, color }) => (
                <Bar
                  key={code}
                  dataKey={`${code}${suffix}`}
                  name={code}
                  stackId="total"
                  fill={color}
                  hide={hidden.includes(code)}
                  radius={[2, 2, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="px-3 pb-2 text-[8px] text-muted-foreground">
        Revenue valued at current UEX best sell prices (1 SCU = 100 units). Click a legend item to isolate commodities.
      </div>
    </div>
  );
}