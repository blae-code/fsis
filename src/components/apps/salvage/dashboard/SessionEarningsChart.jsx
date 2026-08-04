import React from 'react';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { fmtAuec } from '@/components/console/deck/DeckGauge';

const AXIS = { fontSize: 8, fill: '#5F564A', fontFamily: 'monospace' };

/** Value per session as bars, with the running total drawn over it. */
export default function SessionEarningsChart({ trend }) {
  if (trend.length === 0) {
    return (
      <p className="text-[9px] py-8 text-center" style={{ color: '#5F564A' }}>
        No salvage sessions logged yet. Log a run and its value appears here.
      </p>
    );
  }

  return (
    <div style={{ height: 220 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={trend} margin={{ top: 6, right: 4, left: -12, bottom: 0 }}>
          <CartesianGrid stroke="#1E1810" vertical={false} />
          <XAxis dataKey="date" tick={AXIS} stroke="#241C14" />
          <YAxis tick={AXIS} stroke="#241C14" tickFormatter={(v) => fmtAuec(v)} />
          <Tooltip
            contentStyle={{ background: '#0C0A07', border: '1px solid #3A2F20', fontFamily: 'monospace', fontSize: 10 }}
            labelStyle={{ color: '#E0A22E' }}
            formatter={(v, k) => [`${Math.round(v).toLocaleString()} aUEC`, k === 'value' ? 'SESSION' : 'RUNNING TOTAL']}
          />
          <Bar dataKey="value" fill="#E0A22E" fillOpacity={0.75} barSize={16} />
          <Line type="monotone" dataKey="cumulative" stroke="#6FA0C8" strokeWidth={1.5} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}