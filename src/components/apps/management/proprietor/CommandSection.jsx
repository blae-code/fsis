import React from 'react';

export default function CommandSection({ eyebrow, title, description, children }) {
  return (
    <section className="space-y-3">
      <div className="border px-3 py-2" style={{ borderColor: '#3A2F20', background: 'rgba(18,13,8,0.82)' }}>
        <p className="text-[8px] tracking-[0.28em]" style={{ color: '#8A7E6C' }}>{eyebrow}</p>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-1">
          <h2 className="text-[12px] tracking-[0.22em] font-bold" style={{ color: '#E0A22E' }}>{title}</h2>
          {description && <p className="text-[9px] max-w-2xl" style={{ color: '#A89C8A' }}>{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}