import React from 'react';

/** Bespoke FSIS division sigils — replace generic tab icons. All inherit
 *  currentColor so active/idle tab states style them automatically. */

const Svg = ({ className, style, children }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    style={style}
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

/** Hex cargo crate with manifest lines — Catalog */
export function CatalogSigil(props) {
  return (
    <Svg {...props}>
      <path d="M12 4 L19 8 V16 L12 20 L5 16 V8 Z" />
      <path d="M9 10.5 H15" strokeWidth="1.3" />
      <path d="M9 13.5 H13" strokeWidth="1.3" opacity="0.6" />
      <path d="M16.5 6.6 L19 8 V10.6" strokeWidth="1.3" opacity="0.5" />
    </Svg>
  );
}

/** Stacked tonnage gauge with measuring bracket — Bulk Quote */
export function QuoteSigil(props) {
  return (
    <Svg {...props}>
      <rect x="5" y="15.5" width="13" height="2.8" strokeWidth="1.4" />
      <rect x="7" y="10.8" width="9" height="2.8" strokeWidth="1.4" opacity="0.75" />
      <rect x="9" y="6" width="5" height="2.8" strokeWidth="1.4" opacity="0.5" />
      <path d="M21 5.5 V19 M19.6 5.5 H21 M19.6 12.2 H21 M19.6 19 H21" strokeWidth="1.2" />
    </Svg>
  );
}

/** Tracking reticle — My Orders */
export function OrdersSigil(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="6.5" strokeWidth="1.5" />
      <path d="M12 2.5 V5.5 M12 18.5 V21.5 M2.5 12 H5.5 M18.5 12 H21.5" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
      <path d="M12 8.8 A3.2 3.2 0 0 1 15.2 12" strokeWidth="1.1" opacity="0.55" />
    </Svg>
  );
}

/** Contractor wings over hex stud — Jobs */
export function JobsSigil(props) {
  return (
    <Svg {...props}>
      <path d="M3 13.5 L8.5 8.5 L12 11.5 L15.5 8.5 L21 13.5" strokeWidth="1.7" />
      <path d="M5.5 10.5 L8.5 5.5 M18.5 10.5 L15.5 5.5" strokeWidth="1.2" opacity="0.5" />
      <path d="M12 14.6 L14 15.8 V18.2 L12 19.4 L10 18.2 V15.8 Z" strokeWidth="1.3" />
    </Svg>
  );
}

/** Reclaimer claw in certification ring — About FSIS */
export function AboutSigil(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.5" strokeWidth="1.4" />
      <path d="M8 15.5 L12 8 L16 15.5" strokeWidth="1.8" />
      <path d="M9.8 16.8 L12 12.6 L14.2 16.8" strokeWidth="1.2" opacity="0.55" />
    </Svg>
  );
}