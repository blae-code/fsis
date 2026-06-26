import React from 'react';

export default function HandoffSchedulerConsole({ orders, onConfirm, pending }) {
  const handoffs = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status) && (o.handoff_status === 'requested' || o.handoff_proposed_time)).slice(0, 6);
  return (
    <section className="border p-3 space-y-2" style={{ borderColor: '#2A2118', background: '#100E0B' }}>
      <div className="text-[9px] tracking-[0.22em]" style={{ color: '#C8893B' }}>HANDOFF SCHEDULER</div>
      {handoffs.length === 0 ? <p className="text-[10px]" style={{ color: '#7A6E60' }}>No buyer handoff requests are pending.</p> : handoffs.map((o) => (
        <div key={o.id} className="border p-2 space-y-1" style={{ borderColor: '#3A2F20', background: '#0C0A07' }}>
          <div className="flex justify-between gap-2"><span className="text-[10px] font-bold" style={{ color: '#EDE5D6' }}>{o.customer_handle}</span><span className="text-[8px]" style={{ color: '#8A8F45' }}>{(o.handoff_status || 'REQUESTED').toUpperCase()}</span></div>
          <div className="text-[9px]" style={{ color: '#9C9080' }}>{o.handoff_proposed_time || 'No time supplied'} • {o.handoff_location || o.delivery_location || 'No location'}</div>
          {o.handoff_contact && <div className="text-[8px]" style={{ color: '#7A6E60' }}>CONTACT: {o.handoff_contact}</div>}
          {o.handoff_status !== 'confirmed' && <button disabled={pending} onClick={() => onConfirm(o)} className="border px-2 py-1 text-[8px] font-bold disabled:opacity-40" style={{ borderColor: '#8A8F45', color: '#8A8F45' }}>CONFIRM WINDOW</button>}
        </div>
      ))}
    </section>
  );
}