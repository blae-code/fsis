import React from 'react';
import DeckPanel from '@/components/console/deck/DeckPanel';
import DeckGauge, { fmtAuec } from '@/components/console/deck/DeckGauge';

/** A comrade's own figures — what they hold, what is owed them, what the board offers. */
export default function WorkerGauges({ g }) {
  return (
    <DeckPanel glyph="◍" title="YOUR FIGURES" meta="LIVE" notch="tl" capBottom>
      <div className="p-1.5 grid grid-cols-2 gap-1 content-start">
        <div className="col-span-2">
          <DeckGauge label="CREDITED TO YOU" value={`${fmtAuec(g.earned)} ¤`} sub="paid in full, never skimmed" color="#8A8F45" />
        </div>
        <DeckGauge label="IN HAND" value={g.held} sub="work you took up" color="#6FA0C8" />
        <DeckGauge label="SENT BACK" value={g.returned} sub="more work wanted" color={g.returned > 0 ? '#D08A6A' : '#5F6B33'} />
        <DeckGauge label="FILED" value={g.filed} sub="awaiting credit" color="#C8A05B" />
        <DeckGauge label="CREDITED" value={g.credited} sub="settled tasks" color="#5FA0A0" />
        <div className="col-span-2">
          <DeckGauge label="OPEN ON THE BOARD" value={`${fmtAuec(g.openValue)} ¤`} sub={`${g.open} tasks • ${g.urgent} urgent`} color="#E0A22E" />
        </div>
        <DeckGauge label="STANDING A RUN" value={g.standing} sub="you answered in" color="#8A8F45" />
        <DeckGauge label="UNANSWERED" value={g.unanswered} sub="musters called" color={g.unanswered > 0 ? '#C8893B' : '#5F6B33'} />
      </div>
    </DeckPanel>
  );
}