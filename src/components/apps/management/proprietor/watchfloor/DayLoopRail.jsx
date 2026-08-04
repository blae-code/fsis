import React from 'react';
import { motion } from 'framer-motion';

const notch = (n) => ({ clipPath: `polygon(${n}px 0, 100% 0, 100% calc(100% - ${n}px), calc(100% - ${n}px) 100%, 0 100%, 0 ${n}px)` });

/** The working day as a track: intake → appraise → list → fulfil → hand off → close out. */
export default function DayLoopRail({ stages, active, onSelect, counts }) {
  return (
    <div className="flex items-stretch gap-1 overflow-x-auto shrink-0">
      {stages.map((s, i) => {
        const on = s.id === active;
        const n = counts[s.id] || 0;
        return (
          <React.Fragment key={s.id}>
            {i > 0 && <div className="self-center text-[9px] px-0.5" style={{ color: '#3A2F20' }}>›</div>}
            <motion.button
              onClick={() => onSelect(s.id)}
              whileHover={{ y: -1 }}
              className="relative flex-1 min-w-[92px] border px-2 py-1.5 text-left"
              style={{
                ...notch(6),
                borderColor: on ? '#C8893B' : '#2A2118',
                background: on ? 'linear-gradient(180deg,#1B1309,#100C07)' : '#0B0906',
              }}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px]" style={{ color: on ? '#E0A22E' : '#5F564A' }}>{s.glyph}</span>
                {n > 0 && (
                  <span className="px-1 text-[8px] font-bold" style={{ background: s.tone === 'hot' ? '#3A1410' : '#241C10', color: s.tone === 'hot' ? '#D08A6A' : '#E0A22E' }}>{n}</span>
                )}
              </div>
              <div className="text-[8px] font-bold tracking-[0.16em] mt-0.5 truncate" style={{ color: on ? '#EDE5D6' : '#7A6E60' }}>{s.label}</div>
              {on && <motion.div layoutId="dayloop-underline" className="absolute left-0 right-0 bottom-0 h-[2px]" style={{ background: '#E0A22E' }} />}
            </motion.button>
          </React.Fragment>
        );
      })}
    </div>
  );
}