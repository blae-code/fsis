import React from 'react';

const HEX = 'M20 2.5 L35 11.25 L35 28.75 L20 37.5 L5 28.75 L5 11.25 Z';

/** Custom SVG material chips for FSIS salvage commodities */
export default function CommodityIcon({ code, size = 36 }) {
  const inner = {
    // RMC — layered composite bands
    RMC: (
      <>
        <path d="M9 16 L31 16" stroke="#E0A22E" strokeWidth="2.5" />
        <path d="M9 21 L31 21" stroke="rgba(176, 121, 58, 0.7)" strokeWidth="2" />
        <path d="M9 26 L31 26" stroke="rgba(176, 121, 58, 0.4)" strokeWidth="1.5" />
      </>
    ),
    // CMR — girder X-truss
    CMR: (
      <>
        <path d="M11 13 L29 27 M29 13 L11 27" stroke="#E0A22E" strokeWidth="2" strokeLinecap="round" />
        <path d="M11 13 L29 13 M11 27 L29 27" stroke="rgba(176, 121, 58, 0.5)" strokeWidth="1.4" />
      </>
    ),
    // CMS — brick stack
    CMS: (
      <>
        <rect x="10" y="13" width="9" height="5.5" stroke="#E0A22E" strokeWidth="1.4" />
        <rect x="21" y="13" width="9" height="5.5" stroke="rgba(176, 121, 58, 0.6)" strokeWidth="1.4" />
        <rect x="15.5" y="21" width="9" height="5.5" stroke="rgba(176, 121, 58, 0.8)" strokeWidth="1.4" />
      </>
    ),
  }[code];

  // Fallback: claw mark
  const fallback = (
    <path d="M12 27 L20 13 L28 27" stroke="#E0A22E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  );

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <path d={HEX} stroke="rgba(176, 121, 58, 0.5)" strokeWidth="1.5" fill="rgba(176, 121, 58, 0.07)" />
      {inner || fallback}
    </svg>
  );
}