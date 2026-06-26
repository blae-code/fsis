import React from 'react';

export default function InventoryReconciliationPanel({ products, onAdjust, pending }) {
  const rows = products.filter((p) => p.available && p.category !== 'service' && Number(p.stock || 0) <= 15).slice(0, 8);
  return (
    <section className="border p-3 space-y-2" style={{ borderColor: '#2A2118', background: '#100E0B' }}>
      <div className="text-[9px] tracking-[0.22em]" style={{ color: '#C8893B' }}>INVENTORY RECONCILIATION</div>
      {rows.length === 0 ? <p className="text-[10px]" style={{ color: '#7A6E60' }}>No low-stock storefront listings need reconciliation.</p> : rows.map((p) => {
        const stock = Number(p.stock || 0);
        return <div key={p.id} className="border p-2 flex items-center justify-between gap-2" style={{ borderColor: '#3A2F20', background: '#0C0A07' }}><div className="min-w-0"><div className="text-[10px] font-bold truncate" style={{ color: '#EDE5D6' }}>{p.product_name}</div><div className="text-[8px]" style={{ color: stock === 0 ? '#C05050' : '#8A8F45' }}>{stock} {p.unit || 'ea'} available</div></div><div className="flex gap-1"><button disabled={pending || stock <= 0} onClick={() => onAdjust(p.id, stock - 1)} className="border px-2 py-1 text-[9px] disabled:opacity-30" style={{ borderColor: '#5C4424', color: '#C8893B' }}>-1</button><button disabled={pending} onClick={() => onAdjust(p.id, stock + 1)} className="border px-2 py-1 text-[9px] disabled:opacity-30" style={{ borderColor: '#5C4424', color: '#C8893B' }}>+1</button></div></div>;
      })}
    </section>
  );
}