import React from 'react';
import { motion } from 'framer-motion';

const shimmer = {
  animate: { backgroundPosition: ['200% 0', '-200% 0'] },
  transition: { duration: 2.4, repeat: Infinity, ease: 'linear' },
};

function SkeletonBlock({ w = '100%', h = 12, className = '' }) {
  return (
    <motion.div
      className={`rounded-sm ${className}`}
      style={{
        width: w, height: h,
        background: 'linear-gradient(90deg, #1A1510 25%, #2A2018 50%, #1A1510 75%)',
        backgroundSize: '400% 100%',
      }}
      {...shimmer}
    />
  );
}

export function SkeletonProductCard() {
  return (
    <div className="border p-3 space-y-2.5 font-mono"
      style={{ background: '#111009', borderColor: '#2A2118', clipPath: 'polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)' }}>
      <SkeletonBlock h={10} w="60%" />
      <SkeletonBlock h={8} w="40%" />
      <SkeletonBlock h={24} />
      <div className="flex gap-2">
        <SkeletonBlock h={8} w="50%" />
        <SkeletonBlock h={8} w="30%" />
      </div>
      <SkeletonBlock h={32} />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 px-3 py-2 border-b" style={{ borderColor: '#1A1510' }}>
      <SkeletonBlock w={32} h={32} className="shrink-0" />
      <div className="flex-1 space-y-1.5">
        <SkeletonBlock h={10} w="55%" />
        <SkeletonBlock h={8} w="35%" />
      </div>
      <SkeletonBlock w={60} h={22} className="shrink-0" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="border font-mono" style={{ borderColor: '#2A2118' }}>
      {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} />)}
    </div>
  );
}

export function SkeletonGrid({ cols = 3, rows = 2 }) {
  return (
    <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {Array.from({ length: cols * rows }).map((_, i) => <SkeletonProductCard key={i} />)}
    </div>
  );
}

export default SkeletonBlock;