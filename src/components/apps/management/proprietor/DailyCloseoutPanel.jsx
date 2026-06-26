import React from 'react';
import { money } from '@/components/apps/management/proprietor/proprietorUtils';

export default function DailyCloseoutPanel({ orders, messages }) {
  const today = new Date().toDateString();
  const deliveredToday = orders.filter((o) => o.status === 'delivered' && new Date(o.updated_date || o.created_date).toDateString() === today);
  const revenue = deliveredToday.reduce((sum, o) => sum + Number(o.total_auec || 0), 0);
  const active = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length;
  const buyerMsgs = messages.length;
  const cards = [['DELIVERED TODAY', deliveredToday.length], ['TODAY REVENUE', money(revenue)], ['ACTIVE ORDERS', active], ['BUYER MESSAGES', buyerMsgs]];
  return (
    <section className="border p-3 space-y-2" style={{ borderColor: '#2A2118', background: '#100E0B' }}>
      <div className="text-[9px] tracking-[0.22em]" style={{ color: '#C8893B' }}>DAILY CLOSEOUT</div>
      <div className="grid grid-cols-2 gap-2">{cards.map(([label, value]) => <div key={label} className="border p-2" style={{ borderColor: '#3A2F20', background: '#0C0A07' }}><div className="text-sm font-bold" style={{ color: '#E0A22E' }}>{value}</div><div className="text-[8px] tracking-[0.14em]" style={{ color: '#7A6E60' }}>{label}</div></div>)}</div>
      <p className="text-[9px]" style={{ color: '#8A8F45' }}>{active === 0 ? 'No active fulfillment remains for closeout.' : `${active} active order${active === 1 ? '' : 's'} still need attention before closeout.`}</p>
    </section>
  );
}