import React from 'react';

/** Decorative barcode/serial strip — deterministic per seed string */
export default function SerialStrip({ seed = 'FSIS', label, className = '' }) {
  const bars = [];
  let h = 7;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  for (let i = 0; i < 28; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    bars.push((h % 3) + 1); // widths 1-3
  }
  let x = 0;
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg width="90" height="12" viewBox="0 0 120 12" preserveAspectRatio="none" className="opacity-40">
        {bars.map((w, i) => {
          const rect = <rect key={i} x={x} y="0" width={w} height="12" fill="#C8B898" />;
          x += w + 2;
          return rect;
        })}
      </svg>
      {label && <span className="font-mono text-[8px] text-muted-foreground/60 tracking-[0.15em]">{label}</span>}
    </div>
  );
}