import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWindows } from '@/lib/windowContext.jsx';
import { resolveAppContent } from '@/lib/resolveAppContent.jsx';

// Hidden command sequence — type F S I S anywhere on the desktop (not in an input)
// Only activates for admin-role users. Invisible to anyone who doesn't know it.
const SEQUENCE = ['f', 's', 'i', 's'];

const AMBER = '#E0A22E';
const GOLD  = '#C8893B';
const DIM   = '#3A2A14';

function HexRing({ size, delay, duration }) {
  return (
    <motion.div
      className="absolute rounded-full border"
      style={{
        width: size,
        height: size,
        borderColor: AMBER,
        top: '50%',
        left: '50%',
        x: '-50%',
        y: '-50%',
      }}
      initial={{ scale: 0.3, opacity: 0.8 }}
      animate={{ scale: 2.2, opacity: 0 }}
      transition={{ delay, duration, ease: 'easeOut' }}
    />
  );
}

export default function CommandAccess({ userRole }) {
  const [progress, setProgress] = useState([]); // chars typed so far
  const [phase, setPhase] = useState('idle'); // idle | unlocking | open
  const progressRef = useRef([]);
  const timeoutRef = useRef(null);
  const { openWindow } = useWindows();

  useEffect(() => {
    if (userRole !== 'admin') return;

    const onKey = (e) => {
      const t = e.target;
      // Don't fire while typing in any input
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return;

      const key = e.key.toLowerCase();
      const expected = SEQUENCE[progressRef.current.length];

      if (key === expected) {
        const next = [...progressRef.current, key];
        progressRef.current = next;
        setProgress([...next]);

        // Reset decay timer — if they pause 1.5s mid-sequence, reset
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          progressRef.current = [];
          setProgress([]);
        }, 1500);

        if (next.length === SEQUENCE.length) {
          // Full sequence matched — trigger unlock
          progressRef.current = [];
          setProgress([]);
          clearTimeout(timeoutRef.current);
          setPhase('unlocking');
          setTimeout(() => {
            setPhase('idle');
            const app = { id: 'management', name: 'Management', icon: 'Settings', status: 'active' };
            const { title, content } = resolveAppContent(app);
            openWindow('management', title, content);
          }, 1800);
        }
      } else if (key === SEQUENCE[0]) {
        // Restart from first char
        progressRef.current = [key];
        setProgress([key]);
        clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          progressRef.current = [];
          setProgress([]);
        }, 1500);
      } else {
        progressRef.current = [];
        setProgress([]);
        clearTimeout(timeoutRef.current);
      }
    };

    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      clearTimeout(timeoutRef.current);
    };
  }, [userRole, openWindow]);

  // Subtle progress pips — only shown while actively typing the sequence
  const showPips = progress.length > 0 && phase === 'idle';

  return (
    <>
      {/* Progress pips — barely visible, bottom-left corner */}
      <AnimatePresence>
        {showPips && (
          <motion.div
            className="fixed bottom-20 left-4 z-[300] flex items-center gap-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {SEQUENCE.map((_, i) => (
              <motion.div
                key={i}
                className="rounded-full"
                style={{
                  width: 5,
                  height: 5,
                  background: i < progress.length ? AMBER : DIM,
                  boxShadow: i < progress.length ? `0 0 6px ${AMBER}80` : 'none',
                }}
                animate={i < progress.length ? { scale: [1, 1.4, 1] } : { scale: 1 }}
                transition={{ duration: 0.2 }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unlock cinematic — full-screen radial burst */}
      <AnimatePresence>
        {phase === 'unlocking' && (
          <motion.div
            className="fixed inset-0 z-[500] flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Dark vignette */}
            <motion.div
              className="absolute inset-0"
              style={{ background: 'radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.85) 100%)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            />

            {/* Expanding hex rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <HexRing size={80}  delay={0}    duration={1.4} />
              <HexRing size={160} delay={0.15} duration={1.4} />
              <HexRing size={280} delay={0.3}  duration={1.4} />
              <HexRing size={450} delay={0.45} duration={1.4} />
            </div>

            {/* Centre sigil */}
            <motion.div
              className="relative flex flex-col items-center gap-3"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.3, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 20 }}
            >
              {/* Hex frame */}
              <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
                <motion.path
                  d="M36 4 L62 19 V53 L36 68 L10 53 V19 Z"
                  stroke={AMBER}
                  strokeWidth="1.5"
                  fill="none"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.6, ease: 'easeInOut' }}
                />
                <motion.path
                  d="M36 16 L52 26 V46 L36 56 L20 46 V26 Z"
                  stroke={GOLD}
                  strokeWidth="1"
                  fill={AMBER}
                  fillOpacity="0.07"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.8 }}
                  transition={{ duration: 0.6, delay: 0.2, ease: 'easeInOut' }}
                />
                <motion.circle
                  cx="36" cy="36" r="5"
                  fill={AMBER}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring', stiffness: 400 }}
                />
              </svg>

              {/* Label */}
              <motion.div
                className="font-mono text-center"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <p className="text-[11px] tracking-[0.4em] font-bold" style={{ color: AMBER }}>
                  COMMAND ACCESS
                </p>
                <p className="text-[9px] tracking-[0.25em] mt-1" style={{ color: GOLD }}>
                  PROPRIETOR CLEARANCE GRANTED
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}