import React from 'react';

/** Striped hazard corner — overlay for out-of-stock cards and warning states.
 *  Parent must be position: relative. */
export default function HazardCorner({ size = 36, color = '#C05050' }) {
  return (
    <div
      className="absolute top-0 right-0 pointer-events-none"
      style={{
        width: size,
        height: size,
        clipPath: 'polygon(0 0, 100% 0, 100% 100%)',
        background: `repeating-linear-gradient(45deg, ${color}40 0 4px, transparent 4px 9px)`,
        borderTop: `2px solid ${color}80`,
      }}
    />
  );
}