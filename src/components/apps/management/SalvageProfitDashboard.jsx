import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { C, panel, plate, notch } from '@/components/console/theme';

const COST_CATEGORIES = ['fuel', 'repairs', 'crew_pay', 'ship_rental', 'fees_fines', 'equipment'];

const fmt = (n) => {
  const v = Math.round(n || 0);
  if (Math.abs(v) >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
  return String(v);
};

const dayKey = (d) => new Date(d).toISOString().slice(0, 10);

function Kpi({ label, value, sub, color }) {
  return (
    <div className="border px-3 py-2" style={{ ...panel, ...notch(6) }}>
      <div className="text-[8px] tracking-[0.2em]" style={{ color: C.dimmer }}>{label}</div>
      <div className="text-lg font-bold leading-tight" style={{ color }}>{value}</div>
      {sub && <div className="text-[8px]" style={{ color: C.faint }}>{sub}</div>}
    </div>
  );
}

/**
 * Haul value and margin over the last 30 days — realised salvage sales from the
 * ledger against the running costs of getting them, plus the cargo still sitting
 * unsold in open sessions.
 */
export default function SalvageProfitDashboard() {
  const { data: sessions = [] } = useQuery({
    queryKey: ['salvage_profit_sessions'],
    queryFn: () => base44.entities.salvage_session.list('-created_date', 200),
  });
  const { data: ledger = [] } = useQuery({
    queryKey: ['salvage_profit_ledger'],
    queryFn: () => base44.entities.ledger_entry.list('-entry_date', 400),
  });

  const model = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 29);
    cutoff.setHours(0, 0, 0, 0);

    // 30 empty day buckets, oldest first
    const days = [];
    const byDay = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(cutoff);
      d.setDate(cutoff.getDate() + i);
      const key = dayKey(d);
      const row = { key, label: `${d.getMonth() + 1}/${d.getDate()}`, haul: 0, cost: 0 };
      byDay[key] = row;
      days.push(row);
    }

    for (const e of ledger) {
      const key = dayKey(e.entry_date || e.created_date);
      const row = byDay[key];
      if (!row) continue;
      if (e.entry_type === 'income' && e.category === 'salvage_sale') row.haul += e.amount_auec || 0;
      else if (e.entry_type === 'expense' && COST_CATEGORIES.includes(e.category)) row.cost += e.amount_auec || 0;
    }

    for (const row of days) {
      row.margin = row.haul > 0 ? Math.round(((row.haul - row.cost) / row.haul) * 100) : 0;
    }

    const haul = days.reduce((s, r) => s + r.haul, 0);
    const cost = days.reduce((s, r) => s + r.cost, 0);
    const inRange = sessions.filter((s) => new Date(s.created_date) >= cutoff);
    const unsold = inRange
      .filter((s) => !['sold', 'archived'].includes(s.status))
      .reduce((s, sess) => s + (sess.estimated_value || 0), 0);

    return {
      days,
      haul,
      cost,
      net: haul - cost,
      margin: haul > 0 ? ((haul - cost) / haul) * 100 : 0,
      unsold,
      sessionCount: inRange.length,
      bestDay: [...days].sort((a, b) => (b.haul - b.cost) - (a.haul - a.cost))[0],
    };
  }, [sessions, ledger]);

  const netColor = model.net >= 0 ? C.green : C.red;

  return (
    <div className="space-y-3 font-mono">
      <div className="border px-3 py-2 flex items-baseline gap-3" style={{ ...plate, ...notch(8) }}>
        <span className="text-[10px] font-bold tracking-[0.28em]" style={{ color: C.bone }}>HAUL VALUE & MARGIN</span>
        <span className="text-[8px] truncate" style={{ color: C.dim }}>Last 30 days — realised salvage sales against the running costs of the work.</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
        <Kpi label="HAUL VALUE" value={`${fmt(model.haul)} ¤`} sub="salvage sales booked" color={C.amber} />
        <Kpi label="RUNNING COSTS" value={`${fmt(model.cost)} ¤`} sub="fuel, repair, crew, hulls" color={C.red} />
        <Kpi label="NET" value={`${fmt(model.net)} ¤`} sub={model.net >= 0 ? 'kept by the yard' : 'shortfall'} color={netColor} />
        <Kpi label="MARGIN" value={`${model.margin.toFixed(1)}%`} sub="of every credit hauled" color={model.margin >= 0 ? C.teal : C.red} />
        <Kpi label="UNSOLD CARGO" value={`${fmt(model.unsold)} ¤`} sub={`${model.sessionCount} sessions logged`} color={C.olive} />
      </div>

      <div className="border p-3" style={{ ...panel, ...notch(8) }}>
        <div className="text-[9px] tracking-[0.22em] pb-2 mb-1 border-b" style={{ color: C.dim, borderColor: '#241C14' }}>
          DAILY HAUL VS COST · MARGIN LINE
        </div>
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={model.days} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
              <CartesianGrid stroke="#241C14" vertical={false} />
              <XAxis dataKey="label" stroke="#5F564A" tick={{ fontSize: 8, fontFamily: 'monospace' }} interval={4} tickLine={false} />
              <YAxis yAxisId="v" stroke="#5F564A" tick={{ fontSize: 8, fontFamily: 'monospace' }} tickFormatter={fmt} tickLine={false} axisLine={false} />
              <YAxis yAxisId="m" orientation="right" stroke="#5F564A" tick={{ fontSize: 8, fontFamily: 'monospace' }} tickFormatter={(v) => `${v}%`} tickLine={false} axisLine={false} domain={[-100, 100]} />
              <Tooltip
                contentStyle={{ background: '#0C0A07', border: '1px solid #3A2F20', fontFamily: 'monospace', fontSize: 10 }}
                labelStyle={{ color: C.bone }}
                formatter={(value, name) => [name === 'MARGIN' ? `${value}%` : `${Math.round(value).toLocaleString()} ¤`, name]}
              />
              <Legend wrapperStyle={{ fontSize: 8, fontFamily: 'monospace', letterSpacing: '0.16em', color: C.dim }} />
              <Bar yAxisId="v" dataKey="haul" name="HAUL" fill={C.amber} fillOpacity={0.85} />
              <Bar yAxisId="v" dataKey="cost" name="COST" fill={C.red} fillOpacity={0.6} />
              <Line yAxisId="m" type="monotone" dataKey="margin" name="MARGIN" stroke={C.teal} strokeWidth={1.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        {model.haul === 0 && model.cost === 0 && (
          <p className="text-[9px] text-center pt-2" style={{ color: C.dimmer }}>
            No salvage sales or running costs logged in the last 30 days — book them in the ledger and they appear here.
          </p>
        )}
      </div>
    </div>
  );
}