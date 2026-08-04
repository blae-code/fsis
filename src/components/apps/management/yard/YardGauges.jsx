import React from 'react';
import DeckPanel from '@/components/console/deck/DeckPanel';
import DeckGauge, { fmtAuec } from '@/components/console/deck/DeckGauge';

/** The floor's vital signs — what is held, what it is worth, what is cooking. */
export default function YardGauges({ g }) {
  return (
    <DeckPanel glyph="◍" title="FLOOR VITALS" meta="LIVE" notch="tl" capBottom>
      <div className="p-1.5 grid grid-cols-2 gap-1 content-start">
        <DeckGauge label="STOCK HELD" value={g.held} sub="unsold lines" color="#EDE5D6" />
        <DeckGauge label="HELD VALUE" value={`${fmtAuec(g.heldValue)} ¤`} sub="at appraisal" color="#E0A22E" />
        <DeckGauge label="UNVALUED" value={g.unpriced} sub="no appraisal" color={g.unpriced > 0 ? '#D08A6A' : '#5F6B33'} />
        <DeckGauge label="ON THE BENCH" value={g.repairing} sub="under repair" color="#C8893B" />
        <DeckGauge label="CRATES OPEN" value={g.openCrates} sub="not yet closed" color="#EDE5D6" />
        <DeckGauge label="STOWED" value={`${g.stowed}/${g.openCrates}`} sub="bay assigned" color="#5FA0A0" fill={g.openCrates ? (g.stowed / g.openCrates) * 100 : 0} />
        <DeckGauge label="CRATE VALUE" value={`${fmtAuec(g.crateValue)} ¤`} sub="cargo on hand" color="#C8893B" />
        <DeckGauge label="HOPPERS" value={`${g.ready}/${g.running + g.ready}`} sub="ready of running" color={g.ready > 0 ? '#D08A6A' : '#8A8F45'} />
        <div className="col-span-2">
          <DeckGauge label="FABRICATION OPEN" value={g.fabOpen} sub="runs not finished" color="#8A8F45" />
        </div>
      </div>
    </DeckPanel>
  );
}