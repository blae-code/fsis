import React from 'react';
import DeckChevronRail from '@/components/console/deck/DeckChevronRail';

export const REVIEW_SECTIONS = [
  { id: 'work',     label: 'WORK FILED',     glyph: '⌗', tone: 'hot' },
  { id: 'standing', label: 'LABOUR OFFERED', glyph: '✶' },
  { id: 'disputes', label: 'DISPUTES',       glyph: '⚖', tone: 'hot' },
];

/** Switch between the kinds of thing the council owes an answer on, with the count owing on each. */
export default function ReviewQueueRail({ section, onSection, counts = {} }) {
  return (
    <DeckChevronRail
      railId="review"
      items={REVIEW_SECTIONS}
      active={section}
      onSelect={onSection}
      counts={counts}
      spine="WHAT THE COUNCIL OWES"
    />
  );
}