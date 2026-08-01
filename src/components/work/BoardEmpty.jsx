import React from 'react';

/** A quiet, framed empty state — the yard is idle, not broken. */
export default function BoardEmpty({ children }) {
  return (
    <div
      className="border border-dashed py-6 px-3 text-center text-[9px] leading-relaxed"
      style={{ borderColor: '#2A2217', color: '#6B6155', background: 'rgba(224,162,46,0.02)' }}
    >
      {children}
    </div>
  );
}