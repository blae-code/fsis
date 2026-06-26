import React from 'react';
import { money } from '@/components/apps/management/proprietor/proprietorUtils';

export default function BuyerLedger({ orders }) {
  const buyers = Object.values(orders.reduce((map, o) => {
    const key = o.customer_handle || 'Unknown buyer';
    map[key] ||= { handle: key, count: 0, total: 0, last: o.created_date, active: 0 };
    map[key].count += 1; map[key].total += Number(o.total_auec || 0);
    if (!['delivered', 'cancelled'].includes(o.status)) map[key].active += 1;
    if (new Date(o.created_date) > new Date(map[key].last)) map[key].last = o.created_date;
    return map;
  }, {})).sort((a, b) => b.total - a.total).slice(0, 6);
  return (
    <section className="border p-3 space-y-2" style={{ borderColor: '#2A2118', background: '#100E0B' }}>
      <div className="text-[9px] tracking-[0.22em]" style={{ color: '#C8893B' }}>BUYER / CONTACT LEDGER</div>
      {buyers.length === 0 ? <p className="text-[10px]" style={{ color: '#7A6E60' }}>No buyer history yet.</p> : buyers.map((b) => <div key={b.handle} className="flex justify-between border p-2" style={{ borderColor: '#3A2F20', background: '#0C0A07' }}><div><div className="text-[10px] font-bold" style={{ color: '#EDE5D6' }}>{b.handle}</div><div className="text-[8px]" style={{ color: '#7A6E60' }}>{b.count} orders • {b.active} active</div></div><div className="text-[10px] font-bold" style={{ color: '#E0A22E' }}>{money(b.total)}</div></div>)}
    </section>
  );
}