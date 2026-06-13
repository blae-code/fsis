import React from 'react';

/** Bespoke FSIS division sigils — replace generic tab icons. All inherit
 *  currentColor so active/idle tab states style them automatically.
 *  Upgraded with richer geometry and inner detail passes. */

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

/** Hex cargo crate with manifest lines + corner rivets — Catalog */
export function CatalogSigil(props) {
  return (
    <Svg {...props}>
      {/* Outer hex */}
      <path d="M12 3.5 L19.5 7.75 V16.25 L12 20.5 L4.5 16.25 V7.75 Z" strokeWidth="1.5" />
      {/* Manifest lines */}
      <path d="M8.5 10.5 H15.5" strokeWidth="1.2" />
      <path d="M8.5 13 H13.5" strokeWidth="1.2" opacity="0.65" />
      <path d="M8.5 15.5 H11" strokeWidth="1.2" opacity="0.38" />
      {/* Corner rivet dots */}
      <circle cx="12" cy="3.5" r="0.6" fill="currentColor" stroke="none" opacity="0.7" />
      <circle cx="19.5" cy="7.75" r="0.6" fill="currentColor" stroke="none" opacity="0.7" />
    </Svg>
  );
}

/** Stacked tonnage gauge with bracket rail + tick marks — Bulk Quote */
export function QuoteSigil(props) {
  return (
    <Svg {...props}>
      <rect x="5" y="15.5" width="13" height="2.8" strokeWidth="1.4" />
      <rect x="7" y="10.8" width="9" height="2.8" strokeWidth="1.4" opacity="0.72" />
      <rect x="9" y="6" width="5" height="2.8" strokeWidth="1.4" opacity="0.45" />
      {/* Measure rail */}
      <path d="M21 5.5 V19" strokeWidth="1.2" />
      <path d="M20 5.5 H21 M20 12.2 H21 M20 19 H21" strokeWidth="1" />
      {/* Weight arrow */}
      <path d="M12 4.5 L13 6 H11 Z" fill="currentColor" stroke="none" opacity="0.5" />
    </Svg>
  );
}

/** Tracking reticle with diagonal sweep arc — My Orders */
export function OrdersSigil(props) {
  return (
    <Svg {...props}>
      {/* Outer ring */}
      <circle cx="12" cy="12" r="7" strokeWidth="1.4" />
      {/* Crosshairs */}
      <path d="M12 2 V5.5 M12 18.5 V22 M2 12 H5.5 M18.5 12 H22" strokeWidth="1.4" />
      {/* Center pip */}
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      {/* Sweep arc */}
      <path d="M12 7.5 A4.5 4.5 0 0 1 16.5 12" strokeWidth="1.1" opacity="0.5" />
      {/* Tick on ring */}
      <path d="M16.5 8.5 L17.8 7.2" strokeWidth="1" opacity="0.45" />
    </Svg>
  );
}

/** Contractor wings over hex stud + altitude ticks — Jobs */
export function JobsSigil(props) {
  return (
    <Svg {...props}>
      {/* Wings */}
      <path d="M2.5 13.5 L8 8 L12 11 L16 8 L21.5 13.5" strokeWidth="1.7" />
      {/* Wing struts */}
      <path d="M5 10.5 L8 5.5 M19 10.5 L16 5.5" strokeWidth="1.1" opacity="0.45" />
      {/* Hex stud */}
      <path d="M12 14.2 L14.2 15.5 V18.2 L12 19.5 L9.8 18.2 V15.5 Z" strokeWidth="1.3" />
      {/* Rank pip */}
      <circle cx="12" cy="16.9" r="0.8" fill="currentColor" stroke="none" opacity="0.6" />
    </Svg>
  );
}

/** Bar-chart report sigil with rising columns + scan line — Weekly Report */
export function ReportSigil(props) {
  return (
    <Svg {...props}>
      {/* Rising columns */}
      <rect x="4" y="14" width="3.5" height="7" strokeWidth="1.2" />
      <rect x="10.25" y="9" width="3.5" height="12" strokeWidth="1.2" />
      <rect x="16.5" y="5" width="3.5" height="16" strokeWidth="1.2" />
      {/* Scan line */}
      <path d="M3 19 H21" strokeWidth="1" opacity="0.4" />
      {/* Trend arrow */}
      <path d="M5 15 L10.5 10 L16.5 6" strokeWidth="1.3" opacity="0.55" />
      <path d="M14.5 5.5 L16.5 6 L16 8" strokeWidth="1" opacity="0.55" />
    </Svg>
  );
}

/** Reclaimer claw in certification ring + inner hex frame — About FSIS */
export function AboutSigil(props) {
  return (
    <Svg {...props}>
      {/* Outer ring */}
      <circle cx="12" cy="12" r="8.5" strokeWidth="1.4" />
      {/* Inner hex */}
      <path d="M12 5.5 L15.7 7.75 V12.25 L12 14.5 L8.3 12.25 V7.75 Z" strokeWidth="1.1" opacity="0.4" />
      {/* Claw upward glyph */}
      <path d="M8.5 16 L12 8.5 L15.5 16" strokeWidth="1.8" />
      {/* Secondary detail */}
      <path d="M10 16.5 L12 12 L14 16.5" strokeWidth="1.1" opacity="0.5" />
      {/* Top tick */}
      <path d="M12 3.5 V5.5" strokeWidth="1.2" opacity="0.55" />
    </Svg>
  );
}