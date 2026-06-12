import React from 'react';

/** Circular FSIS certification seal — "CERTIFIED RECLAIMED" */
export default function FsisSeal({ size = 56, label = 'CERTIFIED RECLAIMED' }) {
  const id = React.useId();
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className="opacity-70">
      <defs>
        <path id={id} d="M40 12 A28 28 0 1 1 39.99 12" />
      </defs>
      <circle cx="40" cy="40" r="37" stroke="hsl(168, 65%, 45%, 0.5)" strokeWidth="1.5" />
      <circle cx="40" cy="40" r="33" stroke="hsl(168, 65%, 45%, 0.25)" strokeWidth="0.75" strokeDasharray="3 2" />
      {/* Mini claw mark center */}
      <path d="M30 47 L40 31 L50 47" stroke="hsl(168, 80%, 55%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M34 50 L40 41 L46 50" stroke="hsl(168, 65%, 45%, 0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {/* Curved text */}
      <text fontSize="7.2" fontFamily="JetBrains Mono, monospace" fill="hsl(168, 65%, 45%, 0.8)" letterSpacing="1.5">
        <textPath href={`#${id}`} startOffset="2%">{label} • FSIS • {label} •</textPath>
      </text>
    </svg>
  );
}