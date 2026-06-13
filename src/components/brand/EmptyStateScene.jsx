import React from 'react';
import { motion } from 'framer-motion';

const AMBER = '#E0A22E';
const TEAL  = '#6FA08F';
const DIM   = '#3A3028';

// Reusable animated empty-state scenes with CTA
export function EmptyOrders({ onAction, actionLabel = 'PLACE FIRST ORDER' }) {
  return (
    <EmptyBase
      title="NO ORDERS ON FILE"
      subtitle="The order queue is clear — no active manifests."
      cta={actionLabel}
      onAction={onAction}
      color={TEAL}
    >
      <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
        <rect x="20" y="20" width="80" height="50" rx="2" stroke={DIM} strokeWidth="1.5"/>
        <path d="M35 35H85M35 45H70M35 55H60" stroke={DIM} strokeWidth="1.2"/>
        <motion.rect x="20" y="20" width="80" height="3" fill={TEAL} opacity={0.4}
          animate={{ opacity: [0.2, 0.6, 0.2] }} transition={{ duration: 2.5, repeat: Infinity }}/>
      </svg>
    </EmptyBase>
  );
}

export function EmptyWorkOrders({ onAction }) {
  return (
    <EmptyBase title="NO OPEN WORK ORDERS" subtitle="All ops are settled — the board is clear." cta="CREATE WORK ORDER" onAction={onAction} color={AMBER}>
      <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
        <circle cx="60" cy="40" r="28" stroke={DIM} strokeWidth="1.5"/>
        <path d="M45 40L56 51L75 30" stroke={DIM} strokeWidth="1.5" strokeLinecap="round"/>
        <motion.circle cx="60" cy="40" r="28" stroke={AMBER} strokeWidth="1" strokeDasharray="4 8"
          animate={{ rotate: 360 }} transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '60px 40px' }}/>
      </svg>
    </EmptyBase>
  );
}

export function EmptyLoot({ onAction }) {
  return (
    <EmptyBase title="MANIFEST EMPTY" subtitle="No items recovered yet — go loot something." cta="LOG ITEM" onAction={onAction} color={AMBER}>
      <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
        <path d="M60 15L85 30V55L60 70L35 55V30Z" stroke={DIM} strokeWidth="1.5"/>
        <path d="M60 15L60 70M35 30L85 30M35 55L85 55" stroke={DIM} strokeWidth="0.8" strokeDasharray="3 3"/>
        <motion.path d="M60 15L85 30V55L60 70L35 55V30Z" stroke={AMBER} strokeWidth="0.8" opacity={0.4}
          animate={{ opacity: [0.2, 0.6, 0.2] }} transition={{ duration: 3, repeat: Infinity }}/>
      </svg>
    </EmptyBase>
  );
}

export function EmptyCargo({ onAction }) {
  return (
    <EmptyBase title="NO CARGO LOTS" subtitle="Haul bay is empty — add your first lot." cta="ADD LOT" onAction={onAction} color={TEAL}>
      <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
        <rect x="25" y="30" width="70" height="30" rx="2" stroke={DIM} strokeWidth="1.5"/>
        <rect x="40" y="15" width="40" height="15" rx="2" stroke={DIM} strokeWidth="1.2"/>
        <path d="M25 55L15 65M95 55L105 65" stroke={DIM} strokeWidth="1.2"/>
        <motion.rect x="25" y="30" width="70" height="4" fill={TEAL} opacity={0.3}
          animate={{ opacity: [0.15, 0.5, 0.15] }} transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}/>
      </svg>
    </EmptyBase>
  );
}

export function EmptyLog() {
  return (
    <EmptyBase title="NO LOG ENTRIES" subtitle="The ops log is clean — actions will appear here." color={DIM}>
      <svg width="120" height="80" viewBox="0 0 120 80" fill="none">
        <path d="M30 20H90V65H30Z" stroke={DIM} strokeWidth="1.5" fill="none"/>
        <path d="M42 33H78M42 42H70M42 51H60" stroke={DIM} strokeWidth="1.2" strokeLinecap="round"/>
        <motion.line x1="30" y1="20" x2="30" y2="65" stroke={AMBER} strokeWidth="2" opacity={0.4}
          animate={{ opacity: [0.2, 0.7, 0.2] }} transition={{ duration: 2, repeat: Infinity }}/>
      </svg>
    </EmptyBase>
  );
}

function EmptyBase({ title, subtitle, cta, onAction, color = DIM, children }) {
  return (
    <div className="flex flex-col items-center gap-3 py-10 font-mono">
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
      <div className="text-center space-y-1">
        <div className="text-[11px] font-bold tracking-[0.2em]" style={{ color }}>{title}</div>
        <div className="text-[10px]" style={{ color: '#5A5042' }}>{subtitle}</div>
      </div>
      {cta && onAction && (
        <button
          onClick={onAction}
          className="mt-1 px-4 py-1.5 text-[10px] tracking-[0.15em] font-bold border transition-all"
          style={{ borderColor: `${color}55`, color, background: `${color}0D` }}
          onMouseEnter={e => { e.currentTarget.style.background = `${color}1A`; }}
          onMouseLeave={e => { e.currentTarget.style.background = `${color}0D`; }}
        >
          {cta}
        </button>
      )}
    </div>
  );
}