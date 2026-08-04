import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Collapsible command deck section. Collapsed by default so the deck reads as a
 * short index of headers rather than one endless scroll — panels only mount
 * (and only fetch) when a section is opened.
 */
export default function CommandSection({ eyebrow, title, description, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="space-y-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left border px-3 py-2 transition-colors"
        style={{ borderColor: open ? '#5C4424' : '#3A2F20', background: 'rgba(18,13,8,0.82)' }}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-[8px] tracking-[0.28em]" style={{ color: '#8A7E6C' }}>{eyebrow}</p>
          <ChevronDown
            className="w-3.5 h-3.5 shrink-0 transition-transform"
            style={{ color: open ? '#E0A22E' : '#5F564A', transform: open ? 'rotate(180deg)' : 'none' }}
          />
        </div>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-1">
          <h2 className="text-[12px] tracking-[0.22em] font-bold" style={{ color: '#E0A22E' }}>{title}</h2>
          {description && <p className="text-[9px] max-w-2xl" style={{ color: open ? '#A89C8A' : '#6B6155' }}>{description}</p>}
        </div>
      </button>
      {open && children}
    </section>
  );
}