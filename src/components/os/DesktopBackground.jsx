import React from 'react';
import { motion } from 'framer-motion';
import DebrisField from '@/components/three/DebrisField';

export default function DesktopBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Deep space base */}
      <div className="absolute inset-0" style={{ background: 'hsl(30, 10%, 4%)' }} />

      {/* 3D wireframe salvage debris field */}
      <DebrisField />

      {/* Atmospheric glows — bronze command deck */}
      <div
        className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full opacity-[0.05] animate-breathe"
        style={{
          background: 'radial-gradient(ellipse, hsl(38, 75%, 50%), transparent 70%)',
          filter: 'blur(100px)',
          transform: 'translate(-30%, -30%)',
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full opacity-[0.04] animate-breathe"
        style={{
          background: 'radial-gradient(ellipse, hsl(20, 60%, 45%), transparent 70%)',
          filter: 'blur(80px)',
          transform: 'translate(20%, 20%)',
          animationDelay: '2s',
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 w-[800px] h-[400px] rounded-full opacity-[0.03] animate-breathe"
        style={{
          background: 'radial-gradient(ellipse, hsl(210, 40%, 35%), transparent 70%)',
          filter: 'blur(120px)',
          transform: 'translate(-50%, -50%) rotate(15deg)',
          animationDelay: '1s',
        }}
      />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(hsl(38, 60%, 50%) 1px, transparent 1px),
            linear-gradient(90deg, hsl(38, 60%, 50%) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Drifting ambient light — slow fluid wander across the deck */}
      <motion.div
        className="absolute w-[55vw] h-[55vw] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(38, 70%, 48%) 0%, transparent 65%)',
          filter: 'blur(110px)',
          opacity: 0.045,
        }}
        animate={{
          x: ['-10vw', '45vw', '20vw', '-10vw'],
          y: ['-5vh', '30vh', '60vh', '-5vh'],
          scale: [1, 1.15, 0.9, 1],
        }}
        transition={{ duration: 60, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[40vw] h-[40vw] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsl(210, 45%, 40%) 0%, transparent 65%)',
          filter: 'blur(100px)',
          opacity: 0.035,
        }}
        animate={{
          x: ['60vw', '10vw', '70vw', '60vw'],
          y: ['55vh', '10vh', '40vh', '55vh'],
          scale: [0.9, 1.2, 1, 0.9],
        }}
        transition={{ duration: 75, repeat: Infinity, ease: 'easeInOut', delay: 8 }}
      />

      {/* Fine CRT scanline texture */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, hsl(30, 20%, 0%) 3px, hsl(30, 20%, 0%) 4px)',
        }}
      />

      {/* Slow vertical scan sweep */}
      <motion.div
        className="absolute left-0 right-0 h-[22vh]"
        style={{
          background: 'linear-gradient(180deg, transparent, hsl(38, 72%, 52% / 0.025) 45%, hsl(42, 85%, 60% / 0.05) 50%, hsl(38, 72%, 52% / 0.025) 55%, transparent)',
        }}
        animate={{ top: ['-25%', '110%'] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
      />
      {/* Occasional horizontal data sweep */}
      <motion.div
        className="absolute top-0 bottom-0 w-[14vw]"
        style={{
          background: 'linear-gradient(90deg, transparent, hsl(38, 60%, 50% / 0.02) 48%, hsl(42, 85%, 60% / 0.04) 50%, hsl(38, 60%, 50% / 0.02) 52%, transparent)',
        }}
        animate={{ left: ['-15%', '110%'] }}
        transition={{ duration: 23, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
      />

      {/* Vignette to focus attention center-deck */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 75% 70% at 50% 45%, transparent 55%, hsl(30, 12%, 2% / 0.55) 100%)' }}
      />

      {/* Border accent lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" preserveAspectRatio="none">
        <path
          d="M0,100 Q200,50 400,100 T800,80 T1200,120 T1600,90 T2000,110"
          fill="none"
          stroke="hsl(38, 72%, 52%)"
          strokeWidth="0.5"
          className="animate-breathe"
        />
        <path
          d="M0,300 Q300,250 600,320 T1200,280 T1800,310"
          fill="none"
          stroke="hsl(210, 40%, 45%)"
          strokeWidth="0.3"
          className="animate-breathe"
          style={{ animationDelay: '1.5s' }}
        />
      </svg>
    </div>
  );
}