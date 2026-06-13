import React from 'react';

/** Reusable striped hazard corner — overlays a card corner to flag
 *  out-of-stock wares or destructive confirm states. */
export default function HazardCorner({ size = 34, color = '#C05050', position = 'top-right' }) {
  const id = React.useId();
  const pos = {
    'top-right': 'top-0 right-0',
    'top-left': 'top-0 left-0 -scale-x-100',
    'bottom-right': 'bottom-0 right-0 -scale-y-100',
    'bottom-left': 'bottom-0 left-0 -scale-x-100 -scale-y-100',
  }[position];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 34 34"
      fill="none"
      className={`absolute pointer-events-none ${pos}`}
      role="img"
      aria-label="warning"
    >
      <defs>
        <pattern id={id} width="6" height="6" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
          <rect width="3" height="6" fill={color} opacity="0.55" />
        </pattern>
      </defs>
      <path d="M34 0 L34 34 L20 34 Z M0 0 L34 0 L34 14 Z" fill="none" />
      <path d="M10 0 L34 0 L34 24 Z" fill={`url(#${id})`} />
      <path d="M10 0 L34 24" stroke={color} strokeWidth="1.2" opacity="0.8" />
    </svg>
  );
}