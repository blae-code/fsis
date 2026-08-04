import React from 'react';
import { Check } from 'lucide-react';
import DeckPanel from '@/components/console/deck/DeckPanel';
import DeckSignalRow from '@/components/console/deck/DeckSignalRow';

/** The docket: who is waiting, how badly, and the door through to answering them. */
export default function DocketBoard({ docket, onGo, activeStage }) {
  const worst = docket[0]?.severity === 'critical';
  return (
    <DeckPanel
      glyph="⚖"
      title="THE DOCKET"
      meta={`${String(docket.length).padStart(2, '0')} OPEN`}
      notch="br"
      capTop
      hot={worst}
      footer={
        <div className="text-[7px] tracking-[0.2em] flex items-center gap-2" style={{ color: '#4A4136' }}>
          <span style={{ color: '#C05050' }}>■</span> OVERDUE
          <span style={{ color: '#C8893B' }}>■</span> OWING
        </div>
      }
    >
      <div className="p-1.5 space-y-1">
        {docket.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 py-12">
            <div className="w-8 h-8 flex items-center justify-center" style={{ boxShadow: 'inset 0 0 0 1px #2E3320' }}>
              <Check className="w-4 h-4" style={{ color: '#5F6B33' }} />
            </div>
            <p className="text-[8px] tracking-[0.18em] text-center px-5" style={{ color: '#5F564A' }}>NOBODY IS WAITING ON THE COUNCIL</p>
          </div>
        ) : docket.map((s, i) => (
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