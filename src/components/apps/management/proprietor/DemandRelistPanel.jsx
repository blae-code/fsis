import React from 'react';

export default function DemandRelistPanel({ restocks, loot }) {
  const demand = Object.values(restocks.reduce((m, r) => { const key = r.product_name || 'Unknown item'; m[key] = m[key] || { name: key, count: 0 }; m[key].count += 1; return m; }, {})).sort((a, b) => b.count - a.count).slice(0, 5);
  const relistReady = loot.filter((i) => ['repaired', 'raw'].includes(i.status) && i.est_sell_auec).slice(0, 5);
  return (
    <section className="border p-3 space-y-2" style={{ borderColor: '#2A2118', background: '#100E0B' }}>
      <div className="text-[9px] tracking-[0.22em]" style={{ color: '#C8893B' }}>DEMAND / RELIST SIGNALS</div>
      <div className="grid sm:grid-cols-2 gap-2"><div className="space-y-1"><p className="text-[8px]" style={{ color: '#7A6E60' }}>RESTOCK DEMAND</p>{demand.length === 0 ? <p className="text-[9px]" style={{ color: '#7A6E60' }}>No requests.</p> : demand.map((d) => <div key={d.name} className="text-[9px] flex justify-between"><span style={{ color: '#D8CFC0' }}>{d.name}</span><b style={{ color: '#E0A22E' }}>{d.count}</b></div>)}</div><div className="space-y-1"><p className="text-[8px]" style={{ color: '#7A6E60' }}>RELIST READY</p>{relistReady.length === 0 ? <p className="text-[9px]" style={{ color: '#7A6E60' }}>No priced loot ready.</p> : relistReady.map((i) => <div key={i.id} className="text-[9px] truncate" style={{ color: '#D8CFC0' }}>{i.item_name}</div>)}</div></div>
    </section>
  );
}