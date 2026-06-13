import React from 'react';

/** Chain-of-custody glyphs for the buyer order timeline. Bold geometry that
 *  reads at 12px; all inherit currentColor for done/pending states. */

const Svg = ({ className, style, children }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    style={style}
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

/** Signal burst hitting the relay — order received */
export function ReceivedGlyph(props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="16.5" r="2.2" fill="currentColor" stroke="none" />
      <path d="M8.5 12.5 a5 5 0 0 1 7 0" />
      <path d="M5.5 9 a9.2 9.2 0 0 1 13 0" opacity="0.55" />
    </Svg>
  );
}

/** Stamped hex with verification tick — order confirmed */
export function ConfirmedGlyph(props) {
  return (
    <Svg {...props}>
      <path d="M12 3.5 L19 7.75 V16.25 L12 20.5 L5 16.25 V7.75 Z" strokeWidth="1.6" />
      <path d="M8.5 12.3 L11 14.8 L15.5 9.5" />
    </Svg>
  );
}

/** Gantry claw lifting a crate — in fulfillment */
export function FulfillmentGlyph(props) {
  return (
    <Svg {...props}>
      <path d="M8.5 13 V10 L12 6.5 L15.5 10 V13" strokeWidth="1.7" />
      <path d="M12 3.5 V6.5" strokeWidth="1.4" opacity="0.6" />
      <rect x="8.5" y="13.5" width="7" height="6" strokeWidth="1.6" />
      <path d="M12 13.5 V19.5" strokeWidth="1.1" opacity="0.45" />
    </Svg>
  );
}

/** Interlocking handoff chevrons around the token — delivered */
export function DeliveredGlyph(props) {
  return (
    <Svg {...props}>
      <path d="M4 12 L8.8 7.5 L11.5 10.2" strokeWidth="1.8" />
      <path d="M20 12 L15.2 16.5 L12.5 13.8" strokeWidth="1.8" />
      <path d="M12 10.2 L13.8 12 L12 13.8 L10.2 12 Z" fill="currentColor" stroke="none" />
    </Svg>
  );
}

/** Severed hex link — cancelled */
export function CancelledGlyph(props) {
  return (
    <Svg {...props}>
      <path d="M12 3.5 L19 7.75 V16.25 M12 20.5 L5 16.25 V7.75 L12 3.5" strokeWidth="1.5" opacity="0.6" />
      <path d="M7 7 L17 17" strokeWidth="2.1" />
    </Svg>
  );
}