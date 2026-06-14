import React, { useMemo, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { motion } from 'framer-motion';

const AMBER = '#E0A22E';
const TEAL  = '#5F9A8C';
const BLUE  = '#6FA0C8';
const DIM   = '#5A4A34';
const GRID  = '#1E1610';
const PANEL = { background: '#0E0C09', borderColor: '#2A2118' };

const COMMODITIES = [
  { key: 'rmc_scu', label: 'RMC', color: AMBER },
  { key: 'cmr_scu', label: 'CMR', color: TEAL },
  { key: 'cms_scu', label: 'CMS', color: BLUE },
];

const CHART_VIEWS = [
  { id: 'cumulative', label: 'CUMULATIVE' },
  { id: 'per_session', label: 'PER SESSION' },
];

function TerminalTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="font-mono text-[9px] border p-2 space-y-1" style={{ background: '#0A0806', borderColor: '#3A2A14' }}>
      <div className="tracking-[0.15em] pb-1 border-b" style={{ color: DIM, borderColor: '#2A1A08' }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-sm" style={{ background: p.color }} />
            <span style={{ color: p.color }}>{p.name}</span>
          </div>
          <span className="font-bold" style={{ color: p.color }}>{(p.value || 0).toLocaleString()} SCU</span>
        </div>
      ))}
    </div>
  );
}

export default function SalvageStockChart({ sessions = [] }) {
  const [view, setView] = useState('cumulative');

  // Sort sessions oldest → newest for time series
  const sorted = useMemo(() =>
    [...sessions].sort((a, b) => new Date(a.created_date) - new Date(b.created_date)),
    [sessions]
  );

  // Cumulative area chart data
  const cumulativeData = useMemo(() => {
    let rmc = 0, cmr = 0, cms = 0;
    return sorted.map(s => {
      rmc += s.rmc_scu || 0;
      cmr += s.cmr_scu || 0;
      cms += s.cms_scu || 0;
      const date = new Date(s.created_date);
      return {
        label: `${date.getMonth() + 1}/${date.getDate()}`,
        name: s.session_name,
        RMC: rmc,
        CMR: cmr,
        CMS: cms,
      };
    });
  }, [sorted]);

  // Per-session stacked bar data (last 20 sessions)
  const perSessionData = useMemo(() =>
    sorted.slice(-20).map(s => {
      const date = new Date(s.created_date);
      return {
        label: s.session_name?.length > 12 ? s.session_name.slice(0, 12) + '…' : (s.session_name || `${date.getMonth()+1}/${date.getDate()}`),
        RMC: s.rmc_scu || 0,
        CMR: s.cmr_scu || 0,
        CMS: s.cms_scu || 0,
      };
    }),
    [sorted]
  );

  const hasData = sorted.length > 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
      className="border p-4 space-y-3" style={PANEL}>

      {/* Header + view toggle */}
      <div className="flex items-center justify-between">
        <div className="text-[9px] tracking-[0.25em]" style={{ color: DIM }}>
          STOCK ACCUMULATION — SCU OVER TIME
        </div>
        <div className="flex gap-1">
          {CHART_VIEWS.map(({ id, label }) => (
            <button key={id} onClick={() => setView(id)}
              className="px-2.5 py-1 text-[8px] tracking-[0.12em] transition-colors rounded-sm"
              style={{
                background: view === id ? '#2A1E0A' : 'transparent',
                color: view === id ? AMBER : DIM,
                border: `1px solid ${view === id ? AMBER + '35' : '#2A2018'}`,
              }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <div className="flex items-center justify-center h-36" style={{ color: '#2A1E0A' }}>
          <span className="font-mono text-[9px] tracking-[0.2em]">NO SESSION DATA</span>
        </div>
      ) : view === 'cumulative' ? (
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={cumulativeData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              {COMMODITIES.map(({ key, label, color }) => (
                <linearGradient key={key} id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="2 4" stroke={GRID} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: DIM, fontSize: 8, fontFamily: 'JetBrains Mono' }}
              axisLine={{ stroke: '#2A2118' }} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fill: DIM, fontSize: 8, fontFamily: 'JetBrains Mono' }}
              axisLine={false} tickLine={false} width={36}
              tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
            <Tooltip content={<TerminalTooltip />} />
            {COMMODITIES.map(({ label, color }) => (
              <Area key={label} type="monotone" dataKey={label} name={label}
                stroke={color} strokeWidth={1.5}
                fill={`url(#grad-${label})`}
                dot={false} activeDot={{ r: 3, fill: color, strokeWidth: 0 }} />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={perSessionData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke={GRID} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: DIM, fontSize: 7, fontFamily: 'JetBrains Mono' }}
              axisLine={{ stroke: '#2A2118' }} tickLine={false} interval={0}
              angle={-35} textAnchor="end" height={40} />
            <YAxis tick={{ fill: DIM, fontSize: 8, fontFamily: 'JetBrains Mono' }}
              axisLine={false} tickLine={false} width={36}
              tickFormatter={v => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v} />
            <Tooltip content={<TerminalTooltip />} cursor={{ fill: '#1A1208' }} />
            {COMMODITIES.map(({ label, color }) => (
              <Bar key={label} dataKey={label} name={label} stackId="stack"
                fill={color} opacity={0.85} radius={label === 'CMS' ? [2, 2, 0, 0] : [0, 0, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}

      {/* Legend */}
      <div className="flex gap-4 pt-1 border-t" style={{ borderColor: '#1E1610' }}>
        {COMMODITIES.map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-sm" style={{ background: color }} />
            <span className="font-mono text-[8px] tracking-[0.1em]" style={{ color }}>{label}</span>
          </div>
        ))}
        <span className="font-mono text-[8px] ml-auto" style={{ color: '#2A1E0A' }}>
          {view === 'per_session' && sorted.length > 20 ? `LAST 20 OF ${sorted.length}` : `${sorted.length} SESSIONS`}
        </span>
      </div>
    </motion.div>
  );
}