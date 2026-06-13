import React from 'react';
import { locationKind } from '@/lib/storeLocations';

/** Destination-type glyph — orbital station, ground pad, or outpost.
 *  Inherits currentColor. */
export default function LocationMarker({ name, className = '', style }) {
  const kind = locationKind(name);
  if (!kind) return null;
  return (
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
      {kind === 'orbital' && (
        <>
          <ellipse cx="12" cy="12" rx="8.5" ry="3.2" transform="rotate(-18 12 12)" strokeWidth="1.2" />
          <circle cx="12" cy="12" r="2.4" fill="currentColor" stroke="none" />
          <circle cx="18.5" cy="8.4" r="0.9" fill="currentColor" stroke="none" opacity="0.6" />
        </>
      )}
      {kind === 'ground' && (
        <>
          <path d="M4 18.5 H20" strokeWidth="1.6" />
          <path d="M7 18.5 V15.5 M17 18.5 V15.5" strokeWidth="1.2" opacity="0.6" />
          <path d="M12 4.5 V12.5" strokeWidth="1.5" />
          <path d="M8.8 9.8 L12 13.2 L15.2 9.8" strokeWidth="1.5" />
        </>
      )}
      {kind === 'outpost' && (
        <>
          <path d="M6 13 L8.5 7.5 L14 5.5 L18.5 9 L18 14.5 L13 18.5 L7.5 16.5 Z" strokeWidth="1.3" />
          <path d="M12 9.8 L14 11 V13.4 L12 14.6 L10 13.4 V11 Z" strokeWidth="1.2" />
        </>
      )}
    </svg>
  );
}