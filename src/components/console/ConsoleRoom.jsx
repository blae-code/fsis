import React from 'react';
import DeckPanel from '@/components/console/deck/DeckPanel';

/**
 * Every section of every room, mounted in the same instrument well the Watchfloor uses:
 * notched plate, lit masthead, hazard caps, and its own scroll. Chrome learned once on
 * the Command deck reads the same in Trade, Yard, Labour and Hall — a room that frames
 * its work differently makes the operator re-learn where they are on every tab.
 *
 * Full-bleed sections (`bare`) already carry their own deck and are mounted untouched.
 */
export default function ConsoleRoom({ group, section }) {
  if (section.bare) return section.render();

  const idx = group.sections.findIndex((s) => s.id === section.id) + 1;

  return (
    <div className="h-full p-3">
      <DeckPanel
        glyph={section.glyph}
        title={section.label}
        meta={`${group.label} · ${idx}/${group.sections.length}`}
        notch="both"
        capTop
        capBottom
        bright
        footer={
          group.links?.length ? (
            <div className="flex items-center gap-3">
              {group.links.map((l) => (
                <a key={l.to} href={l.to} className="text-[7px] tracking-[0.2em]" style={{ color: '#8A7E6C' }}>{l.label}</a>
              ))}
            </div>
          ) : null
        }
      >
        <div className="p-3">{section.render()}</div>
      </DeckPanel>
    </div>
  );
}