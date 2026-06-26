import React from 'react';

export default function DemandIntelligence({ products, restocks }) {
  const low = products.filter((p) => p.available && p.category !== 'service' && Number(p.stock || 0) < 10).slice(0, 6);
  const wanted = restocks.filter((r) => !r.notified).slice(0, 6);
  return (
    <section className="border p-3 space-y-3" style={{ borderColor: '#2A2118', background: '#100E0B' }}>
      <div className="text-[9px] tracking-[0.22em]" style={{ color: '#C8893B' }}>DEMAND / RESTOCK INTELLIGENCE</div>
      <div className="grid sm:grid-cols-2 gap-2">
        <div className="space-y-1"><div className="text-[8px] tracking-[0.16em]" style={{ color: '#8A8F45' }}>LOW STOCK</div>{low.length === 0 ? <p className="text-[9px]" style={{ color: '#7A6E60' }}>Stock levels stable.</p> : low.map((p) => <div key={p.id} className="text-[9px] flex justify-between" style={{ color: '#9C9080' }}><span>{p.code || p.product_name}</span><span>{p.stock || 0} {p.unit || 'ea'}</span></div>)}</div>
        <div className="space-y-1"><div className="text-[8px] tracking-[0.16em]" style={{ color: '#8A8F45' }}>BUYER REQUESTS</div>{wanted.length === 0 ? <p className="text-[9px]" style={{ color: '#7A6E60' }}>No pending restock requests.</p> : wanted.map((r) => <div key={r.id} className="text-[9px]" style={{ color: '#9C9080' }}>{r.product_name || r.product_id} — {r.handle}</div>)}</div>
      </div>
    </section>
  );
}