import React from 'react';

const STEPS = [
  { id: 'source', label: 'PROVENANCE', note: 'where it came from' },
  { id: 'manifest', label: 'MANIFEST', note: 'paste or photograph' },
  { id: 'review', label: 'REVIEW', note: 'correct the reading' },
  { id: 'sync', label: 'SYNC', note: 'commit to the books' },
];

/** Where the intake stands, read left to right — the same chevron loop the decks use. */
export default function IntakeStageRail({ at }) {
  const idx = STEPS.findIndex((s) => s.id === at);
  return (
    <div className="flex gap-px">
      {STEPS.map((s, i) => {
        const done = i < idx;
        const live = i === idx;
        return (
          <div
            key={s.id}
            className="flex-1 px-2 py-1.5 min-w-0"
            style={{
              background: live ? 'linear-gradient(180deg,#1F1509,#0D0A07)' : '#0B0906',
              boxShadow: `inset 0 0 0 1px ${live ? '#8A6430' : '#241C14'}`,
              clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 50%, calc(100% - 6px) 100%, 0 100%, 6px 50%)',
            }}
          >
            <div className="text-[7px] font-bold tracking-[0.2em] truncate" style={{ color: live ? '#E0A22E' : done ? '#8A8F45' : '#5F564A' }}>
              {done ? '✓ ' : ''}{s.label}
            </div>
            <div className="text-[6px] tracking-[0.12em] truncate" style={{ color: '#5F564A' }}>{s.note}</div>
          </div>
        );
      })}
    </div>
  );
}