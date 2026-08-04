import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

/** Horizontal section tabs within a console group, plus any outbound links the group carries. */
export default function ConsoleSectionTabs({ group, active, onChange }) {
  return (
    <div className="shrink-0 border-b flex flex-wrap items-center" style={{ borderColor: '#2A2118', background: '#0A0806' }}>
      {group.sections.map((s) => {
        const isActive = active === s.id;
        return (
          <button
            key={s.id}
            onClick={() => onChange(s.id)}
            className="relative flex items-center gap-1.5 px-4 py-2.5 text-[9px] font-mono tracking-[0.15em] whitespace-nowrap transition-colors"
            style={{ color: isActive ? '#E0A22E' : '#7A6E60' }}
          >
            <span style={{ color: isActive ? '#E0A22E' : '#3A3028' }}>{s.glyph}</span>
            {s.label}
            {isActive && (
              <motion.div
                layoutId="console-section-underline"
                className="absolute bottom-0 left-0 right-0 h-0.5"
                style={{ background: '#E0A22E' }}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              />
            )}
          </button>
        );
      })}
      <div className="ml-auto flex items-center">
        {(group.links || []).map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="px-4 py-2.5 text-[9px] font-mono tracking-[0.15em] whitespace-nowrap hover:brightness-125"
            style={{ color: '#8A8F45' }}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}