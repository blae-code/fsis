import React from 'react';

/** Category crest emblems — one per FSIS line of business. Inherit
 *  currentColor; legible from 10px (badge) up to 24px (card icon). */

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

/** Claw raking a hull plate — SALVAGE */
export function SalvageCrest(props) {
  return (
    <Svg {...props}>
      <path d="M4.5 16.5 L9 7 H20 L15.5 16.5 Z" strokeWidth="1.5" />
      <path d="M11.5 8.5 L9.8 14.8" strokeWidth="1.4" />
      <path d="M14.5 8.5 L12.8 14.8" strokeWidth="1.4" opacity="0.7" />
      <path d="M17.5 8.5 L15.8 14.8" strokeWidth="1.4" opacity="0.45" />
    </Svg>
  );
}

/** Press ram striking the anvil block — FABRICATED */
export function FabricatedCrest(props) {
  return (
    <Svg {...props}>
      <rect x="9" y="3.5" width="6" height="3.4" strokeWidth="1.5" />
      <path d="M12 6.9 V10.8" strokeWidth="1.6" />
      <path d="M9.6 9.4 L12 11.6 L14.4 9.4" strokeWidth="1.2" opacity="0.55" />
      <path d="M5.5 14 H18.5 L16 19.5 H8 Z" strokeWidth="1.6" />
      <path d="M9 14 V11.8 H15 V14" strokeWidth="1.3" />
    </Svg>
  );
}

/** Gantry-hung wrench — SERVICE */
export function ServiceCrest(props) {
  return (
    <Svg {...props}>
      <path d="M3.5 5 H20.5" strokeWidth="1.5" />
      <path d="M12 5 V8.2" strokeWidth="1.4" />
      <path d="M9.2 9.6 A4 4 0 1 0 14.8 9.6 L12 12.4 Z" strokeWidth="1.5" />
      <path d="M12 17.4 V21" strokeWidth="1.7" />
    </Svg>
  );
}

export const CREST_BY_CATEGORY = {
  salvage_commodity: SalvageCrest,
  fabricated: FabricatedCrest,
  service: ServiceCrest,
};