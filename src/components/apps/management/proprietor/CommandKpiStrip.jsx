import React from 'react';
import { money } from '@/components/apps/management/proprietor/proprietorUtils';

export default function CommandKpiStrip({ orders, products, loot }) {
  const open = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status));
  const lowStock = products.filter((p) => p.available && p.category !== 'service' && Number(p.stock || 0) < 10);
  const readyLoot = loot.filter((i) => !['listed', 'sold', 'scrapped'].includes(i.status) && Number(i.est_sell_auec || 0) > 0);
  const pipeline = open.reduce((sum, o) => sum + (Number(o.total_auec) || 0), 0);
  const cards = [['OPEN ORDERS', open.length], ['READY LOOT', readyLoot.length], ['LOW STOCK', lowStock.length], ['PIPELINE', money(pipeline)]];
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
      {cards.map(([label, value]) => <div key={label} className="border p-3" style={{ borderColor: '#2A2118', background: '#0E0C09' }}><div className="text-xl font-bold" style={{ color: '#E0A22E' }}>{value}</div><div className="text-[8px] tracking-[0.18em]" style={{ color: '#7A6E60' }}>{label}</div></div>)}
    </div>
  );
}