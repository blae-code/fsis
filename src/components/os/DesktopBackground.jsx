import React from 'react';
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