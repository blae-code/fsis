import React from 'react';
import { formatAuec } from '@/components/apps/loot/dashboard/lootGearUtils';

export default function GearMetrics({ items }) {
  const active = items.filter((i) => !['sold', 'scrapped'].includes(i.status));
  const ready = active.filter((i) => !['listed'].includes(i.status) && Number(i.est_sell_auec || 0) > 0);
  const value = active.reduce((sum, i) => sum + (Number(i.est_sell_auec || 0) * Number(i.quantity || 1)), 0);
  const metrics = [['ACTIVE ITEMS', active.length], ['READY TO LIST', ready.length], ['MARKET VALUE', formatAuec(value)]];
  return (
    <div className="grid grid-cols-3 gap-2">
      {metrics.map(([label, value]) => (
        <div key={label} className="border p-3 text-center font-mono" style={{ borderColor: '#2A2118', background: '#0E0C09' }}>
          <div className="text-lg font-bold" style={{ color: '#E0A22E' }}>{value}</div>
          <div className="text-[8px] tracking-[0.18em]" style={{ color: '#7A6E60' }}>{label}</div>
        </div>
      ))}
    </div>
  );
}