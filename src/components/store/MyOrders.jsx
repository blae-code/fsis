import React, { useState } from 'react';
import { storeCache } from '@/lib/localCache';
import { trackOrder } from '@/functions/trackOrder';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { PackageCheck, Search, Loader2, RotateCcw } from 'lucide-react';
import OrderTimeline from '@/components/store/OrderTimeline';
import { etaFor } from '@/lib/storeLocations';

/** Buyer order tracking — works for guests via tracking codes (no account needed) */
export default function MyOrders({ onReorder }) {
  const queryClient = useQueryClient();
  const [codes, setCodes] = useState(() => storeCache.getTrackingCodes());
  const [lookup, setLookup] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [looking, setLooking] = useState(false);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['tracked_orders', codes.join(',')],
    queryFn: async () => {
      const results = await Promise.all(
        codes.map((c) => trackOrder({ tracking_code: c }).then((r) => r.data.order).catch(() => null))
      );
      return results.filter(Boolean).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: codes.length > 0,
  });

  const handleLookup = async () => {
    const code = lookup.trim().toUpperCase();
    if (!code) return;
    setLooking(true);
    setLookupError('');
    try {
      await trackOrder({ tracking_code: code });
      storeCache.addTrackingCode(code);
      setCodes(storeCache.getTrackingCodes());
      setLookup('');
      queryClient.invalidateQueries({ queryKey: ['tracked_orders'] });
    } catch {
      setLookupError('No order found for that code.');
    }
    setLooking(false);
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center gap-2 font-mono text-xs tracking-[0.2em]" style={{ color: '#C8A05B' }}>
        <PackageCheck className="w-3.5 h-3.5" /> ORDER TRACKING
      </div>

      {/* Lookup by code */}
      <div className="space-y-1">
        <div className="flex gap-2">
          <Input
            value={lookup}
            onChange={(e) => setLookup(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
            placeholder="Enter tracking code, e.g. FSIS-3F9A2C"
            className="h-8 text-xs font-mono flex-1"
            style={{ borderColor: '#3A2F20', background: '#0E0C09', color: '#D8CFC0' }}
          />
          <button
            onClick={handleLookup}
            disabled={looking || !lookup.trim()}
            className="h-8 px-4 font-mono text-[10px] font-bold inline-flex items-center gap-1.5 disabled:opacity-40 hover:brightness-110 transition-all"
            style={{ background: 'linear-gradient(180deg, #A87C42, #6E4D24)', color: '#15100A' }}
          >
            {looking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />} TRACK
          </button>
        </div>
        {lookupError && <p className="text-[10px] font-mono" style={{ color: '#C05050' }}>{lookupError}</p>}
      </div>

      {/* Tracked orders */}
      {codes.length === 0 ? (
        <div className="border p-6 text-center" style={{ borderColor: '#3A2F20' }}>
          <p className="text-xs font-mono" style={{ color: '#9C9080' }}>
            No tracked orders on this device — place an order or enter a tracking code above.
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#C8A05B' }} />
        </div>
      ) : (
        orders.map((o) => (
          <div key={o.tracking_code} className="border p-4 space-y-3" style={{ borderColor: '#2A2118', background: '#121110' }}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-mono font-bold" style={{ color: '#E0A22E' }}>{o.tracking_code}</div>
                <div className="text-xs font-mono truncate mt-0.5" style={{ color: '#D8CFC0' }}>
                  {(o.items || []).map((i) => `${i.quantity}x ${i.code || i.product_name}`).join(', ')}
                </div>
                <div className="text-[10px] font-mono" style={{ color: '#8A7E6C' }}>
                  PLACED {new Date(o.created_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })} {o.delivery_location && `• ${o.delivery_location}`}
                </div>
                {!['delivered', 'cancelled'].includes(o.status) && etaFor(o.delivery_location) && (
                  <div className="text-[10px] font-mono" style={{ color: '#7BA05B' }}>
                    EST DELIVERY {etaFor(o.delivery_location)} AFTER CONFIRMATION
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <div className="text-xs font-mono font-bold" style={{ color: '#E0A22E' }}>
                  {(o.total_auec || 0).toLocaleString()} aUEC
                </div>
                {onReorder && (o.items || []).length > 0 && (
                  <button
                    onClick={() => onReorder(o.items)}
                    className="px-2.5 py-1 font-mono text-[9px] font-bold border inline-flex items-center gap-1 hover:brightness-125 transition-all"
                    style={{ borderColor: '#5C4424', color: '#C8A05B', background: '#161310' }}
                  >
                    <RotateCcw className="w-2.5 h-2.5" /> REORDER
                  </button>
                )}
              </div>
            </div>
            <OrderTimeline status={o.status} />
          </div>
        ))
      )}
    </div>
  );
}