import React from 'react';

/** Transmission tower with broadcast arcs — bespoke replacement for the
 *  generic radio icon. When `charging`, the arcs pulse outward in sequence. */
export default function UplinkGlyph({ className = '', style, charging = false }) {
  return (
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
      {/* Tower legs + crossbar */}
      <path d="M8.5 21 L12 14 L15.5 21" />
      <path d="M9.9 18.2 H14.1" strokeWidth="1.2" />
      <path d="M12 14 V12.8" strokeWidth="1.4" />
      {/* Emitter */}
      <circle cx="12" cy="11.6" r="1.3" fill="currentColor" stroke="none">
        {charging && <animate attributeName="opacity" values="1;0.3;1" dur="0.7s" repeatCount="indefinite" />}
      </circle>
      {/* Broadcast arcs */}
      <path d="M8.8 8.8 a4.6 4.6 0 0 1 6.4 0" opacity={charging ? undefined : '0.7'}>
        {charging && <animate attributeName="opacity" values="0.2;1;0.2" dur="1s" repeatCount="indefinite" />}
      </path>
      <path d="M6 6 a8.6 8.6 0 0 1 12 0" opacity={charging ? undefined : '0.4'}>
        {charging && <animate attributeName="opacity" values="0.2;1;0.2" dur="1s" begin="0.3s" repeatCount="indefinite" />}
      </path>
    </svg>
  );
}