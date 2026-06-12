import React from 'react';
import DebrisField from '@/components/three/DebrisField';

export default function DesktopBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Deep space base */}
      <div className="absolute inset-0" style={{ background: 'hsl(180, 15%, 4%)' }} />

      {/* 3D wireframe salvage debris field */}
      <DebrisField />

      {/* Organic flowing shapes — Xi'an aesthetic */}
      <div
        className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full opacity-[0.04] animate-breathe"
        style={{
          background: 'radial-gradient(ellipse, hsl(168, 80%, 45%), transparent 70%)',
          filter: 'blur(100px)',
          transform: 'translate(-30%, -30%)',
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full opacity-[0.03] animate-breathe"
        style={{
          background: 'radial-gradient(ellipse, hsl(155, 50%, 40%), transparent 70%)',
          filter: 'blur(80px)',
          transform: 'translate(20%, 20%)',
          animationDelay: '2s',
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 w-[800px] h-[400px] rounded-full opacity-[0.02] animate-breathe"
        style={{
          background: 'radial-gradient(ellipse, hsl(180, 40%, 30%), transparent 70%)',
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
            linear-gradient(hsl(168, 65%, 45%) 1px, transparent 1px),
            linear-gradient(90deg, hsl(168, 65%, 45%) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px',
        }}
      />

      {/* Organic border accent lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" preserveAspectRatio="none">
        <path
          d="M0,100 Q200,50 400,100 T800,80 T1200,120 T1600,90 T2000,110"
          fill="none"
          stroke="hsl(168, 65%, 45%)"
          strokeWidth="0.5"
          className="animate-breathe"
        />
        <path
          d="M0,300 Q300,250 600,320 T1200,280 T1800,310"
          fill="none"
          stroke="hsl(155, 50%, 35%)"
          strokeWidth="0.3"
          className="animate-breathe"
          style={{ animationDelay: '1.5s' }}
        />
      </svg>
    </div>
  );
}