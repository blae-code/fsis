import React from 'react';

export default function ProprietorTriageBoard({ orders, messages, loot, products }) {
  const items = [
    { label: 'Confirm new orders', count: orders.filter((o) => o.status === 'new').length, tone: '#E0A22E' },
    { label: 'Reply to buyer messages', count: messages.length, tone: '#C8893B' },
    { label: 'Appraise raw loot', count: loot.filter((i) => ['raw', 'repaired'].includes(i.status) && !i.est_sell_auec).length, tone: '#8A8F45' },
    { label: 'Recover zero stock listings', count: products.filter((p) => p.available && p.category !== 'service' && Number(p.stock || 0) === 0).length, tone: '#C05050' },
  ].filter((i) => i.count > 0);
  return (
    <section className="border p-3 space-y-2" style={{ borderColor: '#5C4424', background: '#120D08' }}>
      <div className="text-[9px] tracking-[0.22em]" style={{ color: '#E0A22E' }}>NEXT BEST ACTIONS</div>
      {items.length === 0 ? <p className="text-[10px]" style={{ color: '#8A8F45' }}>No urgent proprietor actions detected.</p> : items.map((i) => <div key={i.label} className="border p-2 flex justify-between" style={{ borderColor: '#3A2F20', background: '#0C0A07' }}><span className="text-[10px]" style={{ color: '#D8CFC0' }}>{i.label}</span><span className="text-[10px] font-bold" style={{ color: i.tone }}>{i.count}</span></div>)}
    </section>
  );
}