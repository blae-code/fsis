import React from 'react';
import { motion } from 'framer-motion';

/** Atmospheric empty-state illustrations — animated bronze wireframes. */

const BRONZE = 'rgba(176, 121, 58, 0.55)';
const DIM    = 'rgba(176, 121, 58, 0.28)';
const AMBER  = 'rgba(224, 162, 46, 0.7)';
const TEAL   = 'rgba(111, 160, 143, 0.45)';
const TEAL_B = 'rgba(111, 160, 143, 0.15)';

/** Drifting derelict hull section — "no wares match" */
export function DerelictHull({ width = 180 }) {
  return (
    <svg width={width} viewBox="0 0 160 100" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* Animated scan ring */}
      <motion.circle
        cx="80" cy="50" r="42"
        stroke={TEAL} strokeWidth="0.7" strokeDasharray="3 6"
        animate={{ rotate: 360 }}
        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        style={{ transformOrigin: '80px 50px' }}
      />
      {/* Outer dim ring */}
      <circle cx="80" cy="50" r="48" stroke={DIM} strokeWidth="0.4" strokeDasharray="1 8" opacity="0.5" />

      {/* Hull spine */}
      <path d="M28 62 L52 38 L98 31 L128 44 L136 58" stroke={BRONZE} strokeWidth="1.4" />
      <path d="M52 38 L58 62 M78 34 L82 60 M98 31 L101 56" stroke={BRONZE} strokeWidth="0.9" opacity="0.7" />
      <path d="M28 62 L58 62 L82 60 L101 56 L136 58" stroke={BRONZE} strokeWidth="1.1" />

      {/* Breach — missing panel dashed */}
      <path d="M82 60 L101 56 L98 31 L78 34 Z" stroke={DIM} strokeWidth="0.9" strokeDasharray="3 3" />

      {/* Claw scar marks — amber accent */}
      <path d="M62 44 L59 54 M68 43 L65 53" stroke={AMBER} strokeWidth="1.1" opacity="0.7" />

      {/* Drifting fragments — animated */}
      <motion.path
        d="M112 22 l5 -2 l2 4 l-5 2 Z"
        stroke={BRONZE} strokeWidth="0.9"
        animate={{ x: [0, 2, 0], y: [0, -1.5, 0], rotate: [12, 18, 12] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '114px 23px' }}
      />
      <motion.path
        d="M38 24 l4 -1.5 l1.5 3 l-4 1.5 Z"
        stroke={DIM} strokeWidth="0.8"
        animate={{ x: [0, -1.5, 0], y: [0, 2, 0], rotate: [-18, -24, -18] }}
        transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
        style={{ transformOrigin: '40px 25px' }}
      />
      <motion.circle cx="124" cy="72" r="1.4" fill={DIM}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />
      <motion.circle cx="48" cy="78" r="1" fill={DIM}
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      {/* Scanner crosshair — pulsing teal */}
      <motion.path d="M80 4 V10 M80 90 V96 M34 50 H40 M120 50 H126" stroke={TEAL} strokeWidth="0.9"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Hex grid overlay — very dim */}
      <path d="M60 76 L65 70 L75 70 L80 76 L75 82 L65 82 Z" stroke={TEAL_B} strokeWidth="0.6" />
      <path d="M80 76 L85 70 L95 70 L100 76 L95 82 L85 82 Z" stroke={TEAL_B} strokeWidth="0.6" opacity="0.5" />
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

      {/* Pad designation hex — animated amber pulse */}
      <motion.path
        d="M80 67 L83 68.8 V72.4 L80 74.2 L77 72.4 V68.8 Z"
        stroke={AMBER} strokeWidth="1.1"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Beacon posts */}
      <path d="M42 80 V64 M118 80 V64" stroke={BRONZE} strokeWidth="1.1" />
      <motion.circle cx="42" cy="61.5" r="1.6" fill={AMBER}
        animate={{ opacity: [0.5, 1, 0.5], r: [1.6, 2.2, 1.6] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.circle cx="118" cy="61.5" r="1.6" fill={AMBER}
        animate={{ opacity: [0.5, 1, 0.5], r: [1.6, 2.2, 1.6] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }}
      />

      {/* Approach guide — dashed dash animation */}
      <motion.path d="M80 14 V54" stroke={TEAL} strokeWidth="1" strokeDasharray="4 4"
        animate={{ strokeDashoffset: [0, -16] }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      <path d="M72 22 L80 14 L88 22" stroke={TEAL} strokeWidth="1" />

      {/* Floor grid */}
      <path d="M30 88 H130" stroke={DIM} strokeWidth="0.8" />
      <path d="M38 94 H122" stroke={DIM} strokeWidth="0.6" opacity="0.6" />

      {/* Corner bracket accents */}
      <path d="M30 82 V80 H38" stroke={BRONZE} strokeWidth="0.8" opacity="0.6" />
      <path d="M130 82 V80 H122" stroke={BRONZE} strokeWidth="0.8" opacity="0.6" />
    </svg>
  );
}

/** Cargo processor — "bulk quote empty" */
export function IdleProcessor({ width = 180 }) {
  return (
    <svg width={width} viewBox="0 0 160 100" fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* Main housing */}
      <path d="M32 72 L38 30 H122 L128 72 Z" stroke={BRONZE} strokeWidth="1.3" />
      <path d="M38 30 L44 18 H116 L122 30" stroke={BRONZE} strokeWidth="1" opacity="0.7" />

      {/* Conveyor slots */}
      <path d="M52 52 H108" stroke={DIM} strokeWidth="0.8" strokeDasharray="5 4" />
      <path d="M52 60 H108" stroke={DIM} strokeWidth="0.8" strokeDasharray="5 4" opacity="0.6" />
      <path d="M52 68 H108" stroke={DIM} strokeWidth="0.8" strokeDasharray="5 4" opacity="0.35" />

      {/* Central readout */}
      <rect x="66" y="34" width="28" height="14" stroke={TEAL} strokeWidth="0.9" />
      <motion.path d="M70 38 H86 M70 42 H80" stroke={AMBER} strokeWidth="0.8"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Power conduit */}
      <path d="M28 72 H132" stroke={BRONZE} strokeWidth="1.5" />
      <motion.path d="M50 72 V80 M80 72 V80 M110 72 V80" stroke={AMBER} strokeWidth="0.9"
        animate={{ opacity: [0.3, 0.9, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
      />
    </svg>
  );
}