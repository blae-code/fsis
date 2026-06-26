import React from 'react';

export default function StorefrontAtmosphere() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'linear-gradient(rgba(224,162,46,0.25) 1px, transparent 1px)', backgroundSize: '100% 5px' }} />
      <div className="absolute inset-0 opacity-60" style={{ background: 'radial-gradient(circle at 18% 12%, rgba(224,162,46,0.08), transparent 28%), radial-gradient(circle at 82% 20%, rgba(111,160,143,0.08), transparent 24%), radial-gradient(circle at 50% 110%, rgba(92,68,36,0.16), transparent 38%)' }} />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.25), transparent 18%, transparent 82%, rgba(0,0,0,0.25))' }} />
    </div>
  );
}