import React from 'react';

/** HUD-style corner brackets overlay — wrap inside a relative parent */
export default function CornerBrackets({ size = 10, color = 'hsl(168, 65%, 45%, 0.45)' }) {
  const base = {
    position: 'absolute',
    width: size,
    height: size,
    borderColor: color,
    borderStyle: 'solid',
    borderWidth: 0,
    pointerEvents: 'none',
  };
  return (
    <>
      <span style={{ ...base, top: 4, left: 4, borderTopWidth: 1.5, borderLeftWidth: 1.5 }} />
      <span style={{ ...base, top: 4, right: 4, borderTopWidth: 1.5, borderRightWidth: 1.5 }} />
      <span style={{ ...base, bottom: 4, left: 4, borderBottomWidth: 1.5, borderLeftWidth: 1.5 }} />
      <span style={{ ...base, bottom: 4, right: 4, borderBottomWidth: 1.5, borderRightWidth: 1.5 }} />
    </>
  );
}