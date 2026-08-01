import React from 'react';

const fmt = (t) => (t ? new Date(t).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }) : '—');

/** Per-product breakdown of restock_notify records so the proprietor can verify
 *  reserve_status / reserved_quantity / reserved_at after a restock allocation. */
export default function RestockRequestDetails({ requests = [] }) {
  if (requests.length === 0) {
    return <p className="text-[8px]" style={{ color: '#5A4E40' }}>No reserve or notify requests logged for this product.</p>;
  }
  return (
    <div className="space-y-1">
      {requests.map((r) => {
        const reserved = (r.reserve_status || 'open') === 'reserved';
        return (
          <div key={r.id} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[8px] border px-1.5 py-1" style={{ borderColor: '#2A2118', background: '#0A0806' }}>
            <span style={{ color: '#EDE5D6' }}>{r.handle}</span>
            <span style={{ color: '#7A6E60' }}>{(r.request_type || 'notify').toUpperCase()}</span>
            <span style={{ color: reserved ? '#8A8F45' : '#C8893B' }}>{reserved ? 'RESERVED' : 'OPEN'}</span>
            <span style={{ color: '#7A6E60' }}>WANT {r.desired_quantity ?? 1}</span>
            <span style={{ color: '#7A6E60' }}>ALLOC {r.reserved_quantity ?? 0}</span>
            <span className="ml-auto" style={{ color: '#5A4E40' }}>{reserved ? fmt(r.reserved_at) : `req ${fmt(r.created_date)}`}</span>
          </div>
        );
      })}
    </div>
  );
}