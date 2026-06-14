import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useWindows } from '@/lib/windowContext.jsx';
import { resolveAppContent } from '@/lib/resolveAppContent.jsx';

const AMBER = '#E0A22E';
const GOLD  = '#C8893B';
const DIM   = '#5C4A33';

/** Hex sigil SVG — bevel-cut command mark for the Proprietor */
function ProprietorSigil({ size = 28, glow = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {glow && (
        <circle cx="16" cy="16" r="14" fill={AMBER} opacity="0.07" />
      )}
      {/* Outer hex */}
      <path
        d="M16 2 L27 8.5 V23.5 L16 30 L5 23.5 V8.5 Z"
        stroke={AMBER}
        strokeWidth="1"
        fill="none"
        opacity="0.6"
      />
      {/* Inner diamond */}
      <path
        d="M16 8 L22 16 L16 24 L10 16 Z"
        stroke={GOLD}
        strokeWidth="1"
        fill={AMBER}
        fillOpacity="0.12"
        opacity="0.9"
      />
      {/* Centre dot */}
      <circle cx="16" cy="16" r="2.2" fill={AMBER} opacity="0.9" />
    </svg>
  );
}

export default function ProprietorKey() {
  const [hovered, setHovered] = useState(false);
  const [activated, setActivated] = useState(false);
  const { openWindow } = useWindows();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  if (!user || user.role !== 'admin') return null;

  const handleActivate = () => {
    setActivated(true);
    setTimeout(() => {
      setActivated(false);
      const app = { id: 'management', name: 'Management', icon: 'Settings', status: 'active', color: AMBER };
      const { title, content } = resolveAppContent(app);
      openWindow('management', title, content);
    }, 600);
  };

  return (
    <motion.div
      className="absolute bottom-28 right-6 z-20 flex flex-col items-center gap-2 cursor-pointer select-none"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1.2, duration: 0.6, ease: 'easeOut' }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={handleActivate}
    >
      {/* Tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="font-mono text-[9px] tracking-[0.2em] whitespace-nowrap px-2 py-1"
            style={{
              color: AMBER,
              background: '#0A0806EE',
              border: `1px solid ${DIM}`,
            }}
          >
            MANAGEMENT CONSOLE
          </motion.div>
        )}
      </AnimatePresence>

      {/* Key body */}
      <motion.div
        className="relative flex items-center justify-center"
        style={{ width: 48, height: 48 }}
        animate={activated
          ? { scale: [1, 1.3, 0.9, 1.1, 1], opacity: [1, 1, 1, 1, 0] }
          : hovered
          ? { scale: 1.12 }
          : { scale: 1 }
        }
        transition={activated
          ? { duration: 0.55, ease: 'easeInOut' }
          : { duration: 0.2 }
        }
      >
        {/* Outer ring pulse */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ border: `1px solid ${AMBER}`, borderRadius: '18px 24px 18px 24px' }}
          animate={{ opacity: [0.15, 0.45, 0.15] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Background */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, #0E0C09 0%, #1A140A 100%)`,
            border: `1px solid ${AMBER}44`,
            borderRadius: '18px 24px 18px 24px',
            boxShadow: hovered ? `0 0 18px ${AMBER}30, inset 0 0 12px ${AMBER}0A` : 'none',
            transition: 'box-shadow 0.3s ease',
          }}
        />
        <ProprietorSigil size={26} glow={hovered} />
      </motion.div>

      {/* Label */}
      <span
        className="font-mono text-[8px] tracking-[0.22em]"
        style={{ color: hovered ? AMBER : DIM, transition: 'color 0.2s' }}
      >
        PROPRIETOR
      </span>
    </motion.div>
  );
}