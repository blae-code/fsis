import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

/** Tactile +/− stepper with hold-to-repeat for manifest quantities.
 *  Replaces the raw <input type="number"> in the order panel. */
export default function ManifestStepper({ value, onChange, min = 1, max = Infinity }) {
  const holdRef = useRef(null);
  const intervalRef = useRef(null);

  const step = (dir) => {
    onChange(Math.min(max, Math.max(min, value + dir)));
  };

  const startHold = (dir) => {
    holdRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        onChange((v) => Math.min(max, Math.max(min, v + dir)));
      }, 80);
    }, 500);
  };

  const endHold = () => {
    clearTimeout(holdRef.current);
    clearInterval(intervalRef.current);
  };

  useEffect(() => () => { clearTimeout(holdRef.current); clearInterval(intervalRef.current); }, []);

  const btnStyle = (side) => ({
    background: 'linear-gradient(160deg, #2A2017, #1A1410)',
    border: '1px solid #3A2F20',
    color: '#C8A05B',
    clipPath: side === 'left'
      ? 'polygon(6px 0, 100% 0, 100% 100%, 0 100%, 0 6px)'
      : 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)',
  });

  return (
    <div className="flex items-center h-7 font-mono select-none shrink-0">
      <motion.button
        whileTap={{ scale: 0.88 }}
        className="w-7 h-full flex items-center justify-center text-sm font-bold transition-colors hover:brightness-125"
        style={btnStyle('left')}
        onClick={() => step(-1)}
        onPointerDown={() => startHold(-1)}
        onPointerUp={endHold}
        onPointerLeave={endHold}
        disabled={value <= min}
      >
        <svg viewBox="0 0 14 14" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M2.5 7 H11.5" />
        </svg>
      </motion.button>

      <div
        className="h-full flex items-center justify-center text-[11px] font-bold px-2 min-w-[2.4rem] text-center border-y"
        style={{ borderColor: '#3A2F20', background: '#0E0C09', color: '#E0A22E' }}
      >
        {value}
      </div>

      <motion.button
        whileTap={{ scale: 0.88 }}
        className="w-7 h-full flex items-center justify-center text-sm font-bold transition-colors hover:brightness-125"
        style={btnStyle('right')}
        onClick={() => step(1)}
        onPointerDown={() => startHold(1)}
        onPointerUp={endHold}
        onPointerLeave={endHold}
        disabled={value >= max}
      >
        <svg viewBox="0 0 14 14" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M7 2.5 V11.5 M2.5 7 H11.5" />
        </svg>
      </motion.button>
    </div>
  );
}