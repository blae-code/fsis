import React from 'react';

/** Atmospheric empty-state illustrations — wireframe scenes in the
 *  command-deck line language (bronze primary, verdigris secondary). */

const BRONZE = '#B0793A';
const BRONZE_DIM = 'rgba(176, 121, 58, 0.35)';
const TEAL = 'rgba(111, 160, 143, 0.55)';

/** Drifting derelict hull — shown when no wares match the search */
export function DerelictHull({ width = 180 }) {
  return (
    <svg width={width} viewBox="0 0 180 100" fill="none" className="mx-auto" role="img" aria-label="No wares found">
      {/* Starfield specks */}
      <circle cx="18" cy="14" r="1" fill={BRONZE_DIM} />
      <circle cx="160" cy="22" r="1.2" fill={TEAL} opacity="0.5" />
      <circle cx="142" cy="78" r="0.9" fill={BRONZE_DIM} />
      <circle cx="32" cy="84" r="1" fill={TEAL} opacity="0.35" />
      {/* Severed hull section — angular wedge, listing */}
      <g transform="rotate(-8 90 50)">
        <path d="M48 42 L96 30 L132 38 L138 56 L100 68 L54 62 Z" stroke={BRONZE} strokeWidth="1.5" strokeLinejoin="round" />
        {/* Torn edge */}
        <path d="M48 42 L44 46 L49 49 L45 54 L54 62" stroke={BRONZE} strokeWidth="1.3" strokeLinejoin="round" />
        {/* Panel seams */}
        <path d="M70 36 L74 64 M96 30 L100 68 M118 35 L120 62" stroke={BRONZE_DIM} strokeWidth="1" />
        {/* Claw rake scars */}
        <path d="M104 40 L112 52 M110 38 L118 50" stroke="#E0A22E" strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
        {/* Dead viewport */}
        <circle cx="86" cy="48" r="4" stroke={TEAL} strokeWidth="1.2" />
      </g>
      {/* Drifting debris chunks */}
      <path d="M24 60 L31 57 L33 64 L26 66 Z" stroke={BRONZE_DIM} strokeWidth="1" strokeLinejoin="round" />
      <path d="M152 48 L158 46 L160 52 L154 54 Z" stroke={TEAL} strokeWidth="1" strokeLinejoin="round" opacity="0.6" />
      <path d="M140 14 L145 12 L146 17 L141 18 Z" stroke={BRONZE_DIM} strokeWidth="0.9" strokeLinejoin="round" />
      {/* Scanner sweep arc */}
      <path d="M10 92 A95 95 0 0 1 170 92" stroke={TEAL} strokeWidth="0.8" strokeDasharray="4 4" opacity="0.4" />
    </svg>
  );
}

/** Idle docking bay — shown when no orders are being tracked */
export function IdleDockingBay({ width = 180 }) {
  return (
    <svg width={width} viewBox="0 0 180 100" fill="none" className="mx-auto" role="img" aria-label="No tracked orders">
      {/* Bay floor grid */}
      <path d="M30 86 H150" stroke={BRONZE} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M42 86 L54 70 M138 86 L126 70 M90 86 V70" stroke={BRONZE_DIM} strokeWidth="1" />
      {/* Landing pad markings */}
      <path d="M62 80 H118" stroke={TEAL} strokeWidth="1.2" strokeDasharray="6 4" opacity="0.7" />
      {/* Gantry frame */}
      <path d="M40 86 V28 M140 86 V28 M40 28 H140" stroke={BRONZE} strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M40 42 H140" stroke={BRONZE_DIM} strokeWidth="1" />
      <path d="M52 28 L40 42 M68 28 L52 42 M128 28 L140 42 M112 28 L128 42" stroke={BRONZE_DIM} strokeWidth="0.9" />
      {/* Idle crane hook, waiting */}
      <path d="M90 28 V44" stroke={BRONZE} strokeWidth="1.3" />
      <path d="M84 50 L90 44 L96 50" stroke="#E0A22E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {/* Beacon lights — one lit */}
      <circle cx="40" cy="24" r="2" fill={TEAL} opacity="0.8" />
      <circle cx="140" cy="24" r="2" stroke={BRONZE_DIM} strokeWidth="1" />
      {/* Vacant outline where a crate should sit */}
      <path d="M74 66 H106 V82 H74 Z" stroke={TEAL} strokeWidth="1.1" strokeDasharray="3 3" opacity="0.6" />
      <path d="M86 72 L94 76 M94 72 L86 76" stroke={TEAL} strokeWidth="1" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}