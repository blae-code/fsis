import React from 'react';

/** Micro market-delta glyphs — bevel-cut arrows matching the command-deck
 *  corner-cut language. dir: 'up' | 'down' | 'par'. */
export default function DeltaGlyph({ dir = 'par', size = 8, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" fill="none" role="img" aria-label={`market ${dir}`}>
      {dir === 'up' && (
        <path d="M2 9.5 L2 7.5 L6 2.5 L10 7.5 L10 9.5 L6 5.5 Z" fill={color} />
      )}
      {dir === 'down' && (
        <path d="M2 2.5 L2 4.5 L6 9.5 L10 4.5 L10 2.5 L6 6.5 Z" fill={color} />
      )}
      {dir === 'par' && (
        <path d="M2 4 H8.5 L10 5 L8.5 6 H2 Z M2 7.5 H7 L8 8.25 L7 9 H2 Z" fill={color} opacity="0.85" />
      )}
    </svg>
  );
}