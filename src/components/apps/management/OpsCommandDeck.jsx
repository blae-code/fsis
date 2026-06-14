import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SalvageTelemetry from '@/components/apps/management/ops/SalvageTelemetry';
import HullMaterialPredictor from '@/components/apps/management/ops/HullMaterialPredictor';
import HaulStrategyMapper from '@/components/apps/management/ops/HaulStrategyMapper';
import MicroExpenseLogger from '@/components/apps/management/ops/MicroExpenseLogger';
import LootRapidSort from '@/components/apps/management/ops/LootRapidSort';

const AMBER = '#E0A22E';
const TEAL  = '#5F9A8C';
const DIM   = '#7A6E60';

const TOOLS = [
  { id: 'telemetry', label: 'TELEMETRY',  glyph: '◉', color: AMBER,  desc: 'Live session pulse — hull, hold & phase tracking' },
  { id: 'hull',      label: 'HULL PRED',  glyph: '⬡', color: TEAL,   desc: 'Predict RMC/CMR/CMS yield by ship type' },
  { id: 'haul',      label: 'HAUL MAP',   glyph: '▸', color: '#6FA0C8', desc: 'Best terminal for your current loadout' },
  { id: 'expense',   label: 'EXPENSE',    glyph: '◆', color: '#C05050', desc: 'One-tap mid-run expense logging' },
  { id: 'loot',      label: 'LOOT SORT',  glyph: '✦', color: '#9B6FC0', desc: 'Rapid-queue looted gear & components' },
];

export default function OpsCommandDeck() {
  const [activeTool, setActiveTool] = useState('telemetry');
  const active = TOOLS.find(t => t.id === activeTool);

  return (
    <div className="h-full flex flex-col font-mono" style={{ background: '#080604' }}>
      {/* Header */}
      <div className="shrink-0 px-4 py-2.5 border-b flex items-center gap-3" style={{ borderColor: '#2A2118', background: '#0A0806' }}>
        <span className="animate-pulse-glow" style={{ color: AMBER }}>◈</span>
        <div>
          <div className="text-[9px] tracking-[0.25em]" style={{ color: AMBER }}>OPS COMMAND DECK</div>
          <div className="text-[8px]" style={{ color: DIM }}>ACTIVE: {active?.desc}</div>
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: AMBER }} />
          <span className="text-[8px]" style={{ color: DIM }}>IN-OP</span>
        </div>
      </div>

      {/* Tool selector rail */}
      <div className="shrink-0 border-b flex" style={{ borderColor: '#2A2118' }}>
        {TOOLS.map(t => {
          const isActive = activeTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTool(t.id)}
              className="relative flex flex-col items-center gap-0.5 px-3 py-2.5 text-[8px] tracking-[0.12em] flex-1 transition-colors"
              style={{ color: isActive ? t.color : DIM }}
            >
              <span className="text-[11px]" style={{ color: isActive ? t.color : '#3A3028' }}>{t.glyph}</span>
              {t.label}
              {isActive && (
                <motion.div
                  layoutId="ops-tool-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ background: t.color }}
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tool content */}
      <div className="flex-1 overflow-auto">
        {activeTool === 'telemetry' && <SalvageTelemetry />}
        {activeTool === 'hull'      && <HullMaterialPredictor />}
        {activeTool === 'haul'      && <HaulStrategyMapper />}
        {activeTool === 'expense'   && <MicroExpenseLogger />}
        {activeTool === 'loot'      && <LootRapidSort />}
      </div>
    </div>
  );
}