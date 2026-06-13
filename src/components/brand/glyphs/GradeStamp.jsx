import React from 'react';

const STAMP_TEXT = {
  salvage_commodity: 'GRADE-A RECLAIM',
  fabricated: 'FAB-CERT 2956',
  service: 'SVC BONDED',
};

/** Angled ink-stamp certification mark — variant per category. */
export default function GradeStamp({ category = 'salvage_commodity', className = '' }) {
  const text = STAMP_TEXT[category] || STAMP_TEXT.salvage_commodity;
  return (
    <span className={className} style={{ display: 'inline-block', transform: 'rotate(-6deg)' }}>
      <svg width="96" height="30" viewBox="0 0 96 30" fill="none">
        <rect x="1" y="1" width="94" height="28" stroke="rgba(176, 121, 58, 0.6)" strokeWidth="1.4" />
        <rect x="4.5" y="4.5" width="87" height="21" stroke="rgba(176, 121, 58, 0.35)" strokeWidth="0.8" />
        {/* Registration notches */}
        <path d="M1 8 H4.5 M1 22 H4.5 M91.5 8 H95 M91.5 22 H95" stroke="rgba(176, 121, 58, 0.6)" strokeWidth="1" />
        <text
          x="48"
          y="18.8"
          textAnchor="middle"
          fontSize="8.2"
          fontFamily="JetBrains Mono, monospace"
          fontWeight="bold"
          letterSpacing="1.4"
          fill="rgba(200, 160, 91, 0.85)"
        >
          {text}
        </text>
      </svg>
    </span>
  );
}