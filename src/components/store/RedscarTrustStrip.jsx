import React from 'react';

export default function RedscarTrustStrip() {
  const items = [
    ['REDSCAR RATE', 'Enter REDSCAR-2956 for 10% preferred pricing.'],
    ['NO ACCOUNT REQUIRED', 'Tracking code and handoff passphrase are issued after checkout.'],
    ['STOCK RESERVED', 'Physical wares are held once the manifest is transmitted.'],
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 font-mono">
      {items.map(([label, body]) => (
        <div key={label} className="border px-3 py-2" style={{ borderColor: '#3C5A50', background: 'rgba(111, 160, 143, 0.07)' }}>
          <div className="text-[9px] font-bold tracking-[0.18em]" style={{ color: '#6FA08F' }}>{label}</div>
          <p className="text-[9px] mt-1 leading-relaxed" style={{ color: '#9C9080' }}>{body}</p>
        </div>
      ))}
    </div>
  );
}