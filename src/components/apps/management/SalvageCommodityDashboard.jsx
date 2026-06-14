import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import SalvageStockChart from './SalvageStockChart';

const AMBER = '#E0A22E';
const TEAL  = '#5F9A8C';
const BLUE  = '#6FA0C8';
const GREEN = '#4EBF7A';
const DIM   = '#5A4A34';
const PANEL = { background: '#0E0C09', borderColor: '#2A2118' };

const COMMODITIES = [
  { key: 'rmc_scu',  label: 'RMC',  full: 'Recycled Material Composite', color: AMBER },
  { key: 'cmr_scu',  label: 'CMR',  full: 'Construction Materials (Reclaimed)', color: TEAL },
  { key: 'cms_scu',  label: 'CMS',  full: 'Construction Materials (Salvaged)', color: BLUE },
];

const STATUS_COLORS = {
  planning:    '#6A5A40',
  'in-progress': AMBER,
  hauling:     TEAL,
  sold:        GREEN,
  archived:    '#3A2A14',
};

const RANGE_OPTIONS = [
  { label: 'ALL TIME', days: null },
  { label: '30D',      days: 30 },
  { label: '7D',       days: 7 },
];

function CommodityBar({ label, full, color, value, max, delay }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="space-y-1.5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-bold tracking-[0.15em]" style={{ color }}>{label}</span>
          <span className="font-mono text-[8px] tracking-[0.08em]" style={{ color: DIM }}>{full}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-base font-bold" style={{ color }}>{value.toLocaleString()}</span>
          <span className="font-mono text-[9px]" style={{ color: DIM }}>SCU</span>
        </div>
      </div>

      {/* Track */}
      <div className="relative h-3 rounded-sm overflow-hidden" style={{ background: '#1A1208' }}>
        <motion.div
          className="h-full rounded-sm"
          style={{ background: `linear-gradient(90deg, ${color}CC, ${color})`, boxShadow: `0 0 8px ${color}50` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: delay + 0.1, duration: 0.7, ease: 'easeOut' }}
        />
        {/* Tick marks */}
        {[25, 50, 75].map(p => (
          <div key={p} className="absolute top-0 bottom-0 w-px opacity-20"
            style={{ left: `${p}%`, background: AMBER }} />
        ))}
        {/* Percentage label inside bar */}
        {pct > 12 && (
          <div className="absolute inset-0 flex items-center px-2">
            <span className="font-mono text-[8px] font-bold" style={{ color: `${color}90` }}>
              {pct.toFixed(0)}%
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function SessionRow({ session }) {
  const statusColor = STATUS_COLORS[session.status] || DIM;
  const total = (session.rmc_scu || 0) + (session.cmr_scu || 0) + (session.cms_scu || 0);

  return (
    <div className="p-2.5 rounded border" style={PANEL}>
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <span className="font-mono text-[11px] text-foreground truncate block">{session.session_name}</span>
          <span className="font-mono text-[8px]" style={{ color: DIM }}>
            {session.ship && `${session.ship} · `}{session.location || '—'}
          </span>
        </div>
        <div className="font-mono text-[8px] px-2 py-0.5 rounded-sm tracking-[0.15em] shrink-0"
          style={{ background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}30` }}>
          {session.status?.toUpperCase()}
        </div>
        <div className="font-mono text-sm font-bold shrink-0" style={{ color: AMBER }}>
          {total.toLocaleString()} <span className="text-[8px]">SCU</span>
        </div>
      </div>

      {/* Mini bars */}
      <div className="grid grid-cols-3 gap-2">
        {COMMODITIES.map(({ key, label, color }) => {
          const val = session[key] || 0;
          return (
            <div key={key} className="space-y-0.5">
              <div className="flex justify-between items-center">
                <span className="font-mono text-[8px]" style={{ color }}>{label}</span>
                <span className="font-mono text-[8px] font-bold" style={{ color }}>{val}</span>
              </div>
              <div className="h-1.5 rounded-sm overflow-hidden" style={{ background: '#1A1208' }}>
                <div className="h-full rounded-sm"
                  style={{ width: `${total > 0 ? Math.round((val / total) * 100) : 0}%`, background: color }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function SalvageCommodityDashboard() {
  const [range, setRange] = useState(null); // null = all time

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['salvage_commodity_dash'],
    queryFn: () => base44.entities.salvage_session.list('-created_date', 200),
  });

  const filtered = useMemo(() => {
    if (!range) return sessions;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - range);
    return sessions.filter(s => new Date(s.created_date) >= cutoff);
  }, [sessions, range]);

  // Aggregate totals
  const totals = useMemo(() => {
    return COMMODITIES.map(({ key, label, full, color }) => {
      const value = filtered.reduce((sum, s) => sum + (s[key] || 0), 0);
      return { key, label, full, color, value };
    });
  }, [filtered]);

  const grandTotal = totals.reduce((s, c) => s + c.value, 0);
  const maxValue   = Math.max(...totals.map(c => c.value), 1);
  const totalHulls = filtered.reduce((s, sess) => s + (sess.hulls_scraped || 0), 0);
  const activeSess = filtered.filter(s => ['planning','in-progress','hauling'].includes(s.status)).length;

  // Sessions sorted newest first, separate active vs archived
  const activeSessions   = filtered.filter(s => ['planning','in-progress','hauling'].includes(s.status));
  const completedSessions = filtered.filter(s => ['sold','archived'].includes(s.status)).slice(0, 10);

  return (
    <div className="space-y-4 font-mono">

      {/* Range selector */}
      <div className="flex items-center gap-1.5">
        {RANGE_OPTIONS.map(({ label, days }) => (
          <button key={label} onClick={() => setRange(days)}
            className="px-3 py-1 rounded-sm text-[9px] tracking-[0.15em] transition-colors"
            style={{
              background: range === days ? '#2A1E0A' : 'transparent',
              color: range === days ? AMBER : DIM,
              border: `1px solid ${range === days ? AMBER + '40' : '#2A2018'}`,
            }}>
            {label}
          </button>
        ))}
        <span className="font-mono text-[8px] ml-auto" style={{ color: '#3A2A14' }}>
          {filtered.length} session{filtered.length !== 1 ? 's' : ''} in range
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: AMBER }} />
        </div>
      ) : (
        <>
          {/* KPI strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {[
              { label: 'TOTAL SALVAGED',   value: `${grandTotal.toLocaleString()} SCU`, color: AMBER },
              { label: 'HULLS SCRAPED',    value: totalHulls.toString(),                color: TEAL },
              { label: 'ACTIVE SESSIONS',  value: activeSess.toString(),                color: '#C8893B' },
              { label: 'SESSIONS LOGGED',  value: filtered.length.toString(),           color: BLUE },
            ].map(({ label, value, color }, i) => (
              <motion.div key={label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="border p-3 relative overflow-hidden" style={PANEL}>
                <svg className="absolute top-0 right-0 w-5 h-5 opacity-25" viewBox="0 0 20 20">
                  <path d="M20 0 L20 20 L0 0 Z" fill={color} />
                </svg>
                <div className="text-[8px] tracking-[0.18em] mb-1" style={{ color: DIM }}>{label}</div>
                <div className="text-xl font-bold" style={{ color }}>{value}</div>
              </motion.div>
            ))}
          </div>

          {/* Stock over time chart */}
          <SalvageStockChart sessions={filtered} />

          {/* Commodity breakdown bars */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
            className="border p-4 space-y-4" style={PANEL}>
            <div className="text-[9px] tracking-[0.25em] pb-1 border-b" style={{ color: DIM, borderColor: '#2A2118' }}>
              COMMODITY BREAKDOWN — SCU HARVESTED
            </div>
            {totals.map((c, i) => (
              <CommodityBar key={c.key} {...c} max={maxValue} delay={0.2 + i * 0.1} />
            ))}

            {/* Distribution donut-style split bar */}
            {grandTotal > 0 && (
              <div className="pt-2 space-y-1">
                <div className="text-[8px] tracking-[0.18em]" style={{ color: DIM }}>DISTRIBUTION</div>
                <div className="flex h-2 rounded-sm overflow-hidden gap-px">
                  {totals.map(({ key, color, value }) => (
                    <motion.div key={key}
                      style={{ background: color, flex: value }}
                      initial={{ flex: 0 }}
                      animate={{ flex: value || 0.001 }}
                      transition={{ duration: 0.6, delay: 0.4 }}
                    />
                  ))}
                </div>
                <div className="flex gap-4">
                  {totals.map(({ label, color, value }) => (
                    <div key={label} className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-sm" style={{ background: color }} />
                      <span className="font-mono text-[8px]" style={{ color: DIM }}>
                        {label} {grandTotal > 0 ? Math.round((value / grandTotal) * 100) : 0}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Active sessions */}
          {activeSessions.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[9px] tracking-[0.2em]" style={{ color: AMBER }}>▸ ACTIVE SESSIONS</div>
              {activeSessions.map(s => <SessionRow key={s.id} session={s} />)}
            </div>
          )}

          {/* Recent completed */}
          {completedSessions.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[9px] tracking-[0.2em]" style={{ color: DIM }}>◻ RECENT COMPLETED</div>
              {completedSessions.map(s => <SessionRow key={s.id} session={s} />)}
            </div>
          )}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <div className="text-2xl" style={{ color: '#2A1E0A' }}>◈</div>
              <p className="font-mono text-[10px] tracking-[0.2em]" style={{ color: '#3A2A14' }}>NO SESSIONS IN RANGE</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}