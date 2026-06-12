import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, AlertCircle } from 'lucide-react';

const SERIES = [
  { key: 'RMC', field: 'rmc_scu', color: 'hsl(38, 72%, 52%)' },
  { key: 'CMR', field: 'cmr_scu', color: 'hsl(210, 45%, 55%)' },
  { key: 'CMS', field: 'cms_scu', color: 'hsl(20, 60%, 50%)' },
];

// Reconstructs stock-on-hand over time from session lifecycles:
// stock enters when a session is created, leaves when it's sold/archived.
function buildSeries(sessions) {
  const events = [];
  for (const s of sessions) {
    const amounts = SERIES.map(({ key, field }) => [key, s[field] || 0]);
    if (amounts.every(([, v]) => v === 0)) continue;
    events.push({ date: s.created_date, amounts, sign: 1 });
    if (['sold', 'archived'].includes(s.status)) {
      events.push({ date: s.updated_date, amounts, sign: -1 });
    }
  }
  events.sort((a, b) => new Date(a.date) - new Date(b.date));

  const running = { RMC: 0, CMR: 0, CMS: 0 };
  const byDay = new Map();
  for (const ev of events) {
    for (const [key, v] of ev.amounts) running[key] += v * ev.sign;
    const day = new Date(ev.date).toISOString().slice(0, 10);
    byDay.set(day, { date: day, RMC: Math.max(0, running.RMC), CMR: Math.max(0, running.CMR), CMS: Math.max(0, running.CMS) });
  }
  return [...byDay.values()];
}

export default function StockTrend() {
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['salvage_sessions'],
    queryFn: () => base44.entities.salvage_session.list('-created_date', 200),
  });

  const data = buildSeries(sessions);
  const current = data.length ? data[data.length - 1] : null;

  if (isLoading) {
    return <div className="text-center py-12 text-xs font-mono text-muted-foreground">Reconstructing stock history…</div>;
  }

  if (data.length < 2) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
        <p className="text-xs font-mono text-muted-foreground">Not enough session history to plot a trend yet.</p>
        <p className="text-[10px] font-mono text-muted-foreground mt-1">Stock builds as sessions are logged and drops when they're sold.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 font-mono">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground tracking-[0.2em]">
          <TrendingUp className="w-3.5 h-3.5 text-primary" /> STOCK ON HAND — SCU OVER TIME
        </div>
        {current && (
          <div className="flex gap-2">
            {SERIES.map(({ key, color }) => (
              <span key={key} className="text-[10px] px-2 py-0.5 rounded" style={{ background: 'hsl(30, 10%, 12%)', color }}>
                {key} {current[key].toFixed(1)}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="rounded border p-3" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 8%)' }}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(33, 18%, 15%)" />
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(35, 12%, 52%)', fontFamily: 'JetBrains Mono' }} />
            <YAxis tick={{ fontSize: 9, fill: 'hsl(35, 12%, 52%)', fontFamily: 'JetBrains Mono' }} unit=" SCU" width={70} />
            <Tooltip
              contentStyle={{ background: 'hsl(30, 10%, 7%)', border: '1px solid hsl(33, 18%, 18%)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              formatter={(v) => `${v.toFixed(1)} SCU`}
            />
            <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'JetBrains Mono' }} />
            {SERIES.map(({ key, color }) => (
              <Line key={key} type="stepAfter" dataKey={key} stroke={color} strokeWidth={2} dot={{ r: 2 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[9px] text-muted-foreground">
        Trend is reconstructed from session lifecycles — stock enters when a session is logged, exits when it's marked sold or archived. Rising lines mean it's time to plan a haul.
      </p>
    </div>
  );
}