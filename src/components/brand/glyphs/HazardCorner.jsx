import React from 'react';
import { motion } from 'framer-motion';

/** Animated striped hazard corner — overlay for out-of-stock cards.
 *  Parent must be position: relative / overflow: hidden.
 *  The stripe crawls diagonally on an infinite loop for a live-warning feel. */
export default function HazardCorner({ size = 36, color = '#C05050' }) {
  return (
    <div
      className="absolute top-0 right-0 pointer-events-none overflow-hidden"
      style={{ width: size, height: size, clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }}
    >
      {/* Stripe layer — crawls */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `repeating-linear-gradient(
            -45deg,
            ${color}55 0 3px,
            transparent 3px 8px
          )`,
        }}
        animate={{ backgroundPosition: ['0px 0px', '16px 16px'] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
      />
      {/* Sharp border edge */}
      <div
        className="absolute inset-0"
        style={{ borderTop: `2px solid ${color}90`, borderRight: `1px solid ${color}40` }}
      />
      {/* Corner dot */}
      <div
        className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
        style={{ background: color, boxShadow: `0 0 4px ${color}` }}
      />
    </div>
  );
}