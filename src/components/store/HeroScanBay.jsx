import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import HexCrate from '@/components/three/HexCrate';
import SerialStrip from '@/components/brand/SerialStrip';
import { FSIS, FLEET_REGISTRY } from '@/lib/fsisLore';

const BRONZE = '#B0793A';
const AMBER = '#D4920B';
const BONE = '#D8CFC0';
const DIM = '#8A7E6C';

/** Immersive cargo-bay live-scan readout that frames the rotating HexCrate */
export default function HeroScanBay({ products = [] }) {
  const [tick, setTick] = useState(0);
  const [hullIdx, setHullIdx] = useState(0);

  // Slow telemetry tick + rotating fleet designation
  useEffect(() => {
    const t = setInterval(() => setTick((v) => v + 1), 1800);
    const h = setInterval(() => setHullIdx((v) => (v + 1) % FLEET_REGISTRY.length), 5400);
    return () => { clearInterval(t); clearInterval(h); };
  }, []);

  const totalStock = products.reduce((t, p) => t + (p.stock || 0), 0);
  const skus = products.length;
  const hull = FLEET_REGISTRY[hullIdx];

  // Deterministic wobble for fake telemetry
  const wob = (base, amp, phase = 0) => (base + Math.sin(tick * 0.9 + phase) * amp).toFixed(1);

  return (
    <div
      className="hidden md:flex flex-col relative overflow-hidden"
      style={{ background: '#080705', borderLeft: '2px solid #5C4424' }}
    >
      {/* Backdrop: radial glow + blueprint grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 55% at 50% 42%, rgba(212, 146, 11, 0.10), transparent 70%)',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.13]"
        style={{
          backgroundImage: `linear-gradient(${BRONZE}22 1px, transparent 1px), linear-gradient(90deg, ${BRONZE}22 1px, transparent 1px)`,
          backgroundSize: '22px 22px',
        }}
      />

      {/* Sweeping scan beam */}
      <motion.div
        className="absolute left-0 right-0 h-10 pointer-events-none"
        style={{ background: `linear-gradient(180deg, transparent, ${AMBER}1E 50%, ${AMBER}40 52%, transparent 54%)` }}
        animate={{ top: ['-12%', '108%'] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'linear' }}
      />

      {/* Feed header */}
      <div className="relative flex items-center justify-between px-4 pt-3">
        <div className="flex items-center gap-1.5 font-mono text-[9px] tracking-[0.25em]" style={{ color: BRONZE }}>
          <motion.span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ background: '#C24141' }}
            animate={{ opacity: [1, 0.15, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
          BAY 03 • LIVE
        </div>
        <span className="font-mono text-[9px] tracking-[0.15em]" style={{ color: DIM }}>
          CAM-7 / 2956
        </span>
      </div>

      {/* Crate + scanner ring */}
      <div className="relative flex-1 flex items-center justify-center min-h-[210px]">
        {/* Rotating dashed targeting ring */}
        <motion.svg
          width="232" height="232" viewBox="0 0 232 232"
          className="absolute pointer-events-none"
          animate={{ rotate: 360 }}
          transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
        >
          <circle cx="116" cy="116" r="106" fill="none" stroke={BRONZE} strokeOpacity="0.35" strokeWidth="1" strokeDasharray="3 9" />
          <circle cx="116" cy="116" r="96" fill="none" stroke={AMBER} strokeOpacity="0.18" strokeWidth="5" strokeDasharray="40 200" />
        </motion.svg>
        {/* Counter-rotating inner ring */}
        <motion.svg
          width="190" height="190" viewBox="0 0 190 190"
          className="absolute pointer-events-none"
          animate={{ rotate: -360 }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
        >
          <circle cx="95" cy="95" r="86" fill="none" stroke={BRONZE} strokeOpacity="0.22" strokeWidth="1" strokeDasharray="18 14" />
        </motion.svg>

        {/* Crosshair brackets */}
        <svg width="244" height="244" viewBox="0 0 244 244" className="absolute pointer-events-none opacity-60">
          {[[8, 8, 1, 1], [236, 8, -1, 1], [8, 236, 1, -1], [236, 236, -1, -1]].map(([x, y, dx, dy], i) => (
            <path key={i} d={`M ${x} ${y + dy * 18} L ${x} ${y} L ${x + dx * 18} ${y}`} fill="none" stroke={AMBER} strokeWidth="1.5" />
          ))}
          <line x1="122" y1="2" x2="122" y2="14" stroke={BRONZE} strokeWidth="1" strokeOpacity="0.5" />
          <line x1="122" y1="230" x2="122" y2="242" stroke={BRONZE} strokeWidth="1" strokeOpacity="0.5" />
        </svg>

        <HexCrate size={190} />

        {/* Floating analysis tags */}
        <motion.div
          className="absolute font-mono text-[8px] tracking-[0.15em] px-1.5 py-0.5"
          style={{ top: '18%', right: '8%', color: AMBER, border: `1px solid ${BRONZE}55`, background: '#0D0B09CC' }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 6, repeat: Infinity, times: [0, 0.1, 0.85, 1] }}
        >
          HEX-CRATE / 1 SCU
        </motion.div>
        <motion.div
          className="absolute font-mono text-[8px] tracking-[0.15em] px-1.5 py-0.5"
          style={{ bottom: '16%', left: '7%', color: BONE, border: `1px solid ${BRONZE}55`, background: '#0D0B09CC' }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 6, repeat: Infinity, delay: 3, times: [0, 0.1, 0.85, 1] }}
        >
          CONTENTS: RMC — VERIFIED
        </motion.div>
      </div>

      {/* Telemetry readout */}
      <div className="relative px-4 pb-1 grid grid-cols-3 gap-px font-mono" style={{ background: 'transparent' }}>
        {[
          ['STOCK', `${totalStock.toLocaleString()} SCU`],
          ['WARES', `${skus} SKU`],
          ['MASS', `${wob(38.2, 0.4)} kT`],
        ].map(([label, val]) => (
          <div key={label} className="px-2 py-1.5 text-center" style={{ background: '#0D0B09', border: `1px solid ${BRONZE}33` }}>
            <div className="text-[8px] tracking-[0.2em]" style={{ color: DIM }}>{label}</div>
            <div className="text-[10px] font-bold" style={{ color: AMBER }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Rotating fleet line */}
      <div className="relative px-4 py-1.5 font-mono text-[9px] flex items-center justify-between" style={{ borderTop: `1px solid ${BRONZE}26` }}>
        <motion.span key={hullIdx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: BONE }}>
          {hull.hull} "{hull.name}" — {hull.role.toUpperCase()}
        </motion.span>
        <span style={{ color: '#5FA463' }}>● DOCKED</span>
      </div>

      {/* License + serial footer */}
      <div className="relative px-4 pb-3 pt-1 flex items-center justify-between" style={{ borderTop: `1px solid ${BRONZE}26` }}>
        <SerialStrip seed={FSIS.license} />
        <p className="font-mono text-[9px] tracking-[0.18em]" style={{ color: BRONZE }}>{FSIS.license}</p>
      </div>
    </div>
  );
}