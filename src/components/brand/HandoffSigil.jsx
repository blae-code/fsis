import React from 'react';

/** Split-token handoff sigil — two interlocking half-hexes meeting at a
 *  keyway seam. Visual shorthand for "both sides speak the passphrase". */
export default function HandoffSigil({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" role="img" aria-label="Handoff passphrase">
      {/* Left half-token */}
      <path
        d="M10.5 4 L5 7 L5 17 L10.5 20 L10.5 16.5 L8.5 15 L8.5 9 L10.5 7.5 Z"
        stroke={color} strokeWidth="1.4" strokeLinejoin="round"
      />
      {/* Right half-token */}
      <path
        d="M13.5 4 L19 7 L19 17 L13.5 20 L13.5 16.5 L15.5 15 L15.5 9 L13.5 7.5 Z"
        stroke={color} strokeWidth="1.4" strokeLinejoin="round" opacity="0.75"
      />
      {/* Keyway seam */}
      <path d="M12 5.5 V9 M12 15 V18.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" opacity="0.55" />
      <rect x="10.9" y="10.9" width="2.2" height="2.2" fill={color} transform="rotate(45 12 12)" />
    </svg>
  );
}