import React from 'react';

/** Bespoke FSIS division sigils — replace generic tab icons.
 *  All draw with currentColor so they inherit tab text color,
 *  with dimmed secondary strokes for depth. Shared geometry: hexes,
 *  45° cuts, and the reclaimer-claw chevron from the FSIS logomark. */

const S = ({ size, children, title }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-label={title} role="img">
    {children}
  </svg>
);

/** Catalog — hex crate with manifest lines */
export function CatalogSigil({ size = 12 }) {
  return (
    <S size={size} title="Catalog">
      <path d="M12 2.5 L20 7 L20 17 L12 21.5 L4 17 L4 7 Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8 9.5 H16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8 12.5 H16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.65" />
      <path d="M8 15.5 H13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.4" />
    </S>
  );
}

/** Bulk Quote — stacked tonnage gauge with rising tick */
export function QuoteSigil({ size = 12 }) {
  return (
    <S size={size} title="Bulk quote">
      <path d="M5 19 H19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M6.5 15.5 H12.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.45" />
      <path d="M6.5 11.5 H15" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" opacity="0.7" />
      <path d="M6.5 7.5 H17.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M19.5 10 V4.5 M17 7 L19.5 4.5 L22 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
    </S>
  );
}

/** My Orders — tracking reticle locked on a cargo dot */
export function OrdersSigil({ size = 12 }) {
  return (
    <S size={size} title="Order tracking">
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3.5 2.2" />
      <path d="M12 2.5 V5.5 M12 18.5 V21.5 M2.5 12 H5.5 M18.5 12 H21.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="9.75" y="9.75" width="4.5" height="4.5" fill="currentColor" transform="rotate(45 12 12)" opacity="0.9" />
    </S>
  );
}

/** Jobs — contractor wings flanking a crew hex */
export function JobsSigil({ size = 12 }) {
  return (
    <S size={size} title="Contractor jobs">
      <path d="M12 7.5 L15.5 9.5 L15.5 13.5 L12 15.5 L8.5 13.5 L8.5 9.5 Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M6.5 9 L2.5 11.5 L6.5 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      <path d="M17.5 9 L21.5 11.5 L17.5 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      <path d="M12 17.5 V20" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
    </S>
  );
}

/** About — reclaimer claw within the certification ring */
export function AboutSigil({ size = 12 }) {
  return (
    <S size={size} title="About FSIS">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="6.4" stroke="currentColor" strokeWidth="0.9" strokeDasharray="2 1.6" opacity="0.5" />
      <path d="M8.5 15 L12 8.5 L15.5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </S>
  );
}