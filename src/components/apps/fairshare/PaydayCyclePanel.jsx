import React from 'react';
import { motion } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';

const AMBER  = '#E0A22E';
const TEAL   = '#6FA08F';
const DIM    = '#7A6E60';
const DIMMER = '#3A3028';
const PANEL  = { background: '#0E0C09', borderColor: '#2A2118' };

/** Shared cycle report card used by both management and contractor views */
export function CycleReport({ cycle }) {
  const paidOut = cycle.total_paid_auec || 0;
  const pool    = cycle.pool_auec || 0;
  const pct     = pool > 0 ? Math.round((paidOut / pool) * 100) : 0;

  return (
    <div className="border overflow-hidden" style={{ ...PANEL, borderColor: '#2A3028' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: '#2A3028' }}>
        <span className="text-[10px] font-mono" style={{ color: '#D8CFC0' }}>
          {cycle.cycle_name}
          {cycle.force_closed && <span className="ml-2 text-[8px]" style={{ color: DIM }}>CLOSED EARLY</span>}
        </span>
        <span className="text-[9px] font-mono" style={{ color: DIM }}>
          {cycle.published_at ? format(new Date(cycle.published_at), 'MMM d HH:mm') : ''}
        </span>
      </div>

      {/* Pool bar */}
      <div className="px-3 py-2">
        <div className="flex justify-between text-[8px] mb-1" style={{ color: DIM }}>
          <span>POOL: <span style={{ color: AMBER }}>{pool.toLocaleString()} aUEC</span></span>
          <span>{Math.round(cycle.share_value_auec || 0).toLocaleString()} aUEC/share</span>
        </div>
        <div className="h-1 w-full" style={{ background: DIMMER }}>
          <motion.div
            initial={{ width: 0 }} animate={{ width: `${pct}%` }}
            className="h-full" style={{ background: AMBER }}
          />
        </div>
        <div className="text-[8px] mt-0.5" style={{ color: DIM }}>
          {paidOut.toLocaleString()} paid ({pct}%) · {cycle.deferred_shares || 0} deferred
        </div>
      </div>

      {/* Per-crew rows */}
      {(cycle.report || []).map((r) => (
        <div key={r.handle} className="flex justify-between items-center px-3 py-1.5 border-t text-[10px] font-mono"
          style={{ borderColor: DIMMER }}>
          <span style={{ color: '#D8CFC0' }}>
            {r.handle} <span style={{ color: DIM }}>— {r.shares} sh</span>
          </span>
          <span style={{ color: r.decision === 'cash_in' ? AMBER : DIM }}>
            {r.decision === 'cash_in'
              ? `CASHED → ${(r.payout_auec || 0).toLocaleString()} aUEC`
              : 'DEFERRED — rolls over'}
          </span>
        </div>
      ))}
    </div>
  );
}

/** The 72-hour countdown ring */
export function CycleCountdown({ cycle }) {
  const now      = new Date();
  const opens    = new Date(cycle.opens_at);
  const closes   = new Date(cycle.closes_at);
  const total    = closes - opens;
  const elapsed  = Math.max(0, Math.min(now - opens, total));
  const pct      = total > 0 ? (elapsed / total) * 100 : 0;
  const remaining = closes > now ? formatDistanceToNow(closes, { addSuffix: false }) : 'CLOSED';
  const isUrgent  = closes - now < 6 * 3600 * 1000; // < 6h

  const r = 22, circumference = 2 * Math.PI * r;
  const dash = circumference * (pct / 100);

  return (
    <div className="flex items-center gap-3 p-3 border" style={{ ...PANEL, borderColor: isUrgent ? '#C0505055' : '#2A2118' }}>
      {/* SVG ring */}
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke={DIMMER} strokeWidth="3" />
        <circle cx="28" cy="28" r={r} fill="none"
          stroke={isUrgent ? '#C05050' : AMBER}
          strokeWidth="3"
          strokeDasharray={`${dash} ${circumference - dash}`}
          strokeLinecap="butt"
          transform="rotate(-90 28 28)"
        />
        <text x="28" y="32" textAnchor="middle" fontSize="8" fontFamily="monospace"
          fill={isUrgent ? '#C05050' : AMBER}>
          {Math.round(100 - pct)}%
        </text>
      </svg>
      <div className="min-w-0">
        <div className="text-[8px] tracking-[0.18em]" style={{ color: DIM }}>DECISION WINDOW</div>
        <div className="text-sm font-bold font-mono" style={{ color: isUrgent ? '#C05050' : AMBER }}>
          {remaining.toUpperCase()}
        </div>
        <div className="text-[8px]" style={{ color: DIM }}>REMAINING · DEFAULT = DEFER</div>
      </div>
    </div>
  );
}