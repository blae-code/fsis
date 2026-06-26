import React from 'react';

const hoursOld = (date) => Math.floor((Date.now() - new Date(date).getTime()) / 3600000);
const threshold = { new: 6, confirmed: 24, in_fulfillment: 36 };

export default function OrderSlaPanel({ orders = [] }) {
  const stuck = orders.filter((o) => threshold[o.status] && hoursOld(o.updated_date || o.created_date) >= threshold[o.status]).slice(0, 8);
  return (
    <section className="border p-3 space-y-3" style={{ borderColor: stuck.length ? '#8A3A2E' : '#5C4424', background: '#120D08' }}>
      <div><p className="text-[9px] tracking-[0.24em]" style={{ color: '#E0A22E' }}>ORDER SLA WATCH</p><p className="text-[9px]" style={{ color: '#8A7E6C' }}>{stuck.length ? `${stuck.length} orders need timing review.` : 'No stuck-order timing risks detected.'}</p></div>
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-2">
        {stuck.map((o) => <div key={o.id} className="border p-2" style={{ borderColor: '#8A3A2E', background: '#0A0806' }}><b className="text-[9px]" style={{ color: '#C05050' }}>{o.tracking_code || o.customer_handle}</b><p className="text-[8px] mt-1" style={{ color: '#D8CFC0' }}>{o.status} · {hoursOld(o.updated_date || o.created_date)}h since update</p><p className="text-[8px]" style={{ color: '#8A7E6C' }}>{o.delivery_location || 'No delivery location'}</p></div>)}
        {!stuck.length && <p className="text-[10px]" style={{ color: '#8A8F45' }}>Fulfillment cadence is inside launch thresholds.</p>}
      </div>
    </section>
  );
}