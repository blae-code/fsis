import React from 'react';
import { FSIS } from '@/lib/fsisLore';
import { Layers } from 'lucide-react';

/** Thin console banner replacing the tall hero so the deck fits one viewport. */
export default function StoreHeroStrip({ onOpenIntel }) {
  return (
    <div
      className="shrink-0 flex items-center gap-3 px-3 py-2 border relative overflow-hidden"
      style={{
        borderColor: '#5C4424',
        background: 'linear-gradient(95deg, rgba(20,14,8,0.96), rgba(30,20,10,0.86) 45%, rgba(10,8,6,0.94))',
        clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
      }}
    >
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #E0A22E, transparent)' }} />
      <span className="hidden sm:inline font-mono text-[8px] tracking-[0.28em] px-2 py-1 border shrink-0" style={{ color: '#E0A22E', borderColor: '#8A6430', background: 'rgba(8,6,4,0.6)' }}>
        EST. {FSIS.founded} — STANTON
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="font-mono text-xs sm:text-sm font-bold tracking-[0.1em] truncate">
          <span style={{ color: '#F2EADC' }}>Honest salvage.</span> <span style={{ color: '#E0A22E' }}>Fair prices.</span>
        </h2>
        <p className="hidden md:block font-mono text-[9px] truncate" style={{ color: '#8A7E6C' }}>
          Reclaimed materials and fabricated goods, sourced and delivered across the 'verse by FSIS crews.
        </p>
      </div>
      <button
        onClick={onOpenIntel}
        className="shrink-0 inline-flex items-center gap-1.5 font-mono text-[9px] font-bold tracking-[0.14em] px-2.5 py-1.5 border hover:brightness-125 transition-all"
        style={{ borderColor: '#5C4424', color: '#C8A05B', background: '#100A04' }}
      >
        <Layers className="w-3 h-3" /> INTEL DECK
      </button>
    </div>
  );
}