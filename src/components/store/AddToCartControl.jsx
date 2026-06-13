import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, PackageCheck } from 'lucide-react';

/** Bespoke "load crate" control — angled bronze plate that latches shut with a
 *  pulse ring and LOADED confirmation instead of a traditional button. */
export default function AddToCartControl({ disabled, onAdd }) {
  const [state, setState] = useState('idle'); // idle | loaded
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const fire = (e) => {
    e.stopPropagation();
    if (state === 'loaded') return;
    onAdd();
    setState('loaded');
    timer.current = setTimeout(() => setState('idle'), 1100);
  };

  return (
    <motion.button
      disabled={disabled}
      onClick={fire}
      whileTap={{ scale: 0.92 }}
      className="relative h-8 px-5 font-mono text-[11px] font-bold inline-flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none overflow-visible"
      style={{
        background: state === 'loaded'
          ? 'linear-gradient(180deg, #6FA463, #3E6B38)'
          : 'linear-gradient(180deg, #E8B13A, #BD7E16)',
        color: '#1A1206',
        clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255, 235, 190, 0.4)',
        transition: 'background 0.25s',
      }}
    >
      {/* Latch pulse ring */}
      <AnimatePresence>
        {state === 'loaded' && (
          <motion.span
            className="absolute inset-0 pointer-events-none"
            style={{ border: '2px solid #E8B13A', clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)' }}
            initial={{ opacity: 0.9, scale: 1 }}
            animate={{ opacity: 0, scale: 1.6 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait" initial={false}>
        {state === 'loaded' ? (
          <motion.span
            key="loaded"
            className="inline-flex items-center gap-1.5"
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ duration: 0.16 }}
          >
            <PackageCheck className="w-3.5 h-3.5" strokeWidth={2.5} /> LOADED
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            className="inline-flex items-center gap-1"
            initial={{ y: 8, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ duration: 0.16 }}
          >
            <Plus className="w-3 h-3" strokeWidth={3} /> ADD
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}