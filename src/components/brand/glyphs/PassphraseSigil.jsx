import React from 'react';

/** Split-token sigil — two interlocking halves meeting at the handoff point.
 *  Visually explains "both sides speak the phrase". Inherits currentColor. */
export default function PassphraseSigil({ className = '', style }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      style={style}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Buyer half */}
      <path d="M3.5 8.5 H9.5 L12 12 L9.5 15.5 H3.5 Z" />
      <path d="M6 11 H7.5 M6 13 H7.5" strokeWidth="1.1" opacity="0.6" />
      {/* Courier half */}
      <path d="M20.5 8.5 H14.5 L12 12 L14.5 15.5 H20.5 Z" opacity="0.55" />
      {/* Match point */}
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}