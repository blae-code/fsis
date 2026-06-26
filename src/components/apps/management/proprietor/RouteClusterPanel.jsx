import React from 'react';
import { money } from '@/components/apps/management/proprietor/proprietorUtils';

export default function RouteClusterPanel({ orders }) {
  const active = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status));
  const groups = Object.values(active.reduce((m, o) => { const key = o.delivery_location || 'Unassigned'; m[key] = m[key] || { loc: key, count: 0, value: 0 }; m[key].count += 1; m[key].value += Number(o.total_auec || 0); return m; }, {})).sort((a, b) => b.count - a.count).slice(0, 6);
  return (
    <section className="border p-3 space-y-2" style={{ borderColor: '#2A2118', background: '#100E0B' }}>
      <div className="text-[9px] tracking-[0.22em]" style={{ color: '#C8893B' }}>DELIVERY ROUTE CLUSTERS</div>
      {groups.length === 0 ? <p className="text-[10px]" style={{ color: '#7A6E60' }}>No active delivery destinations to cluster.</p> : groups.map((g) => <div key={g.loc} className="border p-2 flex justify-between gap-2" style={{ borderColor: '#3A2F20', background: '#0C0A07' }}><div><div className="text-[10px] font-bold" style={{ color: '#EDE5D6' }}>{g.loc}</div><div className="text-[8px]" style={{ color: '#7A6E60' }}>{g.count} active handoff{g.count === 1 ? '' : 's'}</div></div><span className="text-[10px]" style={{ color: '#E0A22E' }}>{money(g.value)}</span></div>)}
    </section>
  );
}