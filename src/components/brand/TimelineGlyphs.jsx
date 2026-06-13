import React from 'react';

/** Bespoke chain-of-custody glyphs for the buyer order timeline.
 *  Drawn with currentColor so node coloring stays in the timeline's control. */

const S = ({ size, children, title }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-label={title} role="img">
    {children}
  </svg>
);

/** Received — uplink burst hitting the relay */
export function ReceivedGlyph({ size = 16 }) {
  return (
    <S size={size} title="Order received">
      <circle cx="12" cy="14.5" r="2.2" fill="currentColor" />
      <path d="M12 12 V7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
      <path d="M7.5 9.5 A6.4 6.4 0 0 1 16.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.65" />
      <path d="M4.8 6.8 A10.2 10.2 0 0 1 19.2 6.8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.35" />
      <path d="M8 18.5 H16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </S>
  );
}

/** Confirmed — manifest hex carrying the verification stamp */
export function ConfirmedGlyph({ size = 16 }) {
  return (
    <S size={size} title="Order confirmed">
      <path d="M12 2.8 L19.5 7.2 L19.5 16.8 L12 21.2 L4.5 16.8 L4.5 7.2 Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8.5 12.2 L11 14.7 L15.8 9.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </S>
  );
}

/** In fulfillment — reclaimer claw lifting a cargo crate */
export function FulfillmentGlyph({ size = 16 }) {
  return (
    <S size={size} title="In fulfillment">
      <path d="M12 3 V6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      <path d="M7.5 11.5 L12 6.5 L16.5 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="8.2" y="13.5" width="7.6" height="6.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8.2 16.2 H15.8" stroke="currentColor" strokeWidth="1.1" opacity="0.5" />
    </S>
  );
}

/** Delivered — interlocking handoff chevrons meeting at the seam */
export function DeliveredGlyph({ size = 16 }) {
  return (
    <S size={size} title="Delivered">
      <path d="M4 7.5 L10 12 L4 16.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 7.5 L14 12 L20 16.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="1.7" fill="currentColor" />
    </S>
  );
}

/** Cancelled — severed cargo link */
export function CancelledGlyph({ size = 16 }) {
  return (
    <S size={size} title="Cancelled">
      <path d="M9.5 6.5 L6 6.5 A4.5 4.5 0 0 0 6 15.5 L8.5 15.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" opacity="0.8" transform="translate(0 1)" />
      <path d="M14.5 6.5 L18 6.5 A4.5 4.5 0 0 1 18 15.5 L15.5 15.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" opacity="0.8" transform="translate(0 1)" />
      <path d="M15.5 8.5 L8.5 15.5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </S>
  );
}