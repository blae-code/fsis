import React from 'react';

export default function ProprietorProgressRail({ orders = [], loot = [], products = [], restocks = [] }) {
  const stages = [
    { label: 'INTAKE', detail: `${loot.filter((i) => i.status === 'raw').length} raw loot`, hot: loot.some((i) => i.status === 'raw') },
    { label: 'APPRAISE', detail: `${loot.filter((i) => ['repairing', 'repaired'].includes(i.status)).length} in review`, hot: loot.some((i) => ['repairing', 'repaired'].includes(i.status)) },
    { label: 'FULFILL', detail: `${orders.filter((o) => ['new', 'confirmed', 'in_fulfillment'].includes(o.status)).length} active`, hot: orders.some((o) => ['new', 'confirmed'].includes(o.status)) },
    { label: 'RESTOCK', detail: `${restocks.filter((r) => !r.notified).length} signals`, hot: restocks.some((r) => !r.notified) },
    { label: 'CONTROL', detail: `${products.filter((p) => p.available && (Number(p.stock) || 0) <= 2).length} stock flags`, hot: products.some((p) => p.available && (Number(p.stock) || 0) <= 2) },
  ];
  return (
    <div className="border p-3" style={{ borderColor: '#2A2118', background: 'linear-gradient(90deg,#0C0A07,#100E0B)' }}>
      <div className="flex flex-wrap items-center gap-2">
        {stages.map((s, idx) => <div key={s.label} className="flex-1 min-w-[140px] border px-3 py-2" style={{ borderColor: s.hot ? '#8A6430' : '#2A2118', background: s.hot ? '#160F07' : '#0A0806' }}><div className="flex items-center justify-between"><span className="text-[8px] tracking-[0.22em]" style={{ color: s.hot ? '#E0A22E' : '#7A6E60' }}>{idx + 1}. {s.label}</span><span className="w-1.5 h-1.5 rounded-full" style={{ background: s.hot ? '#E0A22E' : '#3A2F20' }} /></div><p className="text-[9px] mt-1" style={{ color: '#A89C8A' }}>{s.detail}</p></div>)}
      </div>
    </div>
  );
}