import React from 'react';

/** Pictograms for the "How buying works" walkthrough. Inherit currentColor. */

const Svg = ({ className, style, children }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    style={style}
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {children}
  </svg>
);

/** Manifest slate with hex line-items — step 1 */
export function ManifestPicto(props) {
  return (
    <Svg {...props}>
      <path d="M5.5 3.5 H16 L18.5 6 V20.5 H5.5 Z" />
      <path d="M16 3.5 V6 H18.5" strokeWidth="1.1" opacity="0.6" />
      <path d="M8.4 8.6 L9.4 9.2 V10.4 L8.4 11 L7.4 10.4 V9.2 Z" strokeWidth="1.1" />
      <path d="M11 9.8 H16" strokeWidth="1.2" />
      <path d="M8.4 12.8 L9.4 13.4 V14.6 L8.4 15.2 L7.4 14.6 V13.4 Z" strokeWidth="1.1" opacity="0.7" />
      <path d="M11 14 H15" strokeWidth="1.2" opacity="0.7" />
      <path d="M11 18.2 H14" strokeWidth="1.2" opacity="0.45" />
    </Svg>
  );
}

/** Uplink wave — step 2 */
export function TransmitPicto(props) {
  return (
    <Svg {...props}>
      <path d="M8.5 21 L12 13.5 L15.5 21" strokeWidth="1.7" />
      <path d="M10 17.8 H14" strokeWidth="1.2" />
      <circle cx="12" cy="11.4" r="1.3" fill="currentColor" stroke="none" />
      <path d="M8.8 8.6 a4.6 4.6 0 0 1 6.4 0" opacity="0.7" />
      <path d="M6 5.8 a8.6 8.6 0 0 1 12 0" opacity="0.4" />
    </Svg>
  );
}

/** Two parties meeting over the token — step 3 */
export function HandoffPicto(props) {
  return (
    <Svg {...props}>
      <circle cx="7" cy="6.8" r="1.9" strokeWidth="1.4" />
      <path d="M4 18.5 L7 11.5 L9.5 17" strokeWidth="1.6" />
      <circle cx="17" cy="6.8" r="1.9" strokeWidth="1.4" opacity="0.7" />
      <path d="M20 18.5 L17 11.5 L14.5 17" strokeWidth="1.6" opacity="0.7" />
      <path d="M12 13.2 L13.6 14.8 L12 16.4 L10.4 14.8 Z" fill="currentColor" stroke="none" />
    </Svg>
  );
}