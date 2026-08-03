import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2, TrendingUp } from 'lucide-react';

const PANEL = { background: '#0E0C09', borderColor: '#2A2118' };
const AMBER = '#E0A22E';
const GREEN = '#8A8F45';
const BLUE = '#6FA0C8';
const DIM = '#6B6155';

const RANGES = [
  { label: 'LAST 30 DAYS', days: 30 },
  { label: 'LAST 7 DAYS', days: 7 },
  { label: 'LAST 90 DAYS', days: 90 },
];

const fmt = (n) => Math.round(Number(n) || 0).toLocaleString();

/**
 * Haul value and margin across closed runs.
 *
 * Only CLOSED runs are read: an underway run has no settled gross, and charting a half-finished run
 * beside finished ones would make it look like the worst evening of the month. Losses are reported
 * beside the margin but never subtracted from it — a lost hull was borne by the comrade who flew it,
 * not taken out of the crew's share.
 */
export default function RunProfitChart() {
  const [days, setDays] = useState(30);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['run_profit_chart'],
    queryFn: () => base44.entities.operation_session.list('-closed_date', 200),
  });

  const runs = useMemo(() => {
    const cutoff = Date.now() - days * 86400000;
    return sessions
      .filter((s) => s.status === 'closed' && new Date(s.closed_at || s.ended_at || s.created_date).getTime() >= cutoff)
      .map((s) => {
        const gross = Number(s.gross_auec) || 0;
        const costs = Number(s.costs_auec) || 0;
        const net = Number(s.net_auec) || gross - costs;
        const losses = (s.losses || []).reduce((a, l) => a + (Number(l.estimated_auec) || 0), 0);
        return {
          id: s.id,
          name: s.session_name,
          when: new Date(s.closed_at || s.ended_at || s.created_date),
          op_type: s.op_type,
          gross,
          costs,
          net,
          losses,
          margin: gross > 0 ? Math.round((net / gross) * 100) : 0,
        };
      })
      .sort((a, b) => a.when - b.when);
  }, [sessions, days]);

  const totals = runs.reduce(
    (a, r) => ({ gross: a.gross + r.gross, costs: a.costs + r.costs, net: a.net + r.net, losses: a.losses + r.losses }),
    { gross: 0, costs: 0, net: 0, losses: 0 },
  );
  const overallMargin = totals.gross > 0 ? Math.round((totals.net / totals.gross) * 100) : 0;
  const best = [...runs].sort((a, b) => b.net - a.net).slice(0, 5);

  const chartData = runs.map((r) => ({
    label: r.when.toLocaleDateString([], { month: 'short', day: 'numeric' }),
    name: r.name,
    HAUL: r.gross,
    SHARED: r.net,
    MARGIN: r.margin,
  }));

  return (
    <div className="space-y-3 font-mono">
      <div className="flex items-center gap-2 text-[9px] tracking-[0.22em]" style={{ color: AMBER }}>
        <TrendingUp className="w-3.5 h-3.5" /> HAUL VALUE &amp; MARGIN — CLOSED RUNS
      </div>
      <p className="text-[9px] leading-relaxed max-w-3xl" style={{ color: '#8A7E6C' }}>
        Only settled runs appear: a run still underway has no final figure, and showing it beside finished
        ones would read as a bad evening rather than an unfinished one. Losses are stated apart from the
        margin — a lost hull was borne by the comrade who flew it and is never taken out of the crew's share.
      </p>

      <div className="flex flex-wrap gap-1">
        {RANGES.map((r) => (
          <button
            key={r.days}
            onClick={() => setDays(r.days)}
            className="h-8 px-3 border text-[8px] font-bold tracking-[0.12em]"
            style={{
              borderColor: days === r.days ? AMBER : '#2E2519',
              color: days === r.days ? AMBER : DIM,
              background: days === r.days ? `${AMBER}14` : '#0C0A07',
            }}
          >
            {r.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-4 h-4 animate-spin" style={{ color: AMBER }} /></div>
      ) : runs.length === 0 ? (
        <p className="text-[9px] py-8 text-center border" style={{ color: DIM, borderColor: '#2E2519' }}>
          No runs were settled in this window.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
            {[
              { label: 'TOTAL HAUL', value: `${fmt(totals.gross)}`, color: AMBER },
              { label: 'COSTS OF THE RUNS', value: `${fmt(totals.costs)}`, color: '#C8893B' },
              { label: 'SHARED OUT', value: `${fmt(totals.net)}`, color: GREEN },
              { label: 'MARGIN', value: `${overallMargin}%`, color: overallMargin >= 0 ? GREEN : '#C05050' },
              { label: 'LOSSES BORNE', value: `${fmt(totals.losses)}`, color: totals.losses > 0 ? '#C05050' : DIM },
            ].map((k) => (
              <div key={k.label} className="border p-3" style={PANEL}>
                <div className="text-[8px] tracking-[0.18em] mb-1" style={{ color: DIM }}>{k.label}</div>
                <div className="text-lg font-bold" style={{ color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>

          <div className="border p-3" style={PANEL}>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke="#241C12" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: DIM, fontSize: 8 }} stroke="#2A2118" />
                  <YAxis yAxisId="v" tick={{ fill: DIM, fontSize: 8 }} stroke="#2A2118" tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                  <YAxis yAxisId="m" orientation="right" unit="%" tick={{ fill: BLUE, fontSize: 8 }} stroke="#2A2118" />
                  <Tooltip
                    contentStyle={{ background: '#0C0A07', border: '1px solid #3A2F20', fontSize: 10, fontFamily: 'monospace', color: '#EDE5D6' }}
                    labelFormatter={(l, p) => p?.[0]?.payload?.name || l}
                    formatter={(v, n) => (n === 'MARGIN' ? `${v}%` : `${fmt(v)} aUEC`)}
                  />
                  <Legend wrapperStyle={{ fontSize: 8, fontFamily: 'monospace', color: DIM }} />
                  <Bar yAxisId="v" dataKey="HAUL" fill={AMBER} />
                  <Bar yAxisId="v" dataKey="SHARED" fill={GREEN} />
                  <Line yAxisId="m" type="monotone" dataKey="MARGIN" stroke={BLUE} strokeWidth={2} dot={{ r: 2 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="border" style={PANEL}>
            <div className="px-3 py-2 text-[9px] tracking-[0.2em] border-b" style={{ color: DIM, borderColor: '#2A2118' }}>
              MOST PROFITABLE RUNS IN THIS WINDOW
            </div>
            <div className="divide-y" style={{ borderColor: '#1C1610' }}>
              {best.map((r) => (
                <div key={r.id} className="px-3 py-2 flex items-center gap-2 flex-wrap text-[9px]" style={{ borderColor: '#1C1610' }}>
                  <span style={{ color: '#EDE5D6' }}>{r.name}</span>
                  <span style={{ color: DIM }}>{r.op_type?.toUpperCase()} · {r.when.toLocaleDateString()}</span>
                  <span className="ml-auto" style={{ color: AMBER }}>{fmt(r.gross)} HAUL</span>
                  <span style={{ color: '#C8893B' }}>−{fmt(r.costs)} COSTS</span>
                  <span className="font-bold" style={{ color: GREEN }}>{fmt(r.net)} SHARED</span>
                  <span className="w-12 text-right font-bold" style={{ color: r.margin >= 0 ? BLUE : '#C05050' }}>{r.margin}%</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}