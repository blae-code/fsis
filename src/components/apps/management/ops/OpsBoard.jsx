import React from 'react';
import { Check } from 'lucide-react';
import DeckPanel from '@/components/console/deck/DeckPanel';
import DeckSignalRow from '@/components/console/deck/DeckSignalRow';

/** What the deck owes the run: short crews, overloaded hulls, holds still full. */
export default function OpsBoard({ signals, onGo, activeStage }) {
  const worst = signals[0]?.severity === 'critical';
  return (
    <DeckPanel
      glyph="◬"
      title="THE RUN"
      meta={`${String(signals.length).padStart(2, '0')} OPEN`}
      notch="br"
      capTop
      hot={worst}
      footer={
        <div className="text-[7px] tracking-[0.2em] flex items-center gap-2" style={{ color: '#4A4136' }}>
          <span style={{ color: '#C05050' }}>■</span> BLOCKING
          <span style={{ color: '#C8893B' }}>■</span> AFLOAT
          <span style={{ color: '#5F6B33' }}>■</span> AHEAD
        </div>
      }
    >
      <div className="p-1.5 space-y-1">
        {signals.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 py-12">
            <div className="w-8 h-8 flex items-center justify-center" style={{ boxShadow: 'inset 0 0 0 1px #2E3320' }}>
              <Check className="w-4 h-4" style={{ color: '#5F6B33' }} />
            </div>
            <p className="text-[8px] tracking-[0.18em] text-center px-5" style={{ color: '#5F564A' }}>NOTHING AFLOAT · THE DECK IS CLEAR</p>
          </div>
        ) : signals.map((s, i) => (
          <DeckSignalRow
            key={s.id}
            severity={s.severity}
            count={s.count}
            label={s.label}
            detail={s.detail}
            active={s.stage === activeStage}
            delay={i * 0.02}
            onClick={() => onGo(s.stage)}
          />
        ))}
      </div>
    </DeckPanel>
  );
}