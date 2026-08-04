import React from 'react';
import { motion } from 'framer-motion';
import ConsoleExitLink from '@/components/console/ConsoleExitLink';

/** Vertical group rail — the five rooms of the console, storefront-rail style. */
export default function ConsoleGroupRail({ groups, active, onChange }) {
  return (
    <nav
      className="shrink-0 w-[62px] border-r flex flex-col items-stretch py-2 gap-1 relative"
      style={{ borderColor: '#2A2118', background: 'linear-gradient(180deg, #0C0906, #080604)' }}
    >
      <div className="absolute inset-y-0 right-0 w-px" style={{ background: 'linear-gradient(180deg, transparent, rgba(224,162,46,0.25), transparent)' }} />
      {groups.map((g, i) => {
        const Icon = g.icon;
        const isActive = active === g.id;
        return (
          <motion.button
            key={g.id}
            onClick={() => onChange(g.id)}
            title={`${g.blurb} (key ${i + 1})`}
            whileHover={{ backgroundColor: 'rgba(224,162,46,0.05)' }}
            className="relative flex flex-col items-center gap-1 py-3 mx-1 transition-colors"
            style={{ color: isActive ? '#E0A22E' : '#6B6155' }}
          >
            {isActive && (
              <motion.div
                layoutId="console-group-active"
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(160deg, rgba(224,162,46,0.12), rgba(138,100,48,0.05))',
                  border: '1px solid #5C4424',
                  clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                  boxShadow: 'inset 0 0 12px rgba(224,162,46,0.08)',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              />
            )}
            <Icon className="w-4 h-4 relative" />
            <span className="relative text-[7px] font-mono font-bold tracking-[0.14em]">{g.label}</span>
            <span className="relative text-[6px] font-mono" style={{ color: isActive ? '#8A8F45' : '#3A3028' }}>{i + 1}</span>
          </motion.button>
        );
      })}
      <ConsoleExitLink />
    </nav>
  );
}