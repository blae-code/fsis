import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pin, Eye, Bell } from 'lucide-react';

/** The four radial actions and their angular positions (degrees from top, clockwise) */
const ACTIONS = [
  { id: 'view',   angle: -90, label: 'DOSSIER',  Icon: Eye,  color: '#6FA08F' },
  { id: 'add',    angle: 0,   label: 'LOAD',      Icon: null, color: '#E0A22E' },
  { id: 'pin',    angle: 90,  label: 'PIN',       Icon: Pin,  color: '#C8A05B' },
  { id: 'notify', angle: 180, label: 'NOTIFY',    Icon: Bell, color: '#8A7E6C' },
];

const R = 44; // orbit radius px

function polarToXY(angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: Math.cos(rad) * R, y: Math.sin(rad) * R };
}

/** Right-click / long-press radial command wheel for product cards.
 *  Renders relative to the card's top-left (position: absolute). */
export default function CardRadialMenu({ product, pinned, inStock, onAdd, onView, onTogglePin, onRestockNotify }) {
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(null);
  const longPressRef = useRef(null);
  const menuRef = useRef(null);

  const show = useCallback((e) => {
    e.preventDefault();
    const rect = e.currentTarget.closest('[data-radial-host]')?.getBoundingClientRect();
    if (!rect) return;
    setOrigin({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setOpen(true);
  }, []);

  const hide = useCallback(() => { setOpen(false); setHovered(null); }, []);

  // Click-outside
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (!menuRef.current?.contains(e.target)) hide();
    };
    window.addEventListener('pointerdown', handler);
    return () => window.removeEventListener('pointerdown', handler);
  }, [open, hide]);

  // Long-press for mobile
  const onPointerDown = (e) => {
    longPressRef.current = setTimeout(() => show(e), 420);
  };
  const onPointerUp = () => clearTimeout(longPressRef.current);

  const fire = (id) => {
    hide();
    if (id === 'view') onView?.(product);
    else if (id === 'add' && inStock) onAdd?.(product);
    else if (id === 'pin') onTogglePin?.(product.id);
    else if (id === 'notify') onRestockNotify?.(product);
  };

  return (
    <>
      {/* Invisible capture layer — right-click & long-press */}
      <div
        className="absolute inset-0 z-10"
        onContextMenu={show}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        style={{ cursor: 'context-menu' }}
      />

      <AnimatePresence>
        {open && (
          <motion.div
            ref={menuRef}
            className="absolute z-50 pointer-events-none"
            style={{ left: origin.x, top: origin.y }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
          >
            {/* Central dot */}
            <div
              className="absolute w-3 h-3 rounded-full"
              style={{
                left: -6, top: -6,
                background: '#E0A22E',
                boxShadow: '0 0 10px rgba(224, 162, 46, 0.8)',
              }}
            />

            {/* Sweep ring */}
            <motion.div
              className="absolute rounded-full"
              style={{
                left: -(R + 20), top: -(R + 20),
                width: (R + 20) * 2, height: (R + 20) * 2,
                border: '1px solid rgba(176, 121, 58, 0.2)',
              }}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            />

            {/* Action nodes */}
            {ACTIONS.map(({ id, angle, label, Icon, color }, i) => {
              const { x, y } = polarToXY(angle);
              const isActive = id === 'add' ? inStock : true;
              const isPinActive = id === 'pin' && pinned;
              const isHov = hovered === id;

              return (
                <motion.button
                  key={id}
                  className="absolute flex flex-col items-center gap-1 pointer-events-auto"
                  style={{
                    left: x - 20, top: y - 20,
                    width: 40, height: 40,
                    opacity: isActive ? 1 : 0.3,
                    cursor: isActive ? 'pointer' : 'not-allowed',
                  }}
                  initial={{ x: 0, y: 0, opacity: 0 }}
                  animate={{ x: 0, y: 0, opacity: isActive ? 1 : 0.3 }}
                  exit={{ x: 0, y: 0, opacity: 0 }}
                  transition={{ duration: 0.16, delay: i * 0.03 }}
                  onHoverStart={() => setHovered(id)}
                  onHoverEnd={() => setHovered(null)}
                  onClick={() => isActive && fire(id)}
                >
                  {/* Node plate */}
                  <motion.div
                    className="w-9 h-9 flex items-center justify-center"
                    animate={{ scale: isHov ? 1.18 : 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    style={{
                      background: isHov
                        ? `linear-gradient(160deg, ${color}40, ${color}20)`
                        : 'linear-gradient(160deg, #1C170F, #120E09)',
                      border: `1px solid ${isHov || isPinActive ? color : 'rgba(176, 121, 58, 0.35)'}`,
                      clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)',
                      boxShadow: isHov ? `0 0 14px ${color}40` : 'none',
                    }}
                  >
                    {id === 'add' ? (
                      /* Bespoke plus-cross glyph */
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke={isHov ? color : '#C8A05B'} strokeWidth="2.2" strokeLinecap="round">
                        <path d="M12 5 V19 M5 12 H19" />
                      </svg>
                    ) : (
                      Icon && <Icon className="w-4 h-4" style={{ color: isHov || isPinActive ? color : '#9C9080', fill: isPinActive ? color : 'none' }} strokeWidth={1.8} />
                    )}
                  </motion.div>

                  {/* Label */}
                  <AnimatePresence>
                    {isHov && (
                      <motion.span
                        className="absolute font-mono text-[8px] font-bold tracking-[0.15em] whitespace-nowrap px-1.5 py-0.5"
                        style={{
                          top: '100%', left: '50%', x: '-50%',
                          background: '#0E0C09',
                          border: `1px solid ${color}60`,
                          color,
                          clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)',
                        }}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 2 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}