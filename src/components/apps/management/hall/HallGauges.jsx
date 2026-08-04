import React from 'react';
import DeckPanel from '@/components/console/deck/DeckPanel';
import DeckGauge, { fmtAuec } from '@/components/console/deck/DeckGauge';

/** The hall's vital signs — what is owed, what is contested, what stands offered. */
export default function HallGauges({ g }) {
  return (
    <DeckPanel glyph="◍" title="HALL VITALS" meta="LIVE" notch="tl" capBottom>
      <div className="p-1.5 grid grid-cols-2 gap-1 content-start">
        <div className="col-span-2">
          <DeckGauge label="COMMISSION OWED" value={`${fmtAuec(g.owedTotal)} ¤`} sub={`${g.owed} debts on the book`} color="#E0A22E" />
        </div>
        <DeckGauge label="PAST DUE" value={g.overdue} sub="beyond terms" color={g.overdue > 0 ? '#D08A6A' : '#5F6B33'} />
        <DeckGauge label="SUSPENDED" value={g.suspended} sub="listing barred" color={g.suspended > 0 ? '#C8893B' : '#5F6B33'} />
        <DeckGauge label="UNHEARD" value={g.open} sub="awaiting an answer" color="#EDE5D6" />
        <DeckGauge label="READY TO RULE" value={g.answered} sub="both sides heard" color={g.answered > 0 ? '#D08A6A' : '#5F6B33'} />
        <DeckGauge label="RULED" value={g.ruled} sub="closed on the record" color="#5FA0A0" />
        <DeckGauge label="OFFERS STANDING" value={g.offered} sub={`${fmtAuec(g.offeredTotal)} ¤ committed`} color="#C8893B" />
        <DeckGauge label="TAKEN UP" value={g.accepted} sub="bought back" color="#8A8F45" />
        <DeckGauge label="ARTWORK LIVE" value={g.slots ? `${g.live}/${g.slots}` : g.live} sub={g.slots ? `${g.unfilled} slots bare` : 'slots filled'} color="#5FA0A0" fill={g.slots ? (g.live / g.slots) * 100 : undefined} />
        <div className="col-span-2">
          <DeckGauge label="WITHOUT ALT TEXT" value={g.noAlt} sub="excluding somebody" color={g.noAlt > 0 ? '#D08A6A' : '#5F6B33'} />
        </div>
      </div>
    </DeckPanel>
  );
}