import React from 'react';

/** Bespoke category crest emblems — SALVAGE / FABRICATED / SERVICE.
 *  Used inside the teal chevron badges (tiny, currentColor) and as larger
 *  tile icons for fabricated/service wares that lack a commodity chip. */

export default function CategoryCrest({ category, size = 12, color = 'currentColor' }) {
  const crest = {
    // Salvage — claw raking an angled hull plate
    salvage_commodity: (
      <>
        <path d="M4 8 L18 5 L20 16 L6 19 Z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" opacity="0.75" />
        <path d="M8.5 8.5 L10 15.5 M11.8 7.8 L13.3 14.8 M15.1 7.1 L16.6 14.1" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      </>
    ),
    // Fabricated — press ram striking stock on an anvil hex
    fabricated: (
      <>
        <path d="M8 3.5 H16 M12 3.5 V9" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
        <path d="M9.5 9 H14.5 L13.5 12 H10.5 Z" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M6 15 H18 L16 20 H8 Z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M5.5 12.5 L7 14 M18.5 12.5 L17 14" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
      </>
    ),
    // Service — gantry frame cradling a torque wrench
    service: (
      <>
        <path d="M4 4 V20 M20 4 V20 M4 5.5 H20" stroke={color} strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
        <path d="M12 5.5 V9" stroke={color} strokeWidth="1.3" strokeLinecap="round" opacity="0.55" />
        <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.6" />
        <path d="M10 14.5 L7.5 18.5 M14 14.5 L16.5 18.5" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
        <path d="M10.6 10.2 L13.4 10.2" stroke={color} strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
      </>
    ),
  }[category] || (
    <path d="M7 16 L12 6 L17 16" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  );

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" role="img" aria-label={category}>
      {crest}
    </svg>
  );
}