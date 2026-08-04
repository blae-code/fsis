import React from 'react';
import DeckPanel from '@/components/console/deck/DeckPanel';
import DeckSignalRow from '@/components/console/deck/DeckSignalRow';

/** The hall's docket: debts, complaints and offers waiting on the council, worst first. */
const ORDER = { critical: 0, warning: 1, notice: 2 };

export default function HallSignalBoard({ signals, activeDesk, onGo }) {
  const rows = [...signals].sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);
  return (
    <DeckPanel glyph="⚖" title="THE HALL" meta={`${rows.length} WAITING`} notch="br" capTop>
      <div className="p-1.5 space-y-1">
        {rows.length === 0 && (
          <p className="p-2 text-[8px] leading-relaxed" style={{ color: '#5F564A' }}>
            The hall is square. Nothing owed past its date, no complaint unheard, no offer left to lapse in silence.
          </p>
        )}
        {rows.map((s, i) => (
          <DeckSignalRow
            key={`${s.desk}:${s.label}`}
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