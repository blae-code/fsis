import React from 'react';

/** Dashboard sigil — grid of data cells with a rising bar accent */
export function DashboardSigil({ className, style }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style}
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {/* 2×2 cell grid */}
      <rect x="3" y="3" width="7.5" height="7.5" strokeWidth="1.4" />
      <rect x="13.5" y="3" width="7.5" height="7.5" strokeWidth="1.4" />
      <rect x="3" y="13.5" width="7.5" height="7.5" strokeWidth="1.4" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" strokeWidth="1.4" />
      {/* Bar chart inside bottom-right cell */}
      <path d="M15.5 19.5 V17 M17.8 19.5 V15.5 M20 19.5 V16.5" strokeWidth="1.2" />
      {/* Trend line in top-left cell */}
      <path d="M5 9 L7.5 6.5 L10 8" strokeWidth="1.1" opacity="0.6" />
      {/* Pip */}
      <circle cx="10" cy="8" r="0.7" fill="currentColor" stroke="none" opacity="0.7" />
    </svg>
  );
}