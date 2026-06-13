import React from 'react';

/** Beveled price-delta marker — up / down / par. Fill inherits currentColor.
 *  Designed to stay crisp at 8px in tickers, badges and the exchange board. */
export default function DeltaGlyph({ dir = 'par', className = '', style }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style} fill="currentColor">
      {dir === 'up' && <path d="M12 4 L20 13 H15.5 V20 H8.5 V13 H4 Z" />}
      {dir === 'down' && <path d="M12 20 L4 11 H8.5 V4 H15.5 V11 H20 Z" />}
      {dir === 'par' && <path d="M4 10 H20 V14 H4 Z" />}
    </svg>
  );
}