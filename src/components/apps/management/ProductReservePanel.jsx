import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

const AMBER = '#E0A22E';
const GREEN = '#4EBF7A';

/** Expanded detail for an inventory row: this product's reserve requests,
 *  oldest first, showing allocation progress and reservation notes. */
export default function ProductReservePanel({ product }) {
  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['product_reserves', product.id],
    queryFn: async () => {
      const all = await base44.entities.restock_notify.list('created_date', 200);
      return all.filter((r) => r.request_type === 'reserve' && (r.product_id === product.id || r.product_name === product.product_name));
    },
  });

  if (isLoading) {
    return <div className="flex justify-center py-3"><Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: AMBER }} /></div>;
  }

  return (
    <div className="mt-2 pt-2 border-t space-y-1.5" style={{ borderColor: 'hsl(33,18%,14%)' }}>
      <div className="text-[8px] tracking-[0.2em]" style={{ color: '#6A5A40' }}>
        RESERVE REQUESTS · OLDEST FIRST — restocking this product auto-allocates to open requests
      </div>
      {requests.length === 0 ? (
        <p className="text-[9px]" style={{ color: '#5A4A34' }}>No reserve requests for this product.</p>
      ) : (
        requests.map((r) => {
          const desired = Math.max(1, Number(r.desired_quantity || 1));
          const reserved = Math.max(0, Number(r.reserved_quantity || 0));
          const full = r.reserve_status === 'reserved';
          return (
            <div key={r.id} className="p-2 rounded border" style={{ background: 'hsl(30,10%,6%)', borderColor: full ? `${GREEN}40` : 'hsl(33,18%,16%)' }}>
              <div className="flex items-center gap-2">
                <span className="text-[10px] flex-1 min-w-0 truncate" style={{ color: '#D8CFC0' }}>{r.handle}</span>
                <span className="text-[9px] font-bold shrink-0" style={{ color: full ? GREEN : AMBER }}>
                  {reserved}/{desired} HELD
                </span>
                <span className="text-[8px] tracking-[0.15em] px-1.5 py-0.5 rounded-sm shrink-0"
                  style={{ color: full ? GREEN : AMBER, border: `1px solid ${full ? GREEN : AMBER}40`, background: `${full ? GREEN : AMBER}14` }}>
                  {String(r.reserve_status || 'open').toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-[8px]" style={{ color: '#6A5A40' }}>
                <span>REQUESTED {new Date(r.created_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                {r.reserved_at && <span>LAST ALLOCATED {new Date(r.reserved_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>}
              </div>
              {r.notes && <p className="text-[9px] mt-1" style={{ color: '#8A7A60' }}>{r.notes}</p>}
            </div>
          );
        })
      )}
    </div>
  );
}