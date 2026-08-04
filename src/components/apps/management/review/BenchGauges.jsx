import React from 'react';
import DeckPanel from '@/components/console/deck/DeckPanel';
import DeckGauge, { fmtAuec } from '@/components/console/deck/DeckGauge';

/** How the bench is keeping up: what is owing, how long it has waited, what was answered. */
export default function BenchGauges({ b }) {
  const late = b.oldestDays >= 3;
  return (
    <DeckPanel glyph="◍" title="THE BENCH" meta="7D" notch="tl" capBottom hot={late}>
      <div className="p-1.5 grid grid-cols-2 gap-1 content-start">
        <div className="col-span-2">
          <DeckGauge label="AWAITING AN ANSWER" value={b.owing} sub="comrades waiting" color={b.owing > 0 ? '#E0A22E' : '#5F6B33'} />
        </div>
        <DeckGauge label="LONGEST WAIT" value={`${b.oldestDays.toFixed(1)}d`} sub={late ? 'overdue' : 'within promise'} color={late ? '#C05050' : '#8A8F45'} fill={Math.min(100, (b.oldestDays / 7) * 100)} />
        <DeckGauge label="ESCALATED" value={b.escalated} sub="over our heads" color={b.escalated > 0 ? '#D08A6A' : '#5F6B33'} />
        <DeckGauge label="WORK FILED" value={b.work} sub="uncredited" color="#EDE5D6" />
        <DeckGauge label="OFFERS" value={b.offers} sub="standing asked" color="#EDE5D6" />
        <DeckGauge label="DISPUTES" value={b.disputes} sub="unruled" color={b.disputes > 0 ? '#C8893B' : '#5F6B33'} />
        <DeckGauge label="ANSWERED" value={b.answeredWeek} sub="this week" color="#8A8F45" />
        <div className="col-span-2">
          <DeckGauge label="CREDITED THIS WEEK" value={`${fmtAuec(b.creditedWeek)} ¤`} sub="paid for labour" color="#C8893B" />
        </div>
      </div>
    </DeckPanel>
  );
}