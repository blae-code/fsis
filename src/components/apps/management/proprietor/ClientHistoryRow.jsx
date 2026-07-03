import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { money, shortItems } from '@/components/apps/management/proprietor/proprietorUtils';

const STATUS_COLOR = { delivered: '#8A8F45', cancelled: '#B0563E', new: '#E0A22E', confirmed: '#C8893B', in_fulfillment: '#C8A05B' };

export default function ClientHistoryRow({ client }) {
  const [open, setOpen] = useState(false);
  const isRepeat = client.orders.length > 1;
  const last = client.orders[0];
  return (
    <div className="border" style={{ borderColor: isRepeat ? '#5C4424' : '#3A2F20', background: '#0C0A07' }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between gap-2 p-2 text-left hover:brightness-125">
        <div className="flex items-center gap-2 min-w-0">
          {open ? <ChevronDown className="w-3 h-3 shrink-0" style={{ color: '#7A6E60' }} /> : <ChevronRight className="w-3 h-3 shrink-0" style={{ color: '#7A6E60' }} />}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold truncate" style={{ color: '#EDE5D6' }}>{client.handle}</span>
              {isRepeat && <span className="border px-1.5 py-0.5 text-[7px] font-bold tracking-[0.14em]" style={{ borderColor: '#5C4424', color: '#E0A22E', background: '#120D08' }}>REPEAT ×{client.orders.length}</span>}
            </div>
            <div className="text-[8px] truncate" style={{ color: '#8A8F45' }}>
              {client.topCommodities.length > 0
                ? `PREFERS: ${client.topCommodities.map(([name, qty]) => `${name} (${qty})`).join(' • ')}`
                : 'No salvage commodity purchases'}
            </div>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] font-bold" style={{ color: '#E0A22E' }}>{money(client.total)}</div>
          <div className="text-[8px]" style={{ color: '#7A6E60' }}>LAST: {last ? new Date(last.created_date).toLocaleDateString() : '—'}</div>
        </div>
      </button>
      {open && (
        <div className="border-t px-2 py-1.5 space-y-1.5" style={{ borderColor: '#2A2118' }}>
          {client.orders.map((o) => (
            <div key={o.id} className="flex items-start justify-between gap-2 text-[9px]">
              <div className="min-w-0">
                <span style={{ color: '#C8A05B' }}>{o.tracking_code || o.id}</span>
                <span style={{ color: '#7A6E60' }}> — {shortItems(o.items)}</span>
              </div>
              <div className="text-right shrink-0">
                <span className="font-bold" style={{ color: STATUS_COLOR[o.status] || '#7A6E60' }}>{(o.status || 'new').replace('_', ' ').toUpperCase()}</span>
                <span style={{ color: '#7A6E60' }}> • {new Date(o.created_date).toLocaleDateString()} • </span>
                <span style={{ color: '#E0A22E' }}>{money(o.total_auec)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}