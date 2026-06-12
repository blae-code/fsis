import React from 'react';

/**
 * FSIS logomark — split hexagon with reclaimer claw chevron.
 * props: size (px), withWordmark (bool), glow (bool)
 */
export default function FsisLogo({ size = 32, withWordmark = false, glow = false, className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        style={glow ? { filter: 'drop-shadow(0 0 6px hsl(168, 80%, 55%, 0.5))' } : undefined}
      >
        {/* Outer hex */}
        <path
          d="M24 3 L42 13.5 L42 34.5 L24 45 L6 34.5 L6 13.5 Z"
          stroke="hsl(168, 65%, 45%)"
          strokeWidth="2"
          fill="hsl(168, 65%, 45%, 0.06)"
        />
        {/* Split line */}
        <path d="M6 24 L18 24" stroke="hsl(168, 65%, 45%, 0.5)" strokeWidth="1.2" />
        <path d="M30 24 L42 24" stroke="hsl(168, 65%, 45%, 0.5)" strokeWidth="1.2" />
        {/* Reclaimer claw chevron — three scrape strokes */}
        <path d="M15 31 L24 17 L33 31" stroke="hsl(168, 80%, 55%)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M19 33.5 L24 25.5 L29 33.5" stroke="hsl(168, 65%, 45%, 0.7)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        {/* Reclaimed unit — filled tick */}
        <path d="M22.4 13.5 L24 11 L25.6 13.5 Z" fill="hsl(168, 80%, 55%)" />
      </svg>
      {withWordmark && (
        <div className="leading-none">
          <div className={`font-mono font-bold tracking-[0.22em] text-primary ${glow ? 'xian-glow-subtle' : ''}`} style={{ fontSize: size * 0.42 }}>
            FSIS
          </div>
          <div className="font-mono text-muted-foreground tracking-[0.14em]" style={{ fontSize: size * 0.19, marginTop: size * 0.06 }}>
            FAIRSHARE INDUSTRIAL
          </div>
        </div>
      )}
    </div>
  );
}