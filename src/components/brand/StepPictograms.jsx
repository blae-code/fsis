import React from 'react';

/** Bespoke pictograms for the how-buying-works strip — drawn with
 *  currentColor so the strip controls tinting. */

const S = ({ size, children, title }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-label={title} role="img">
    {children}
  </svg>
);

/** Step 1 — manifest slate with cargo entries being checked off */
export function ManifestSlate({ size = 13 }) {
  return (
    <S size={size} title="Build manifest">
      <path d="M6 3.5 H18 L20 5.5 V20.5 H4 V5.5 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 3.5 V6.5 H15 V3.5" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" opacity="0.7" />
      <path d="M7.5 10.5 L8.7 11.7 L10.7 9.7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.5 10.7 H16.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
      <path d="M7.5 15 L8.7 16.2 L10.7 14.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.5 15.2 H16.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.7" />
    </S>
  );
}

/** Step 2 — uplink wave leaving the relay dish */
export function UplinkWave({ size = 13 }) {
  return (
    <S size={size} title="Transmit order">
      <path d="M5 20 L11 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 21 A4.5 4.5 0 0 1 3 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="11.5" cy="12.5" r="1.6" fill="currentColor" />
      <path d="M14.5 9.5 A5 5 0 0 1 14.5 15.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" transform="rotate(45 12 12.5)" opacity="0.8" />
      <path d="M15 5.5 L21 4 L19.5 10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
    </S>
  );
}

/** Step 3 — two figures meeting at the handoff, crate between them */
export function HandoffMeet({ size = 13 }) {
  return (
    <S size={size} title="In-person handoff">
      {/* Left figure */}
      <circle cx="5.5" cy="7" r="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.5 9.5 V15 M5.5 11.5 L9 13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      {/* Right figure */}
      <circle cx="18.5" cy="7" r="2" stroke="currentColor" strokeWidth="1.4" opacity="0.75" />
      <path d="M18.5 9.5 V15 M18.5 11.5 L15 13.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.75" />
      {/* Crate exchanged between them */}
      <rect x="9.5" y="13" width="5" height="4.5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M9.5 15 H14.5" stroke="currentColor" strokeWidth="0.9" opacity="0.5" />
      {/* Ground line */}
      <path d="M3 20 H21" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.5" />
    </S>
  );
}