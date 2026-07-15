import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Loader2, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { sessionValue } from '@/components/apps/salvage/SessionSummary';

const AMBER = '#E0A22E';
const GREEN = '#4EBF7A';
const DIM = '#5A4A34';

const fmtAuec = (v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${Math.round(v / 1000)}K` : String(Math.round(v)));

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="border rounded p-2 font-mono text-[9px]" style={{ borderColor: '#5C4424', background: '#0E0C09', color: '#EDE5D6' }}>
      <div className="font-bold mb-1" style={{ color: AMBER }}>{d.name}</div>
      <div style={{ color: DIM }}>{d.date} · {d.ship || 'No ship'}</div>
      <div className="mt-1">VALUE <span className="font-bold" style={{ color: GREEN }}>{Math.round(d.value).toLocaleString()} aUEC</span></div>
      <div style={{ color: DIM }}>CUMULATIVE {Math.round(d.cumulative).toLocaleString()} aUEC</div>
    </div>
  );
}

/** Haul trends — commodity value per salvage session over time, with a cumulative growth line. */
export default function SalvageTrends({ bestPrices = {} }) {
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['salvage_sessions'],
    queryFn: () => base44.entities.salvage_session.list('-created_date', 500),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: AMBER }} />
      </div>
    );
  }

  // Oldest → newest, cumulative running total
  let running = 0;
  const data = [...sessions]
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
    .map((s) => {
      const value = sessionValue(s, bestPrices);
      running += value;
      return {
        name: s.session_name,
        ship: s.ship,
        date: new Date(s.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value,
        cumulative: running,
      };
    });

  const avg = data.length ? running / data.length : 0;
  const best = data.reduce((m, d) => (d.value > m ? d.value : m), 0);

  return (
    <div className="p-4 space-y-4 font-mono">
      <div className="flex items-center gap-2 text-[9px] tracking-[0.22em] font-bold" style={{ color: AMBER }}>
        <TrendingUp className="w-3.5 h-3.5" /> HAUL TRENDS — VALUE PER SESSION
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'SESSIONS', value: data.length.toLocaleString(), color: AMBER },
          { label: 'AVG / SESSION', value: `${fmtAuec(avg)} aUEC`, color: GREEN },
          { label: 'BEST HAUL', value: `${fmtAuec(best)} aUEC`, color: GREEN },
        ].map((k) => (
          <div key={k.label} className="border rounded p-3" style={{ borderColor: 'hsl(33,18%,18%)', background: 'hsl(30,10%,8%)' }}>
            <div className="text-[8px] tracking-[0.2em]" style={{ color: DIM }}>{k.label}</div>
            <div className="text-base font-bold mt-1" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div className="border rounded p-3" style={{ borderColor: 'hsl(33,18%,18%)', background: 'hsl(30,10%,8%)' }}>
        {data.length === 0 ? (
          <p className="text-[10px] text-center py-10" style={{ color: DIM }}>No salvage sessions saved yet — log a run or import an Arkanis log to start tracking.</p>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-2 text-[8px] tracking-[0.15em]" style={{ color: DIM }}>
              <span><span style={{ color: AMBER }}>■</span> SESSION VALUE</span>
              <span><span style={{ color: GREEN }}>—</span> CUMULATIVE GROWTH</span>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={data} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(33,18%,14%)" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#7A6E60', fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={{ stroke: 'hsl(33,18%,18%)' }} />
                <YAxis yAxisId="left" tickFormatter={fmtAuec} tick={{ fontSize: 9, fill: '#7A6E60', fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} width={44} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={fmtAuec} tick={{ fontSize: 9, fill: '#4EBF7A80', fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} width={44} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(224,162,46,0.06)' }} />
                <Bar yAxisId="left" dataKey="value" fill={AMBER} fillOpacity={0.75} radius={[2, 2, 0, 0]} maxBarSize={28} />
                <Line yAxisId="right" type="monotone" dataKey="cumulative" stroke={GREEN} strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </>
        )}
      </div>

      <p className="text-[8px] text-center" style={{ color: '#3A2A14' }}>
        Bars show each session's commodity value (stored estimate, or UEX best-sell when missing) · green line tracks cumulative earnings growth
      </p>
    </div>
  );
}