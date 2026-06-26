import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SalvageCrest, FabricatedCrest, ServiceCrest } from '@/components/brand/glyphs/CategoryCrests';

/* ── palette ─────────────────────────────────────── */
const AMBER  = '#E0A22E';
const TEAL   = '#6FA08F';
const DIM    = '#6F6557';
const PANEL  = '#0C0907';

/* ── category definitions ─────────────────────────
   Arranged clockwise starting from the top (12 o'clock).
   angles are in degrees; 0 = right, so 270 = top.        */
const ITEMS = [
  { key: 'all',               label: 'ALL WARES',  sublabel: 'Show everything',   angle: 270, color: AMBER,  Icon: null },
  { key: 'salvage_commodity', label: 'SALVAGE',    sublabel: 'Reclaimed materials', angle: 342, color: '#C8893B', Icon: SalvageCrest },
  { key: 'loot',              label: 'LOOTED',     sublabel: 'Gear, weapons, parts', angle: 54, color: '#8A8F45', Icon: FabricatedCrest },
  { key: 'fabricated',        label: 'FABRICATED', sublabel: 'Crafted goods',       angle: 126, color: TEAL,  Icon: FabricatedCrest },
  { key: 'service',           label: 'LOGISTICS',  sublabel: 'Services & contracts', angle: 198, color: '#B86F4F', Icon: ServiceCrest },
];

// Convert polar to cartesian, r in px, angle in degrees
function polar(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180; // -90 so 0° = top
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

const R_INNER  = 28;  // hub radius
const R_ORBIT  = 74;  // item centre distance
const R_ITEM   = 24;  // item circle radius
const SVG_SIZE = 220; // total SVG canvas
const CX = SVG_SIZE / 2;
const CY = SVG_SIZE / 2;

/* Thin arc path between two angles */
function arcPath(cx, cy, r, startDeg, endDeg) {
  const s = polar(cx, cy, r, startDeg);
  const e = polar(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

export default function CategoryRadialMenu({ category, setCategory }) {
  const [open, setOpen]     = useState(false);
  const [hovered, setHovered] = useState(null);
  const menuRef             = useRef(null);

  const active = ITEMS.find((i) => i.key === category) || ITEMS[0];

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Keyboard: Escape closes
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const select = useCallback((key) => {
    setCategory(key);
    setOpen(false);
  }, [setCategory]);

  return (
    <div ref={menuRef} className="relative shrink-0 select-none" style={{ zIndex: 50 }}>

      {/* ── Trigger button ─────────────────────────────────── */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileTap={{ scale: 0.93 }}
        className="relative h-9 px-3 flex items-center gap-2 font-mono text-[9px] tracking-[0.14em] font-bold"
        style={{
          background: open ? 'linear-gradient(160deg,#8A6430,#4A3722)' : '#0C0A07',
          border: `1px solid ${open ? '#B0793A' : '#2A2118'}`,
          clipPath: 'polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)',
          color: open ? '#F4ECDB' : DIM,
        }}
      >
        {active.Icon && (
          <active.Icon className="w-3 h-3" style={{ color: open ? AMBER : TEAL }} />
        )}
        <span>{active.label}</span>
        {/* Rotating indicator chevron */}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="font-mono text-[8px]"
          style={{ color: open ? AMBER : DIM }}
        >▾</motion.span>
      </motion.button>

      {/* ── Radial overlay ─────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.65 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className="absolute left-1/2"
            style={{
              top: '110%',
              translateX: '-50%',
              width: SVG_SIZE,
              height: SVG_SIZE,
              transformOrigin: '50% 0%',
            }}
          >
            {/* Backdrop blur panel */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'radial-gradient(circle at 50% 50%, rgba(18,14,8,0.97) 38%, rgba(12,10,6,0.92) 100%)',
                border: '1px solid #3A2E1A',
                boxShadow: '0 8px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(212,146,11,0.06) inset',
                backdropFilter: 'blur(12px)',
              }}
            />

            <svg width={SVG_SIZE} height={SVG_SIZE} className="absolute inset-0">
              {/* Decorative orbit rings */}
              <circle cx={CX} cy={CY} r={R_ORBIT} stroke="#2A2118" strokeWidth="0.7" fill="none" strokeDasharray="2 6" />
              <circle cx={CX} cy={CY} r={R_ORBIT + 18} stroke="#1A1510" strokeWidth="0.5" fill="none" strokeDasharray="1 10" />
              <circle cx={CX} cy={CY} r={R_INNER + 6} stroke="#3A2E1A" strokeWidth="0.7" fill="none" />

              {/* Connector spokes */}
              {ITEMS.map((item) => {
                const tip = polar(CX, CY, R_ORBIT - R_ITEM - 2, item.angle);
                const base = polar(CX, CY, R_INNER + 6, item.angle);
                const isHov = hovered === item.key;
                const isSel = category === item.key;
                return (
                  <motion.line
                    key={item.key}
                    x1={base.x} y1={base.y}
                    x2={tip.x}  y2={tip.y}
                    stroke={isSel ? item.color : isHov ? '#5C4A33' : '#2A2118'}
                    strokeWidth={isSel ? 1.2 : 0.7}
                    strokeDasharray={isSel ? 'none' : '3 4'}
                    animate={{ opacity: isHov || isSel ? 1 : 0.55 }}
                    transition={{ duration: 0.2 }}
                  />
                );
              })}

              {/* Sweeping scan arc — Xi'an aesthetic */}
              <motion.path
                d={arcPath(CX, CY, R_ORBIT + 5, 270, 270 + 90)}
                stroke={TEAL}
                strokeWidth="0.6"
                fill="none"
                opacity="0.4"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                style={{ transformOrigin: `${CX}px ${CY}px` }}
              />
            </svg>

            {/* ── Hub: active label ─────────────────────────── */}
            <div
              className="absolute flex flex-col items-center justify-center text-center pointer-events-none"
              style={{ left: CX - R_INNER, top: CY - R_INNER, width: R_INNER * 2, height: R_INNER * 2 }}
            >
              <span className="font-mono text-[7px] tracking-[0.2em] leading-tight" style={{ color: active.color }}>
                {active.label}
              </span>
              {active.Icon && <active.Icon style={{ width: 10, height: 10, color: active.color, marginTop: 2 }} />}
            </div>

            {/* ── Orbital item buttons ───────────────────────── */}
            {ITEMS.map((item, idx) => {
              const pos   = polar(CX, CY, R_ORBIT, item.angle);
              const isSel = category === item.key;
              const isHov = hovered === item.key;

              return (
                <motion.button
                  key={item.key}
                  onClick={() => select(item.key)}
                  onMouseEnter={() => setHovered(item.key)}
                  onMouseLeave={() => setHovered(null)}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    type: 'spring', stiffness: 500, damping: 30,
                    delay: idx * 0.055,
                  }}
                  whileHover={{ scale: 1.18 }}
                  whileTap={{ scale: 0.88 }}
                  className="absolute flex flex-col items-center justify-center"
                  style={{
                    left: pos.x - R_ITEM,
                    top:  pos.y - R_ITEM,
                    width: R_ITEM * 2,
                    height: R_ITEM * 2,
                    borderRadius: '50%',
                    background: isSel
                      ? `radial-gradient(circle at 40% 35%, ${item.color}33, ${item.color}11)`
                      : isHov ? 'rgba(30,22,12,0.9)' : 'rgba(14,11,7,0.85)',
                    border: `1px solid ${isSel ? item.color : isHov ? '#5C4A33' : '#2A2118'}`,
                    boxShadow: isSel ? `0 0 18px ${item.color}40, inset 0 0 10px ${item.color}18` : 'none',
                    cursor: 'pointer',
                  }}
                >
                  {item.Icon ? (
                    <item.Icon style={{ width: 14, height: 14, color: isSel ? item.color : isHov ? '#C8B08A' : DIM }} />
                  ) : (
                    <span className="font-mono text-[8px] font-bold" style={{ color: isSel ? AMBER : DIM }}>✦</span>
                  )}
                  <span
                    className="font-mono font-bold leading-none mt-0.5"
                    style={{ fontSize: 7, letterSpacing: '0.08em', color: isSel ? item.color : isHov ? '#D8CFC0' : DIM }}
                  >
                    {item.label.split(' ')[0]}
                  </span>
                </motion.button>
              );
            })}

            {/* ── Tooltip for hovered item ───────────────────── */}
            <AnimatePresence>
              {hovered && (() => {
                const item = ITEMS.find((i) => i.key === hovered);
                if (!item) return null;
                return (
                  <motion.div
                    key={hovered}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-1/2 font-mono text-center pointer-events-none"
                    style={{ bottom: 10, translateX: '-50%', minWidth: 120 }}
                  >
                    <div className="text-[8px] font-bold tracking-[0.15em]" style={{ color: item.color }}>{item.label}</div>
                    <div className="text-[7px]" style={{ color: DIM }}>{item.sublabel}</div>
                  </motion.div>
                );
              })()}
            </AnimatePresence>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}