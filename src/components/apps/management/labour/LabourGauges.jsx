import React from 'react';
import DeckPanel from '@/components/console/deck/DeckPanel';
import DeckGauge, { fmtAuec } from '@/components/console/deck/DeckGauge';

/** Labour's vital signs — work held, seats filled, and what the shares are worth. */
export default function LabourGauges({ g }) {
  return (
    <DeckPanel glyph="◍" title="LABOUR VITALS" meta="LIVE" notch="tl" capBottom>
      <div className="p-1.5 grid grid-cols-2 gap-1 content-start">
        <DeckGauge label="ON THE BOARD" value={g.posted} sub="open to claim" color="#EDE5D6" />
        <DeckGauge label="BLOCKED" value={g.blocked} sub="waiting on other work" color={g.blocked > 0 ? '#C8893B' : '#5F6B33'} />
        <DeckGauge label="IN HAND" value={g.claimed} sub="claimed, underway" color="#5FA0A0" />
        <DeckGauge label="AWAITING REVIEW" value={g.submitted} sub="proof filed" color={g.submitted > 0 ? '#D08A6A' : '#5F6B33'} />
        <div className="col-span-2">
          <DeckGauge label="OWED ON OPEN WORK" value={`${fmtAuec(g.owed)} ¤`} sub="agreed credit not yet settled" color="#E0A22E" />
        </div>
        <DeckGauge label="MUSTERS CALLED" value={g.upcoming} sub={`${g.underway} underway`} color="#EDE5D6" />
        <DeckGauge label="SEATS TAKEN" value={g.seats} sub="of places called" color="#C8893B" fill={g.seatFill} />
        <DeckGauge label="POOL" value={g.cycleOpen ? `${fmtAuec(g.pool)} ¤` : '—'} sub={g.cycleOpen ? `${fmtAuec(g.shareValue)} ¤ a share` : 'no cycle open'} color="#8A8F45" />
        <DeckGauge label="WORD ON PAY" value={g.elected} sub="elections in" color="#5FA0A0" fill={g.electFill} />
        <div className="col-span-2">
          <DeckGauge label="APPEALS FILED" value={g.appeals} sub="marks contested" color={g.appeals > 0 ? '#D08A6A' : '#5F6B33'} />
        </div>
      </div>
    </DeckPanel>
  );
}