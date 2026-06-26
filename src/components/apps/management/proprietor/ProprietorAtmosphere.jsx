import React from 'react';

export default function ProprietorAtmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 12% 8%, rgba(224,162,46,0.12), transparent 24%), radial-gradient(circle at 76% 18%, rgba(138,143,69,0.10), transparent 28%), linear-gradient(180deg, rgba(8,6,4,0), rgba(8,6,4,0.82))' }} />
      <div className="absolute inset-x-0 top-0 h-32" style={{ background: 'linear-gradient(180deg, rgba(92,68,36,0.18), transparent)' }} />
      <svg className="absolute right-6 top-8 opacity-25" width="260" height="260" viewBox="0 0 260 260">
        <circle cx="130" cy="130" r="112" fill="none" stroke="#5C4424" strokeWidth="1" />
        <circle cx="130" cy="130" r="72" fill="none" stroke="#8A8F45" strokeWidth="1" strokeDasharray="6 10" />
        <path d="M130 18v224M18 130h224" stroke="#3A2F20" strokeWidth="1" />
        <path d="M130 130L226 76" stroke="#E0A22E" strokeWidth="2" opacity="0.65" />
      </svg>
      <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(rgba(237,229,214,0.6) 1px, transparent 1px)', backgroundSize: '100% 4px' }} />
    </div>
  );
}