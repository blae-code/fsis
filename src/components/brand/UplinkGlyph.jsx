import React from 'react';

/** Bespoke transmission mast for the hold-to-transmit control.
 *  When charging, the broadcast arcs pulse outward in sequence. */
export default function UplinkGlyph({ size = 16, charging = false, color = 'currentColor' }) {
  const arcClass = charging ? 'animate-pulse' : '';
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" role="img" aria-label="Transmit">
      {/* Mast & base struts */}
      <path d="M12 13 V20 M8.5 20 H15.5 M9.5 20 L12 15.5 L14.5 20" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Emitter head */}
      <circle cx="12" cy="11" r="1.9" fill={color} />
      {/* Broadcast arcs — staggered pulse while charging */}
      <path d="M8.6 7.6 A5 5 0 0 1 15.4 7.6" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.75" className={arcClass} />
      <path
        d="M6.2 4.9 A8.5 8.5 0 0 1 17.8 4.9"
        stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.4"
        className={arcClass} style={charging ? { animationDelay: '0.25s' } : undefined}
      />
    </svg>
  );
}