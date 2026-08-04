import React from 'react';
import { motion } from 'framer-motion';

/** Vertical group rail — the five rooms of the console, storefront-rail style. */
export default function ConsoleGroupRail({ groups, active, onChange }) {
  return (
    <nav
      className="shrink-0 w-[58px] border-r flex flex-col items-stretch py-2 gap-1"
      style={{ borderColor: '#2A2118', background: 'linear-gradient(180deg, #0C0906, #080604)' }}
    >
      {groups.map((g) => {
        const Icon = g.icon;
        const isActive = active === g.id;
        return (
          <button
            key={g.id}
            onClick={() => onChange(g.id)}
            title={g.blurb}
            className="relative flex flex-col items-center gap-1 py-2.5 mx-1 transition-colors"
            style={{ color: isActive ? '#E0A22E' : '#6B6155' }}
          >
            {isActive && (
              <motion.div
                layoutId="console-group-active"
                className="absolute inset-0"
                style={{ background: 'rgba(224,162,46,0.08)', border: '1px solid #5C4424' }}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              />
            )}
            <Icon className="w-4 h-4 relative" />
            <span className="relative text-[7px] font-mono font-bold tracking-[0.14em]">{g.label}</span>
          </button>
        );
      })}
    </nav>
  );
}