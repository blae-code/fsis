import React from 'react';
import DeckPanel from '@/components/console/deck/DeckPanel';
import DeckSignalRow from '@/components/console/deck/DeckSignalRow';

const ORDER = { critical: 0, warning: 1, notice: 2 };

/** What the floor owes this comrade an answer on, worst first. */
export default function FloorSignalBoard({ signals, activeDesk, onGo }) {
  const rows = [...signals].sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);
  return (
    <DeckPanel glyph="⚖" title="THE FLOOR" meta={`${rows.length} STANDING`} notch="br" capTop>
      <div className="p-1.5 space-y-1">
        {rows.length === 0 && (
          <p className="p-2 text-[8px] leading-relaxed" style={{ color: '#5F564A' }}>
            Nothing pressing. No lot closing inside the hour, and nobody has bid over you.
          </p>
        )}
        {rows.map((s, i) => (
          <DeckSignalRow
            key={s.label}
            severity={s.severity}
            count={s.count}
            label={s.label}
            detail={s.detail}
            delay={i * 0.03}
            active={s.desk === activeDesk}
            onClick={() => onGo(s.desk)}
          />
        ))}
      </div>
    </DeckPanel>
  );
}