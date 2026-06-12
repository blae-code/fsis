import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COMMODITIES = ['RMC', 'CMR', 'CMS'];
const COLORS = {
  RMC: 'hsl(38, 72%, 52%)',
  CMR: 'hsl(20, 60%, 50%)',
  CMS: 'hsl(210, 45%, 55%)',
};

const monthKey = (d) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
};
const monthLabel = (key) => {
  const [y, m] = key.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
};

/** Interactive monthly volume & revenue chart, broken down by commodity */
export default function CommodityTrades({ sessions, bestPrice }) {
  const [metric, setMetric] = useState('revenue');
  const [hidden, setHidden] = useState([]);

  const data = useMemo(() => {
    const byMonth = {};
    sessions.forEach((s) => {
      const key = monthKey(s.created_date);
      if (!byMonth[key]) byMonth[key] = { RMC: 0, CMR: 0, CMS: 0 };
      byMonth[key].RMC += s.rmc_scu || 0;
      byMonth[key].CMR += s.cmr_scu || 0;
      byMonth[key].CMS += s.cms_scu || 0;
    });
    return Object.keys(byMonth).sort().map((key) => {
      const row = { month: monthLabel(key) };
      COMMODITIES.forEach((c) => {
        row[c] = metric === 'volume'
          ? byMonth[key][c]
          : Math.round(byMonth[key][c] * 100 * (bestPrice[c] || 0));
      });
      return row;
    });
  }, [sessions, bestPrice, metric]);

  const toggle = (code) =>
    setHidden((h) => (h.includes(code) ? h.filter((c) => c !== code) : [...h, code]));

  const fmt = (v) => (metric === 'volume' ? `${v.toLocaleString()} SCU` : `${v.toLocaleString()} aUEC`);

  return (
    <div className="rounded border p-3" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 8%)' }}>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="text-[9px] text-muted-foreground tracking-[0.2em]">
          COMMODITY TRADES — MONTHLY {metric === 'volume' ? 'VOLUME' : 'REVENUE'} BY COMMODITY
        </div>
        <div className="flex rounded border overflow-hidden" style={{ borderColor: 'hsl(33, 18%, 18%)' }}>
          {['revenue', 'volume'].map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className="px-3 py-1 text-[9px] font-mono tracking-wider transition-colors"
              style={{
                background: metric === m ? 'hsl(38, 72%, 52%)' : 'transparent',
                color: metric === m ? 'hsl(30, 15%, 6%)' : 'hsl(35, 12%, 52%)',
              }}
            >
              {m === 'revenue' ? 'REVENUE (aUEC)' : 'VOLUME (SCU)'}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(33, 18%, 15%)" />
            <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'hsl(35, 12%, 52%)', fontFamily: 'JetBrains Mono' }} />
            <YAxis
              tick={{ fontSize: 9, fill: 'hsl(35, 12%, 52%)', fontFamily: 'JetBrains Mono' }}
              tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
            />
            <Tooltip
              formatter={(value, name) => [fmt(value), name]}
              contentStyle={{
                background: 'hsl(30, 10%, 7%)',
                border: '1px solid hsl(33, 18%, 18%)',
                fontSize: 10,
                fontFamily: 'JetBrains Mono',
              }}
              cursor={{ fill: 'hsl(38, 72%, 52%, 0.06)' }}
            />
            <Legend
              onClick={(e) => toggle(e.dataKey)}
              wrapperStyle={{ fontSize: 10, fontFamily: 'JetBrains Mono', cursor: 'pointer' }}
            />
            {COMMODITIES.map((c) => (
              <Bar key={c} dataKey={c} stackId="a" fill={COLORS[c]} hide={hidden.includes(c)} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[9px] text-muted-foreground/60 mt-2">
        Revenue estimated from logged SCU × current UEX best sell price. Click a legend item to isolate commodities.
      </p>
    </div>
  );
}