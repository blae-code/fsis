import React from 'react';

export default function RedscarTrustStrip() {
  const items = [
    ['REDSCAR RATE', 'Enter REDSCAR-2956 for 10% preferred pricing.', '#A35A2A'],
    ['NO ACCOUNT REQUIRED', 'Tracking code and handoff passphrase are issued after checkout.', '#8A8F45'],
    ['STOCK RESERVED', 'Physical wares are held once the manifest is transmitted.', '#C8893B'],
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 font-mono">
      {items.map(([label, body, color]) => (
        <div key={label} className="border px-3 py-2" style={{ borderColor: `${color}66`, background: `linear-gradient(135deg, ${color}14, rgba(12, 10, 7, 0.72))` }}>
          <div className="text-[9px] font-bold tracking-[0.18em]" style={{ color }}>{label}</div>
          <p className="text-[9px] mt-1 leading-relaxed" style={{ color: '#9C9080' }}>{body}</p>
        </div>
      ))}
    </div>
  );
}