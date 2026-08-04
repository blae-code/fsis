import React from 'react';
import DeckChevronRail from '@/components/console/deck/DeckChevronRail';

/** The working day as a track: intake → appraise → list → fulfil → hand off → close out. */
export default function DayLoopRail({ stages, active, onSelect, counts }) {
  return (
    <DeckChevronRail
      railId="dayloop"
      items={stages}
      active={active}
      onSelect={onSelect}
      counts={counts}
      spine="THE WORKING DAY"
    />
  );
}