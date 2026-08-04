import React from 'react';
import DeckPanel from '@/components/console/deck/DeckPanel';
import DeckGauge, { fmtAuec } from '@/components/console/deck/DeckGauge';

/** The fleet's vital signs — hands afloat, places unfilled, tonnage held. */
export default function FleetGauges({ f }) {
  const short = f.unfilled > 0;
  return (
    <DeckPanel glyph="◍" title="THE FLEET" meta="LIVE" notch="tl" capBottom hot={short}>
      <div className="p-1.5 grid grid-cols-2 gap-1 content-start">
        <div className="col-span-2">
          <DeckGauge label="CREWED" value={`${f.crewed.toFixed(0)}%`} sub={short ? `${f.unfilled} places unfilled` : 'every place stood'} color={short ? '#C05050' : '#8A8F45'} fill={f.crewed} />
        </div>
        <DeckGauge label="RUNS LIVE" value={f.live} sub="afloat now" color={f.live > 0 ? '#E0A22E' : '#5F564A'} />
        <DeckGauge label="HANDS" value={f.crew} sub="stood in" color="#EDE5D6" />
        <DeckGauge label="EXPECTED" value={`${f.expectedScu} SCU`} sub="live runs" color="#C8893B" />
        <DeckGauge label="IN HOLD" value={`${f.holdScu} SCU`} sub="packed & loaded" color="#C8893B" />
        <DeckGauge label="HOLD VALUE" value={`${fmtAuec(f.holdValue)} ¤`} sub="undelivered" color="#5FA0A0" />
        <DeckGauge label="PLANS FLYING" value={f.plansFlying} sub="staged freight" color="#EDE5D6" />
        <div className="col-span-2">
          <DeckGauge label="RUNS CALLED" value={f.weekRuns} sub="last 7 days" color="#8A8F45" />
        </div>
      </div>
    </DeckPanel>
  );
}