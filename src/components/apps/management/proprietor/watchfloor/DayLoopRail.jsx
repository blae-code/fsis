import React from 'react';
import { motion } from 'framer-motion';

/** Chevron plate — the day reads left to right like a stamped process line. */
const CHEV = 'polygon(0 0, calc(100% - 9px) 0, 100% 50%, calc(100% - 9px) 100%, 0 100%, 9px 50%)';
const HEAD = 'polygon(0 0, calc(100% - 9px) 0, 100% 50%, calc(100% - 9px) 100%, 0 100%)';

/** The working day as a track: intake → appraise → list → fulfil → hand off → close out. */
export default function DayLoopRail({ stages, active, onSelect, counts }) {
  const activeIndex = stages.findIndex((s) => s.id === active);
  return (
    <div className="shrink-0">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[7px] tracking-[0.34em]" style={{ color: '#4A4136' }}>THE WORKING DAY</span>
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg,#2A2118,transparent)' }} />
        <span className="text-[7px] tracking-[0.24em]" style={{ color: '#4A4136' }}>
          {String(activeIndex + 1).padStart(2, '0')} / {String(stages.length).padStart(2, '0')}
        </span>
      </div>

      <div className="flex items-stretch overflow-x-auto">
        {stages.map((s, i) => {
          const on = s.id === active;
          const passed = i < activeIndex;
          const n = counts[s.id] || 0;
          const hot = s.tone === 'hot' && n > 0;
          return (
            <motion.button
              key={s.id}
              onClick={() => onSelect(s.id)}
              whileHover={{ y: -1 }}
              whileTap={{ y: 0 }}
              className="relative flex-1 min-w-[104px] text-left pl-4 pr-3 py-2 -ml-[7px] first:ml-0 first:pl-3"
              style={{
                clipPath: i === 0 ? HEAD : CHEV,
                zIndex: stages.length - i,
                background: on
                  ? 'linear-gradient(160deg,#241708 0%,#160F08 55%,#0E0A06 100%)'
                  : passed ? '#0E0B07' : '#0A0806',
                boxShadow: on ? 'inset 0 0 0 1px #C8893B, inset 0 14px 22px -14px rgba(224,162,46,.55)' : 'inset 0 0 0 1px #241C14',
              }}
            >
              {/* etched plate texture */}
              <div className="pointer-events-none absolute inset-0 opacity-[0.16]" style={{ background: 'repeating-linear-gradient(180deg,rgba(255,220,160,.10) 0 1px,transparent 1px 3px)' }} />

              <div className="relative flex items-center gap-1.5">
                <span className="text-[7px] tabular-nums" style={{ color: on ? '#C8893B' : '#3F382E' }}>{String(i + 1).padStart(2, '0')}</span>
                <span className="text-[10px] leading-none" style={{ color: on ? '#E0A22E' : passed ? '#6B6155' : '#4A4136', filter: on ? 'drop-shadow(0 0 6px rgba(224,162,46,.55))' : 'none' }}>{s.glyph}</span>
                {n > 0 && (
                  <span
                    className="ml-auto px-1 text-[8px] font-bold tabular-nums leading-[14px]"
                    style={{
                      background: hot ? 'rgba(192,80,80,.16)' : 'rgba(224,162,46,.12)',
                      color: hot ? '#D08A6A' : '#E0A22E',
                      boxShadow: `inset 0 0 0 1px ${hot ? '#5C302A' : '#3F3018'}`,
                    }}
                  >
                    {n}
                  </span>
                )}
              </div>
              <div
                className="relative text-[8px] font-bold tracking-[0.2em] mt-1 truncate"
                style={{ color: on ? '#F0E7D6' : passed ? '#7A6E60' : '#5F564A', textShadow: on ? '0 0 10px rgba(224,162,46,.35)' : 'none' }}
              >
                {s.label}
              </div>

              {on && (
                <motion.div
                  layoutId="dayloop-lit"
                  className="absolute left-3 right-4 bottom-1 h-[2px]"
                  style={{ background: 'linear-gradient(90deg,#E0A22E,rgba(224,162,46,0))' }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
      <div className="h-px mt-1" style={{ background: 'linear-gradient(90deg,#3A2F20,#1A140E 60%,transparent)' }} />
    </div>
  );
}