import React from 'react';

/** An etched label over its control — the storefront's manifest-form treatment. */
export default function FormRow({ label, hint, span, children }) {
  return (
    <label className={`flex flex-col gap-1 min-w-0 ${span ? 'col-span-2' : ''}`}>
      <span className="flex items-baseline gap-1.5">
        <span className="text-[7px] font-bold tracking-[0.2em]" style={{ color: '#8A7E6C' }}>{label}</span>
        {hint && <span className="text-[7px] tracking-[0.1em] truncate" style={{ color: '#5F564A' }}>{hint}</span>}
      </span>
      {children}
    </label>
  );
}

/** A titled band of the form, so the sheet reads in stages rather than one grid of boxes. */
export function FormBand({ glyph, title, note, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <span className="text-[9px] leading-none" style={{ color: '#E0A22E' }}>{glyph}</span>
        <span className="text-[7px] font-bold tracking-[0.24em]" style={{ color: '#EDE5D6' }}>{title}</span>
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg,#3A2F20,transparent)' }} />
      </div>
      {note && <p className="text-[7px] leading-relaxed" style={{ color: '#6B6155' }}>{note}</p>}
      <div className="grid grid-cols-2 gap-1.5">{children}</div>
    </div>
  );
}