import React from 'react';

const SECTIONS = [
  { id: 'work',      label: 'WORK FILED',     glyph: '⌗' },
  { id: 'standing',  label: 'LABOUR OFFERED', glyph: '✶' },
  { id: 'disputes',  label: 'DISPUTES',       glyph: '⚖' },
];

/** Switch between the kinds of thing the council owes an answer on, with the count owing on each. */
export default function ReviewQueueRail({ section, onSection, counts = {} }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {SECTIONS.map((s) => {
        const active = section === s.id;
        const owing = counts[s.id] || 0;
        return (
          <button
            key={s.id}
            onClick={() => onSection(s.id)}
            className="flex items-center gap-2 border px-3 h-9 text-[9px] tracking-[0.15em]"
            style={{
              borderColor: active ? '#8A6430' : '#2E2519',
              color: active ? '#E0A22E' : '#7A6E60',
              background: active ? '#140F08' : '#0B0906',
            }}
          >
            <span style={{ color: active ? '#E0A22E' : '#3A3028' }}>{s.glyph}</span>
            {s.label}
            <span
              className="px-1.5 py-0.5 text-[8px] font-bold"
              style={{
                border: `1px solid ${owing > 0 ? '#8A6430' : '#2E2519'}`,
                color: owing > 0 ? '#E0A22E' : '#5F564A',
              }}
            >
              {owing}
            </span>
          </button>
        );
      })}
    </div>
  );
}