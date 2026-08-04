import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export const SIGNAL_TONE = {
  critical: { bar: '#C05050', text: '#D08A6A', bg: 'linear-gradient(90deg,rgba(192,80,80,.10),transparent 70%)', rule: '#5C302A' },
  warning: { bar: '#C8893B', text: '#E0A22E', bg: 'linear-gradient(90deg,rgba(224,162,46,.09),transparent 70%)', rule: '#4A3A1E' },
  notice: { bar: '#5F6B33', text: '#8A8F45', bg: 'linear-gradient(90deg,rgba(138,143,69,.07),transparent 70%)', rule: '#2E3320' },
};

/** A stamped ticket: a number that matters, what it is, and the door through to the work. */
export default function DeckSignalRow({ severity = 'notice', count, label, detail, active, delay = 0, onClick }) {
  const t = SIGNAL_TONE[severity] || SIGNAL_TONE.notice;
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 2 }}
      whileTap={{ x: 0 }}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="relative w-full text-left flex items-stretch gap-2 pr-2 overflow-hidden"
      style={{ background: t.bg, boxShadow: `inset 0 0 0 1px ${active ? '#5C4424' : t.rule}` }}
    >
      <div className="w-[3px] shrink-0" style={{ background: t.bar, boxShadow: `0 0 8px ${t.bar}66` }} />
      <div className="py-1.5 min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[17px] font-bold leading-none tabular-nums" style={{ color: t.text, textShadow: `0 0 12px ${t.bar}55` }}>{count}</span>
          <span className="text-[8px] font-bold tracking-[0.16em] truncate" style={{ color: '#EDE5D6' }}>{label}</span>
        </div>
        {detail && <p className="text-[8px] leading-snug mt-0.5 pr-1" style={{ color: '#7A6E60' }}>{detail}</p>}
      </div>
      <ArrowRight className="w-3 h-3 self-center shrink-0" style={{ color: active ? '#E0A22E' : '#4A4136' }} />
    </motion.button>
  );
}