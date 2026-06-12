import React from 'react';

/** CRT-style atmosphere for onboarding cards: static scanlines + a slow travelling beam. */
export default function ScanlineOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Static scanlines */}
      <div
        className="absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, hsl(38, 72%, 52%, 0.6) 3px)',
        }}
      />
      {/* Travelling beam */}
      <div
        className="absolute left-0 right-0 h-12 opacity-[0.05]"
        style={{
          background: 'linear-gradient(180deg, transparent, hsl(42, 85%, 60%), transparent)',
          animation: 'scan-line 6s linear infinite',
        }}
      />
      {/* Corner vignette */}
      <div
        className="absolute inset-0"
        style={{ boxShadow: 'inset 0 0 60px hsl(30, 12%, 2%, 0.55)' }}
      />
    </div>
  );
}