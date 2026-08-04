import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, Check } from 'lucide-react';

const TONE = {
  critical: { bar: '#C05050', text: '#D08A6A', bg: '#150B08' },
  warning: { bar: '#C8893B', text: '#E0A22E', bg: '#150F08' },
  notice: { bar: '#5F6B33', text: '#8A8F45', bg: '#0D0F09' },
};

/** What is actually waiting on a decision, loudest first. Each row is a door to the work. */
export default function SituationBoard({ signals, onGo, activeStage }) {
  return (
    <div className="flex flex-col h-full min-h-0 border" style={{ borderColor: '#3A2F20', background: '#0A0806' }}>
      <div className="flex items-center gap-2 px-3 py-2 border-b shrink-0" style={{ borderColor: '#241C14', background: '#120D08' }}>
        <AlertTriangle className="w-3 h-3" style={{ color: '#E0A22E' }} />
        <span className="text-[9px] font-bold tracking-[0.24em]" style={{ color: '#EDE5D6' }}>SITUATION BOARD</span>
        <span className="ml-auto text-[8px]" style={{ color: '#5F564A' }}>{signals.length} OPEN</span>
      </div>
      <div className="flex-1 min-h-0 overflow-auto p-2 space-y-1.5">
        {signals.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 py-10">
            <Check className="w-5 h-5" style={{ color: '#5F6B33' }} />
            <p className="text-[9px] text-center px-4" style={{ color: '#6B6155' }}>Nothing is waiting on you. The deck is square.</p>
          </div>
        ) : signals.map((s) => {
          const t = TONE[s.severity];
          const on = s.stage === activeStage;
          return (
            <motion.button
              key={s.id}
              onClick={() => onGo(s.stage)}
              whileHover={{ x: 2 }}
              className="w-full text-left flex items-stretch gap-2 border pr-2"
              style={{ borderColor: on ? '#5C4424' : '#241C14', background: t.bg }}
            >
              <div className="w-[3px] shrink-0" style={{ background: t.bar }} />
              <div className="py-1.5 min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-bold leading-none" style={{ color: t.text }}>{s.count}</span>
                  <span className="text-[8px] font-bold tracking-[0.16em] truncate" style={{ color: '#EDE5D6' }}>{s.label}</span>
                </div>
                <p className="text-[8px] leading-snug mt-0.5" style={{ color: '#7A6E60' }}>{s.detail}</p>
              </div>
              <ArrowRight className="w-3 h-3 self-center shrink-0" style={{ color: '#5F564A' }} />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}