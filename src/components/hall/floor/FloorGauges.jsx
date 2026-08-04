import React from 'react';
import DeckPanel from '@/components/console/deck/DeckPanel';
import DeckGauge, { fmtAuec } from '@/components/console/deck/DeckGauge';

/** The vitals of the lots presently in view. */
export default function FloorGauges({ g }) {
  return (
    <DeckPanel glyph="◍" title="HALL VITALS" meta="LIVE" notch="tl" capBottom>
      <div className="p-1.5 grid grid-cols-2 gap-1 content-start">
        <div className="col-span-2">
          <DeckGauge label="STANDING ON THE FLOOR" value={`${fmtAuec(g.standing)} ¤`} sub={`${g.live} lots open to bid`} color="#E0A22E" />
        </div>
        <DeckGauge label="CLOSING SOON" value={g.soon} sub="inside the hour" color={g.soon > 0 ? '#D08A6A' : '#5F6B33'} />
        <DeckGauge label="NO BIDS" value={g.quiet} sub="go at opening" color="#C8A05B" />
        <DeckGauge label="YOURS AT PRESENT" value={g.leading} sub="your bid leads" color="#8A8F45" />
        <DeckGauge label="OUTBID" value={g.outbid} sub="still open to you" color={g.outbid > 0 ? '#C05050' : '#5F6B33'} />
        <DeckGauge label="WATCHING" value={g.watching} sub="told before close" color="#6FA0C8" />
        <DeckGauge label="HAMMER FALLEN" value={g.closed} sub="lots concluded" color="#5FA0A0" />
      </div>
    </DeckPanel>
  );
}