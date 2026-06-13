import React from 'react';
import { motion } from 'framer-motion';

const AMBER = '#E0A22E';
const TEAL  = '#6FA08F';
const DIM   = '#7A6E60';
const PANEL = { background: '#0E0C09', borderColor: '#2A2118' };

const ROLE_META = {
  salvage_operator: { label: 'SALVAGE OPERATOR', color: AMBER,  glyph: '⬡' },
  cargo_hauler:     { label: 'CARGO HAULER',     color: TEAL,   glyph: '▶' },
  management:       { label: 'MANAGEMENT',        color: '#6FA0C8', glyph: '◈' },
};

export default function ContractorStationHeader({ user, role, myShares, onRoleChange }) {
  const meta = ROLE_META[role] || null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
      className="border p-3 flex items-center justify-between gap-4"
      style={PANEL}
    >
      {/* Identity */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 border flex items-center justify-center shrink-0"
          style={{ borderColor: meta?.color || DIM, background: `${meta?.color || DIM}14` }}>
          <span className="text-sm font-mono font-bold" style={{ color: meta?.color || DIM }}>
            {meta?.glyph || '○'}
          </span>
        </div>
        <div className="min-w-0">
          <div className="text-xs font-mono font-bold truncate" style={{ color: '#D8CFC0' }}>
            {user?.full_name || 'OPERATOR'}
          </div>
          <div className="text-[9px] flex items-center gap-2" style={{ color: DIM }}>
            {meta ? (
              <span style={{ color: meta.color }}>{meta.label}</span>
            ) : (
              <span style={{ color: DIM }}>NO DUTY ROLE — SELECT BELOW</span>
            )}
            {myShares > 0 && (
              <>
                <span>·</span>
                <span style={{ color: AMBER }}>{myShares} SHARE{myShares !== 1 ? 'S' : ''} BANKED</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Role selector */}
      <div className="flex gap-1.5 shrink-0">
        {Object.entries(ROLE_META).map(([id, m]) => (
          <button
            key={id}
            onClick={() => onRoleChange(id)}
            className="text-[8px] px-2 py-1 border tracking-[0.1em] transition-all font-mono"
            style={{
              borderColor: role === id ? m.color : '#2A2118',
              background: role === id ? `${m.color}14` : 'transparent',
              color: role === id ? m.color : DIM,
            }}
          >
            {m.glyph} {m.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}