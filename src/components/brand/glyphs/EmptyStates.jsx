import React from 'react';

/** Atmospheric empty-state illustrations — dim bronze wireframes. */

const BRONZE = 'rgba(176, 121, 58, 0.55)';
const DIM = 'rgba(176, 121, 58, 0.28)';
const AMBER = 'rgba(224, 162, 46, 0.7)';
const TEAL = 'rgba(111, 160, 143, 0.45)';

/** Drifting derelict hull section — "no wares match" */
export function DerelictHull({ width = 180 }) {
  return (
    <svg width={width} viewBox="0 0 160 100" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* Scan ring */}
      <circle cx="80" cy="50" r="42" stroke={DIM} strokeWidth="0.8" strokeDasharray="2 5" />
      {/* Hull spine */}
      <path d="M28 62 L52 38 L98 31 L128 44 L136 58" stroke={BRONZE} strokeWidth="1.4" />
      <path d="M52 38 L58 62 M78 34 L82 60 M98 31 L101 56" stroke={BRONZE} strokeWidth="0.9" opacity="0.7" />
      <path d="M28 62 L58 62 L82 60 L101 56 L136 58" stroke={BRONZE} strokeWidth="1.1" />
      {/* Breach — missing panel rendered dashed */}
      <path d="M82 60 L101 56 L98 31 L78 34 Z" stroke={DIM} strokeWidth="0.9" strokeDasharray="3 3" />
      {/* Drifting fragments */}
      <path d="M112 22 l5 -2 l2 4 l-5 2 Z" stroke={BRONZE} strokeWidth="0.9" transform="rotate(12 114 23)" />
      <path d="M38 24 l4 -1.5 l1.5 3 l-4 1.5 Z" stroke={DIM} strokeWidth="0.8" transform="rotate(-18 40 25)" />
      <circle cx="124" cy="72" r="1.4" fill={DIM} />
      <circle cx="48" cy="78" r="1" fill={DIM} />
      {/* Claw scar marks */}
      <path d="M62 44 L59 54 M68 43 L65 53" stroke={AMBER} strokeWidth="1" opacity="0.6" />
      {/* Scanner crosshair */}
      <path d="M80 4 V10 M80 90 V96 M34 50 H40 M120 50 H126" stroke={TEAL} strokeWidth="0.9" />
    </svg>
  );
}

/** Idle docking bay awaiting traffic — "no tracked orders" */
export function IdleDockBay({ width = 180 }) {
  return (
    <svg width={width} viewBox="0 0 160 100" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* Landing pad */}
      <path d="M44 80 L62 62 H98 L116 80 Z" stroke={BRONZE} strokeWidth="1.4" />
      <path d="M58 74 L68 66 H92 L102 74 Z" stroke={DIM} strokeWidth="0.9" strokeDasharray="3 3" />
      {/* Pad designation hex */}
      <path d="M80 67 L83 68.8 V72.4 L80 74.2 L77 72.4 V68.8 Z" stroke={AMBER} strokeWidth="1" />
      {/* Beacon posts */}
      <path d="M42 80 V64 M118 80 V64" stroke={BRONZE} strokeWidth="1.1" />
      <circle cx="42" cy="61.5" r="1.6" fill={AMBER} opacity="0.8" />
      <circle cx="118" cy="61.5" r="1.6" fill={AMBER} opacity="0.8" />
      {/* Approach guides */}
      <path d="M80 14 V26 M80 32 V40 M80 46 V54" stroke={TEAL} strokeWidth="1" strokeDasharray="4 4" />
      <path d="M72 22 L80 14 L88 22" stroke={TEAL} strokeWidth="1" />
      {/* Floor grid hint */}
      <path d="M30 88 H130" stroke={DIM} strokeWidth="0.8" />
      <path d="M38 94 H122" stroke={DIM} strokeWidth="0.6" opacity="0.6" />
    </svg>
  );
}