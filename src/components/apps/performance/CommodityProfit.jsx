import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['hsl(42, 85%, 60%)', 'hsl(20, 60%, 50%)', 'hsl(210, 45%, 55%)'];

const tooltipStyle = {
  background: 'hsl(30, 10%, 7%)',
  border: '1px solid hsl(33, 18%, 18%)',
  borderRadius: 4,
  fontSize: 10,
  fontFamily: 'JetBrains Mono, monospace',
};

const fmt = (v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v);

/** Commodity profit ranking — which wares bring in the most aUEC */
export default function CommodityProfit({ data }) {
  const ranked = [...data].sort((a, b) => b.value - a.value);
  return (
    <div className="border p-3" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 8%)' }}>
      <div className="text-[9px] text-muted-foreground tracking-[0.2em] mb-3">COMMODITY PROFIT RANKING (aUEC @ CURRENT BEST SELL)</div>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={ranked} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
          <CartesianGrid stroke="hsl(33, 18%, 18%)" strokeDasharray="3 3" opacity={0.4} />
          <XAxis type="number" tick={{ fontSize: 9, fill: 'hsl(35, 12%, 52%)', fontFamily: 'monospace' }} stroke="hsl(33, 18%, 18%)" tickFormatter={fmt} />
          <YAxis type="category" dataKey="code" width={42} tick={{ fontSize: 10, fill: 'hsl(38, 25%, 85%)', fontFamily: 'monospace' }} stroke="hsl(33, 18%, 18%)" />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: 'hsl(38, 25%, 85%)' }}
            formatter={(v, key, { payload }) => [`${v.toLocaleString()} aUEC (${payload.scu.toLocaleString()} SCU @ ${payload.price.toFixed(2)}/unit)`, payload.name]}
          />
          <Bar dataKey="value" radius={[0, 3, 3, 0]} barSize={18}>
            {ranked.map((entry, i) => (
              <Cell key={entry.code} fill={COLORS[i % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-2 space-y-1">
        {ranked.map((c, i) => (
          <div key={c.code} className="flex items-center justify-between text-[10px]">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 inline-block" style={{ background: COLORS[i % COLORS.length] }} />
              <span style={{ color: 'hsl(38, 25%, 85%)' }}>{c.code} — {c.name}</span>
            </span>
            <span className="text-muted-foreground">
              {c.scu.toLocaleString()} SCU · {c.price ? `${c.price.toFixed(2)} aUEC/unit · ` : ''}
              <span style={{ color: 'hsl(42, 85%, 60%)' }}>{c.value.toLocaleString()} aUEC</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}