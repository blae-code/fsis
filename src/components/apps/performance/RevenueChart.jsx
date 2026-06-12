import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const tooltipStyle = {
  background: 'hsl(30, 10%, 7%)',
  border: '1px solid hsl(33, 18%, 18%)',
  borderRadius: 4,
  fontSize: 10,
  fontFamily: 'JetBrains Mono, monospace',
};

const fmt = (v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v);

/** Monthly revenue from the ledger, split salvage vs other income */
export default function RevenueChart({ data }) {
  return (
    <div className="border p-3" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 8%)' }}>
      <div className="text-[9px] text-muted-foreground tracking-[0.2em] mb-3">REVENUE OVER TIME (aUEC / MONTH)</div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="gradSalvage" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(42, 85%, 60%)" stopOpacity={0.5} />
              <stop offset="100%" stopColor="hsl(42, 85%, 60%)" stopOpacity={0.05} />
            </linearGradient>
            <linearGradient id="gradOther" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="hsl(210, 45%, 55%)" stopOpacity={0.5} />
              <stop offset="100%" stopColor="hsl(210, 45%, 55%)" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="hsl(33, 18%, 18%)" strokeDasharray="3 3" opacity={0.4} />
          <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'hsl(35, 12%, 52%)', fontFamily: 'monospace' }} stroke="hsl(33, 18%, 18%)" />
          <YAxis tick={{ fontSize: 9, fill: 'hsl(35, 12%, 52%)', fontFamily: 'monospace' }} stroke="hsl(33, 18%, 18%)" tickFormatter={fmt} />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: 'hsl(38, 25%, 85%)' }} formatter={(v, name) => [`${v.toLocaleString()} aUEC`, name]} />
          <Legend wrapperStyle={{ fontSize: 9, fontFamily: 'monospace' }} />
          <Area type="monotone" dataKey="Salvage sales" stackId="r" stroke="hsl(42, 85%, 60%)" strokeWidth={2} fill="url(#gradSalvage)" />
          <Area type="monotone" dataKey="Other income" stackId="r" stroke="hsl(210, 45%, 55%)" strokeWidth={2} fill="url(#gradOther)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}