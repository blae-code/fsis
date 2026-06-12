import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const tooltipStyle = {
  background: 'hsl(30, 10%, 7%)',
  border: '1px solid hsl(33, 18%, 18%)',
  borderRadius: 4,
  fontSize: 10,
  fontFamily: 'JetBrains Mono, monospace',
};

/** Monthly salvage volume, stacked by commodity (SCU) */
export default function VolumeChart({ data }) {
  return (
    <div className="border p-3" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 8%)' }}>
      <div className="text-[9px] text-muted-foreground tracking-[0.2em] mb-3">SALVAGE VOLUME OVER TIME (SCU / MONTH)</div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid stroke="hsl(33, 18%, 18%)" strokeDasharray="3 3" opacity={0.4} />
          <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'hsl(35, 12%, 52%)', fontFamily: 'monospace' }} stroke="hsl(33, 18%, 18%)" />
          <YAxis tick={{ fontSize: 9, fill: 'hsl(35, 12%, 52%)', fontFamily: 'monospace' }} stroke="hsl(33, 18%, 18%)" />
          <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: 'hsl(38, 25%, 85%)' }} formatter={(v, name) => [`${v.toLocaleString()} SCU`, name]} />
          <Legend wrapperStyle={{ fontSize: 9, fontFamily: 'monospace' }} />
          <Bar dataKey="RMC" stackId="v" fill="hsl(42, 85%, 60%)" />
          <Bar dataKey="CMR" stackId="v" fill="hsl(20, 60%, 50%)" />
          <Bar dataKey="CMS" stackId="v" fill="hsl(210, 45%, 55%)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}