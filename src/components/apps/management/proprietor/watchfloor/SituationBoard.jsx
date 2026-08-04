import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';

const TONE = {
  critical: { bar: '#C05050', text: '#D08A6A', bg: 'linear-gradient(90deg,rgba(192,80,80,.10),transparent 70%)', rule: '#5C302A' },
  warning: { bar: '#C8893B', text: '#E0A22E', bg: 'linear-gradient(90deg,rgba(224,162,46,.09),transparent 70%)', rule: '#4A3A1E' },
  notice: { bar: '#5F6B33', text: '#8A8F45', bg: 'linear-gradient(90deg,rgba(138,143,69,.07),transparent 70%)', rule: '#2E3320' },
};

const NOTCH = 'polygon(0 7px, 7px 0, 100% 0, 100% calc(100% - 7px), calc(100% - 7px) 100%, 0 100%)';

/** What is actually waiting on a decision, loudest first. Each row is a door to the work. */
export default function SituationBoard({ signals, onGo, activeStage }) {
  const worst = signals[0]?.severity;
  return (
    <div className="relative flex flex-col h-full min-h-0" style={{ clipPath: NOTCH, background: '#090705', boxShadow: 'inset 0 0 0 1px #2E2519' }}>
      {/* hazard cap */}
      <div className="h-[3px] shrink-0" style={{ background: worst === 'critical' ? 'repeating-linear-gradient(45deg,#5C302A 0 5px,#160B08 5px 10px)' : 'repeating-linear-gradient(45deg,#3F3018 0 5px,#120D08 5px 10px)' }} />
      <div className="flex items-center gap-2 px-3 py-2 shrink-0" style={{ background: 'linear-gradient(180deg,#171009,#0D0A07)', boxShadow: 'inset 0 -1px 0 #241C14' }}>
        <span className="text-[9px]" style={{ color: '#E0A22E' }}>◬</span>
        <span className="text-[8px] font-bold tracking-[0.28em]" style={{ color: '#EDE5D6' }}>SITUATION</span>
        <span className="ml-auto text-[7px] tabular-nums tracking-[0.2em]" style={{ color: '#5F564A' }}>{String(signals.length).padStart(2, '0')} OPEN</span>
      </div>

      <div className="flex-1 min-h-0 overflow-auto p-1.5 space-y-1">
        {signals.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 py-10">
            <div className="w-8 h-8 flex items-center justify-center" style={{ boxShadow: 'inset 0 0 0 1px #2E3320' }}>
              <Check className="w-4 h-4" style={{ color: '#5F6B33' }} />
            </div>
            <p className="text-[8px] tracking-[0.18em] text-center px-5" style={{ color: '#5F564A' }}>NOTHING WAITING · THE DECK IS SQUARE</p>
          </div>
        ) : signals.map((s, i) => {
          const t = TONE[s.severity];
          const on = s.stage === activeStage;
          return (
            <motion.button
              key={s.id}
              onClick={() => onGo(s.stage)}
              whileHover={{ x: 2 }}
              whileTap={{ x: 0 }}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="relative w-full text-left flex items-stretch gap-2 pr-2 overflow-hidden"
              style={{ background: t.bg, boxShadow: `inset 0 0 0 1px ${on ? '#5C4424' : t.rule}` }}
            >
              <div className="w-[3px] shrink-0" style={{ background: t.bar, boxShadow: `0 0 8px ${t.bar}66` }} />
              <div className="py-1.5 min-w-0 flex-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[17px] font-bold leading-none tabular-nums" style={{ color: t.text, textShadow: `0 0 12px ${t.bar}55` }}>{s.count}</span>
                  <span className="text-[8px] font-bold tracking-[0.16em] truncate" style={{ color: '#EDE5D6' }}>{s.label}</span>
                </div>
                <p className="text-[8px] leading-snug mt-0.5 pr-1" style={{ color: '#7A6E60' }}>{s.detail}</p>
              </div>
              <ArrowRight className="w-3 h-3 self-center shrink-0" style={{ color: on ? '#E0A22E' : '#4A4136' }} />
            </motion.button>
          );
        })}
      </div>

      <div className="shrink-0 px-3 py-1 text-[7px] tracking-[0.2em] flex items-center gap-2" style={{ color: '#4A4136', boxShadow: 'inset 0 1px 0 #241C14' }}>
        <span style={{ color: '#C05050' }}>■</span> URGENT
        <span style={{ color: '#C8893B' }}>■</span> DUE
        <span style={{ color: '#5F6B33' }}>■</span> NOTED
      </div>
    </div>
  );
}