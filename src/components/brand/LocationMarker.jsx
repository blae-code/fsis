import React from 'react';

/** Delivery-destination markers — distinguish orbital stations, ground
 *  cities, cloud platforms, and asteroid outposts at a glance. */
export default function LocationMarker({ kind = 'orbital', size = 12, color = 'currentColor' }) {
  const glyph = {
    // Orbital station — habitat core inside a docking ring
    orbital: (
      <>
        <ellipse cx="12" cy="12" rx="9" ry="3.6" stroke={color} strokeWidth="1.3" opacity="0.6" />
        <circle cx="12" cy="12" r="3.4" stroke={color} strokeWidth="1.5" />
        <path d="M12 8.6 V5.5 M12 15.4 V18.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
      </>
    ),
    // Ground city — skyline rising behind a landing pad
    ground: (
      <>
        <path d="M4 19 H20" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        <path d="M7 19 V11 H10 V19 M11.5 19 V6.5 H14.5 V19 M16 19 V13.5 H18.5 V19" stroke={color} strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M12.2 4 H13.8" stroke={color} strokeWidth="1.1" strokeLinecap="round" opacity="0.6" />
      </>
    ),
    // Cloud platform — landing deck floating on vapor arcs
    cloud: (
      <>
        <path d="M6 10.5 H18 L16.5 13.5 H7.5 Z" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M12 10.5 V7.5 M10.5 7.5 H13.5" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
        <path d="M5.5 16.5 Q8 14.8 10.5 16.5 T15.5 16.5 T20 16" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
        <path d="M7 19.5 Q9.5 17.8 12 19.5 T17 19.5" stroke={color} strokeWidth="1.1" strokeLinecap="round" opacity="0.35" />
      </>
    ),
    // Asteroid outpost — jagged rock with a comms mast
    asteroid: (
      <>
        <path d="M6 14 L8.5 9.5 L13 8 L17.5 10 L19 14.5 L15.5 18.5 L9.5 18 Z" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M13 8 V4.5 M11.3 6 L13 4.5 L14.7 6" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.75" />
        <circle cx="11" cy="13.5" r="1.3" stroke={color} strokeWidth="1" opacity="0.55" />
      </>
    ),
  }[kind] || null;

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" role="img" aria-label={kind}>
      {glyph}
    </svg>
  );
}