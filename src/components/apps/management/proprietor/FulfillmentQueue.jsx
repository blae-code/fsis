import React from 'react';
import { shortItems, money } from '@/components/apps/management/proprietor/proprietorUtils';

const NEXT = { new: 'confirmed', confirmed: 'in_fulfillment', in_fulfillment: 'delivered' };
const LABEL = { new: 'CONFIRM', confirmed: 'PULL INVENTORY', in_fulfillment: 'MARK DELIVERED' };

export default function FulfillmentQueue({ orders, onStatus, pending }) {
  const queue = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).slice(0, 8);
  return (
    <section className="border p-3 space-y-2" style={{ borderColor: '#2A2118', background: '#100E0B' }}>
      <div className="text-[9px] tracking-[0.22em]" style={{ color: '#C8893B' }}>FULFILLMENT QUEUE</div>
      {queue.length === 0 ? <p className="text-[10px]" style={{ color: '#7A6E60' }}>No active orders need proprietor action.</p> : queue.map((o) => (
        <div key={o.id} className="border p-2 space-y-1" style={{ borderColor: '#3A2F20', background: '#0C0A07' }}>
          <div className="flex justify-between gap-2"><span className="text-[11px] font-bold" style={{ color: '#EDE5D6' }}>{o.customer_handle}</span><span className="text-[10px]" style={{ color: '#E0A22E' }}>{money(o.total_auec)}</span></div>
          <div className="text-[9px]" style={{ color: '#9C9080' }}>{shortItems(o.items)}</div>
          <div className="flex items-center justify-between gap-2"><span className="text-[8px] tracking-[0.14em]" style={{ color: '#8A8F45' }}>{(o.status || 'new').replace('_', ' ').toUpperCase()} • {o.delivery_location || 'NO LOCATION'}</span>{NEXT[o.status] && <button disabled={pending} onClick={() => onStatus(o.id, NEXT[o.status])} className="border px-2 py-1 text-[8px] font-bold disabled:opacity-40" style={{ borderColor: '#5C4424', color: '#E0A22E', background: '#120D08' }}>{LABEL[o.status]}</button>}</div>
        </div>
      ))}
    </section>
  );
}