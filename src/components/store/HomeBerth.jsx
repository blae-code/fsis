import React from 'react';
import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import { HOME_BERTH } from '@/lib/fsisLore';

/**
 * The berth file — where FSIS actually stands. A salvage outfit is its floor space
 * before it is anything else, and every ETA and handoff on this app is reckoned from here.
 */
export default function HomeBerth() {
  const b = HOME_BERTH;
  return (
    <section
      className="border p-5 space-y-4 relative overflow-hidden font-mono"
      style={{ borderColor: '#5C4424', background: 'linear-gradient(135deg,#14110D,#0C0A07)', clipPath: 'polygon(14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%,0 14px)' }}
    >
      <div className="absolute right-4 top-3 text-[46px] leading-none opacity-[0.08] font-bold" style={{ color: '#E0A22E' }}>HUR</div>

      <div className="relative">
        <p className="text-[9px] tracking-[0.3em]" style={{ color: '#8A8F45' }}>// BERTH FILE</p>
        <h2 className="text-lg font-bold tracking-[0.14em] flex items-center gap-2" style={{ color: '#EDE5D6' }}>
          <MapPin className="w-4 h-4" style={{ color: '#E0A22E' }} />
          {b.city.toUpperCase()}, {b.planet.toUpperCase()}
        </h2>
        <p className="text-[10px] mt-0.5" style={{ color: '#8A7E6C' }}>{b.system} System • {b.berth}</p>
      </div>

      <p className="text-[10px] leading-relaxed max-w-2xl" style={{ color: '#B8AC9A' }}>{b.summary}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {b.landmarks.map((l) => (
          <motion.div
            key={l.name}
            whileHover={{ y: -2, borderColor: '#5C4424' }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className="border p-3"
            style={{ borderColor: '#2A2118', background: '#0E0C09' }}
          >
            <div className="text-[10px] font-bold tracking-[0.12em]" style={{ color: '#E0A22E' }}>{l.name}</div>
            <p className="text-[9px] mt-1 leading-relaxed" style={{ color: '#9C9080' }}>{l.note}</p>
          </motion.div>
        ))}
      </div>

      <div className="border p-3 max-w-2xl space-y-1.5" style={{ borderColor: '#3A2F20', background: '#0E0C09' }}>
        <h4 className="text-[10px] tracking-[0.25em]" style={{ color: '#8A7E6C' }}>// STANDING ON THE PLANET</h4>
        <div className="flex gap-3 text-[10px]"><span className="w-24 shrink-0" style={{ color: '#C8A05B' }}>AUTHORITY</span><span style={{ color: '#9C9080' }}>{b.authority}</span></div>
        <div className="flex gap-3 text-[10px]"><span className="w-24 shrink-0" style={{ color: '#C8A05B' }}>DISTRICT</span><span style={{ color: '#9C9080' }}>{b.district}</span></div>
        <p className="text-[9px] leading-relaxed pt-1" style={{ color: '#8A7E6C' }}>{b.reason}</p>
      </div>

      <p className="text-[9px] leading-relaxed max-w-2xl" style={{ color: '#8A8F45' }}>{b.handoffNote}</p>
    </section>
  );
}