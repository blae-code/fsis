import React, { useState, useEffect } from 'react';

/** Types out a status string character-by-character with a blinking block cursor. */
export default function TypedStatus({ text, speed = 24, className = '', style }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    setN(0);
    const t = setInterval(() => {
      setN((v) => {
        if (v >= text.length) { clearInterval(t); return v; }
        return v + 1;
      });
    }, speed);
    return () => clearInterval(t);
  }, [text, speed]);

  return (
    <span className={className} style={style}>
      {text.slice(0, n)}
      <span className="animate-pulse" style={{ opacity: 0.7 }}>▊</span>
    </span>
  );
}