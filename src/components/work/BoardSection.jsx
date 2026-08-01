import React from 'react';

/** Consistent sectional framing for the labour board: eyebrow, count, and a hairline rule. */
export default function BoardSection({ eyebrow, accent = '#E0A22E', count, note, children }) {
  return (
    <section className="space-y-2">
      <div className="flex items-baseline gap-2 border-b pb-1" style={{ borderColor: '#221B12' }}>
        <span className="text-[9px] font-bold tracking-[0.22em]" style={{ color: accent }}>{eyebrow}</span>
        {count !== undefined && (
          <span
            className="px-1.5 py-0.5 border text-[7px] font-bold tracking-[0.14em]"
            style={{ borderColor: `${accent}44`, color: accent, background: `${accent}12` }}
          >
            {count}
          </span>
        )}
        <span className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${accent}22, transparent)` }} />
      </div>
      {note && <p className="text-[8px] leading-relaxed" style={{ color: '#8A7E6C' }}>{note}</p>}
      {children}
    </section>
  );
}