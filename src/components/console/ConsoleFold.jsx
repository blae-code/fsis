import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * A quiet fold for secondary panels inside a console tab — keeps each tab
 * opening straight onto its core tool, with supporting dashboards tucked
 * behind one click. Children only mount when opened.
 */
export default function ConsoleFold({ label, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border font-mono" style={{ borderColor: open ? '#5C4424' : '#3A2F20', background: '#0C0A07' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full px-3 py-2 flex items-center gap-2 text-left"
      >
        <span className="text-[9px] tracking-[0.22em]" style={{ color: open ? '#E0A22E' : '#7A6E60' }}>{label}</span>
        <ChevronDown
          className="w-3 h-3 ml-auto shrink-0 transition-transform"
          style={{ color: open ? '#E0A22E' : '#5F564A', transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>
      {open && <div className="p-3 pt-0 space-y-4">{children}</div>}
    </div>
  );
}