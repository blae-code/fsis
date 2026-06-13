import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import UplinkGlyph from '@/components/brand/glyphs/UplinkGlyph';

const HOLD_MS = 1000;

/** Bespoke hold-to-confirm uplink control — press and hold to charge the
 *  transmission; releasing early aborts. Replaces a traditional submit button. */
export default function HoldToTransmit({ disabled, pending, onConfirm }) {
  const [holding, setHolding] = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const start = () => {
    if (disabled || pending) return;
    setHolding(true);
    timer.current = setTimeout(() => {
      setHolding(false);
      onConfirm();
    }, HOLD_MS);
  };

  const cancel = () => {
    clearTimeout(timer.current);
    setHolding(false);
  };

  return (
    <button
      disabled={disabled || pending}
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onKeyDown={(e) => e.key === 'Enter' && !pending && onConfirm()}
      className="relative w-full h-10 font-mono text-xs font-bold disabled:opacity-40 disabled:pointer-events-none overflow-hidden select-none touch-none"
      style={{
        background: '#241C12',
        border: '1px solid #8A6430',
        color: holding ? '#1A1206' : '#E0A22E',
        clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)',
      }}
    >
      {/* Charge fill */}
      <motion.span
        className="absolute inset-y-0 left-0 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, #E8B13A, #BD7E16)' }}
        initial={false}
        animate={{ width: holding ? '100%' : '0%' }}
        transition={holding ? { duration: HOLD_MS / 1000, ease: 'linear' } : { duration: 0.18 }}
      />
      <span className="relative inline-flex items-center justify-center gap-2 w-full transition-colors" style={{ color: holding ? '#1A1206' : undefined }}>
        {pending ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> TRANSMITTING…</>
        ) : holding ? (
          <><UplinkGlyph className="w-4 h-4" charging /> CHARGING UPLINK…</>
        ) : (
          <><UplinkGlyph className="w-4 h-4" /> HOLD TO TRANSMIT ORDER</>
        )}
      </span>
    </button>
  );
}