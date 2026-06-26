import React from 'react';
import { Activity, Package, Radio } from 'lucide-react';

function metric(label, value, Icon, color = '#E0A22E') {
  return { label, value, Icon, color };
}

export default function StoreLiveStatusPanel({ products = [], marketPrices = [] }) {
  const listed = products.length;
  const inStock = products.filter((p) => p.category === 'service' || (p.stock || 0) > 0).length;
  const lowStock = products.filter((p) => p.category !== 'service' && (p.stock || 0) > 0 && (p.stock || 0) < 50).length;
  const metrics = [
    metric('LISTED WARES', listed, Package),
    metric('READY NOW', inStock, Activity, '#6FA08F'),
    metric('MARKET LINKS', marketPrices.length || 'SYNC', Radio, '#C8893B'),
  ];

  return (
    <div className="border-t p-3 font-mono" style={{ borderColor: '#2A2118', background: '#0E0C09' }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] tracking-[0.26em]" style={{ color: '#6FA08F' }}>// LIVE TERMINAL</span>
        <span className="flex items-center gap-1 text-[8px] tracking-[0.16em]" style={{ color: '#7BA05B' }}><span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#7BA05B' }} /> SERVICE ONLINE</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {metrics.map(({ label, value, Icon, color }) => (
          <div key={label} className="border p-2" style={{ borderColor: '#3A2F20', background: '#0A0806' }}>
            <Icon className="w-3 h-3 mb-1" style={{ color }} />
            <div className="text-sm font-bold leading-none" style={{ color }}>{value}</div>
            <div className="text-[7px] tracking-[0.14em] mt-1" style={{ color: '#6B6155' }}>{label}</div>
          </div>
        ))}
      </div>
      {lowStock > 0 && <p className="text-[8px] mt-2" style={{ color: '#C8893B' }}>{lowStock} ware{lowStock === 1 ? '' : 's'} flagged low-stock — order early or request restock.</p>}
    </div>
  );
}