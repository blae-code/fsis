import React from 'react';
import DeckPanel from '@/components/console/deck/DeckPanel';
import DeckSignalRow from '@/components/console/deck/DeckSignalRow';

/**
 * The shop's docket: what is waiting on a decision, worst first, each ticket a
 * door through to the desk that answers it. Nothing here is decoration — an empty
 * board means the counter is genuinely clear.
 */
const ORDER = { critical: 0, warning: 1, notice: 2 };

export default function TradeSignalBoard({ signals, activeDesk, onGo }) {
  const rows = [...signals].sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);
  return (
    <DeckPanel glyph="▤" title="COUNTER" meta={`${rows.length} WAITING`} notch="br" capTop>
      <div className="p-1.5 space-y-1">
        {rows.length === 0 && (
          <p className="p-2 text-[8px] leading-relaxed" style={{ color: '#5F564A' }}>
            Nothing is waiting at the counter — orders answered, shelves stocked, no buyer left without a word.
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