import React from 'react';
import { motion } from 'framer-motion';

const LOW_AT   = 50;
const CAP      = 200;
const SEGMENTS = 12;

/** Segmented industrial stock gauge — skewed fill cells with animated glow
 *  on active segments, hazard-striped when low, hollow red cells when out. */
export default function StockBar({ stock = 0, unit = 'SCU' }) {
  const low    = stock > 0 && stock <= LOW_AT;
  const out    = stock <= 0;
  const filled = out ? 0 : Math.max(1, Math.round((Math.min(stock, CAP) / CAP) * SEGMENTS));

  const activeColor = low ? '#C8893B' : '#7BA05B';
  const glowColor   = low ? 'rgba(200, 137, 59, 0.55)' : 'rgba(123, 160, 91, 0.35)';

  return (
    <div className="space-y-1">
      <div className="flex gap-[2px] h-2 px-0.5">
        {Array.from({ length: SEGMENTS }).map((_, i) => {
          const isFilled = i < filled;
          const isTop    = isFilled && i === filled - 1; // leading edge cell

          return (
            <motion.div
              key={i}
              className="flex-1"
              style={{
                transform: 'skewX(-18deg)',
                background: out
                  ? 'transparent'
                  : isFilled
                    ? activeColor
                    : 'rgba(36, 28, 18, 0.9)',
                backgroundImage: low && isFilled
                  ? 'repeating-linear-gradient(45deg, rgba(0,0,0,0.4) 0 2px, transparent 2px 5px)'
                  : undefined,
                boxShadow: out
                  ? 'inset 0 0 0 1px rgba(192, 80, 80, 0.35)'
                  : isTop
                    ? `0 0 8px ${glowColor}, inset 0 0 4px ${glowColor}`
                    : isFilled
                      ? `0 0 3px ${glowColor}`
                      : undefined,
              }}
              initial={false}
              animate={isTop ? { opacity: [0.7, 1, 0.7] } : {}}
              transition={isTop ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } : {}}
            />
          );
        })}
      </div>
      <div className="font-mono text-[9px] sm:text-[10px] leading-snug" style={{ color: out ? '#C05050' : low ? '#E0A22E' : '#9C9080' }}>
        {out ? 'OUT OF STOCK' : low ? `LOW — ${stock} ${unit} LEFT` : `${stock} ${unit} in stock`}
      </div>
    </div>
  );
}