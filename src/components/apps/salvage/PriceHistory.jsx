import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts';
import { TrendingUp, AlertCircle } from 'lucide-react';

const COLORS = { RMC: 'hsl(38, 72%, 52%)', CMR: 'hsl(210, 45%, 55%)', CMS: 'hsl(20, 60%, 50%)' };

const tooltipStyle = {
  background: 'hsl(30, 10%, 8%)',
  border: '1px solid hsl(33, 18%, 18%)',
  borderRadius: 4,
  fontSize: 10,
  fontFamily: 'JetBrains Mono, monospace',
};

// EVE-style market history: charts best-sell snapshots captured on each UEX sync.
export default function PriceHistory() {
  const { data: snapshots = [], isLoading } = useQuery({
    queryKey: ['price_snapshots'],
    queryFn: () => base44.entities.price_snapshot.list('-captured_at', 300),
  });

  // Pivot: one row per capture time, columns per commodity
  const byTime = {};
  [...snapshots].reverse().forEach((s) => {
    const key = s.captured_at;
    if (!byTime[key]) {
      byTime[key] = {
        time: new Date(key).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }),
      };
    }
    byTime[key][s.commodity_code] = s.best_sell;
  });
  const data = Object.values(byTime);

  if (isLoading) {
    return <div className="text-center py-12 text-xs font-mono text-muted-foreground">Loading history…</div>;
  }

  return (
    <div className="p-4 space-y-4 font-mono">
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground tracking-[0.2em]">
        <TrendingUp className="w-3.5 h-3.5 text-primary" /> BEST SELL PRICE HISTORY (aUEC/UNIT)
      </div>

      {data.length < 2 ? (
        <div className="text-center py-10 rounded border" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 8%)' }}>
          <AlertCircle className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
          <p className="text-[10px] text-muted-foreground">Not enough history yet — a snapshot is captured on every UEX sync.</p>
          <p className="text-[9px] text-muted-foreground mt-1">Run a few syncs over time to chart price trends like an EVE regional market.</p>
        </div>
      ) : (
        <div className="h-64 rounded border p-3" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 8%)' }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid stroke="hsl(33, 18%, 14%)" strokeDasharray="3 3" />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: 'hsl(35, 12%, 52%)' }} />
              <YAxis tick={{ fontSize: 9, fill: 'hsl(35, 12%, 52%)' }} domain={['auto', 'auto']} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              {Object.entries(COLORS).map(([code, color]) => (
                <Line key={code} type="monotone" dataKey={code} stroke={color} strokeWidth={1.5} dot={false} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Latest snapshot summary */}
      {snapshots.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {['RMC', 'CMR', 'CMS'].map((code) => {
            const latest = snapshots.find((s) => s.commodity_code === code);
            if (!latest) return null;
            return (
              <div key={code} className="p-2.5 rounded border text-center" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 8%)' }}>
                <div className="text-[9px] text-muted-foreground">{code}</div>
                <div className="text-sm font-bold" style={{ color: COLORS[code] }}>{latest.best_sell?.toFixed(2)}</div>
                <div className="text-[8px] text-muted-foreground truncate">{latest.best_terminal}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}