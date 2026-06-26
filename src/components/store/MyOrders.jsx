import React, { useState, useRef, useEffect, useMemo } from 'react';
import { storeCache } from '@/lib/localCache';
import { base44 } from '@/api/base44Client';
import { trackOrder } from '@/functions/trackOrder';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { PackageCheck, Search, Loader2, RotateCcw, FileDown, MessageSquare } from 'lucide-react';
import OrderMessageThread from '@/components/store/OrderMessageThread';
import PassphraseSigil from '@/components/brand/glyphs/PassphraseSigil';
import LocationMarker from '@/components/brand/glyphs/LocationMarker';
import { IdleDockBay } from '@/components/brand/glyphs/EmptyStates';
import { downloadInvoice } from '@/lib/invoicePdf';
import OrderTimeline from '@/components/store/OrderTimeline';
import CancelOrder from '@/components/store/CancelOrder';
import CargoLotEta from '@/components/store/CargoLotEta';
import { etaFor } from '@/lib/storeLocations';

// Per-status fulfillment expectation shown to buyers
const STATUS_NOTE = {
  new: 'Awaiting crew confirmation — typically within 12h',
  confirmed: 'Confirmed — queued for fulfillment, typically 24–48h',
  in_fulfillment: 'Crew assigned — delivery being arranged',
};

/** Buyer order tracking — works for guests via tracking codes (no account needed) */
export default function MyOrders({ onReorder }) {
  const queryClient = useQueryClient();
  const [codes, setCodes] = useState(() => storeCache.getTrackingCodes());
  const [lookup, setLookup] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [looking, setLooking] = useState(false);

  const { toast } = useToast();
  const prevStatuses = useRef({});
  const [updatedCodes, setUpdatedCodes] = useState([]);
  const [messagingOrder, setMessagingOrder] = useState(null);

  const { data: orders = [], isLoading, dataUpdatedAt } = useQuery({
    queryKey: ['tracked_orders', codes.join(',')],
    queryFn: async () => {
      const results = await Promise.all(
        codes.map((c) => trackOrder({ tracking_code: c }).then((r) => r.data.order).catch(() => null))
      );
      return results.filter(Boolean).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: codes.length > 0,
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: true,
  });

  // Account-linked orders for signed-in buyers
  const { data: accountOrders = [] } = useQuery({
    queryKey: ['my_account_orders'],
    queryFn: async () => {
      const authed = await base44.auth.isAuthenticated();
      if (!authed) return [];
      const user = await base44.auth.me();
      return base44.entities.order.filter({ created_by_id: user.id }, '-created_date', 50);
    },
    refetchInterval: 30 * 1000,
  });

  // Merge account orders with device-tracked codes (dedupe by tracking code)
  const allOrders = useMemo(() => {
    const map = new Map();
    [...orders, ...accountOrders].forEach((o) => map.set(o.tracking_code || o.id, o));
    return [...map.values()].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [orders, accountOrders]);

  // Detect live status changes — flash the card and notify the buyer
  useEffect(() => {
    const changed = [];
    allOrders.forEach((o) => {
      const prev = prevStatuses.current[o.tracking_code];
      if (prev && prev !== o.status) {
        changed.push(o.tracking_code);
        toast({
          title: `${o.tracking_code} — STATUS UPDATE`,
          description: `Your order is now ${o.status.replace(/_/g, ' ').toUpperCase()}.`,
        });
      }
      prevStatuses.current[o.tracking_code] = o.status;
    });
    if (changed.length > 0) {
      setUpdatedCodes(changed);
      const t = setTimeout(() => setUpdatedCodes([]), 4000);
      return () => clearTimeout(t);
    }
  }, [allOrders, toast]);

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
      setLookupError('No order found for that tracking code or passphrase.');
    }
    setLooking(false);
  };

  return (
    <div className="space-y-4 max-w-2xl">
      {messagingOrder && <OrderMessageThread order={messagingOrder} onClose={() => setMessagingOrder(null)} />}
      <div className="flex items-center justify-between font-mono text-xs tracking-[0.2em]" style={{ color: '#6FA08F' }}>
        <span className="flex items-center gap-2">
          <PackageCheck className="w-3.5 h-3.5" /> ORDER TRACKING
        </span>
        {codes.length > 0 && (
          <span className="flex items-center gap-1.5 text-[9px] tracking-[0.15em]" style={{ color: '#7BA05B' }}>
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full animate-ping" style={{ background: '#7BA05B', opacity: 0.6 }} />
              <span className="relative inline-flex w-2 h-2 rounded-full" style={{ background: '#7BA05B' }} />
            </span>
            LIVE — {dataUpdatedAt ? `SYNCED ${new Date(dataUpdatedAt).toLocaleTimeString([], { timeStyle: 'short' })}` : 'TRACKING'}
          </span>
        )}
      </div>

      {/* Lookup by code */}
      <div className="space-y-1">
        <div className="flex gap-2">
          <Input
            value={lookup}
            onChange={(e) => setLookup(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
            placeholder="Tracking code (FSIS-3F9A2C) or receipt passphrase (IRON-VULTURE-47)"
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
      {allOrders.length === 0 && !isLoading ? (
        <div className="border p-6 flex flex-col items-center gap-3 text-center" style={{ borderColor: '#3A2F20' }}>
          <IdleDockBay width={170} />
          <p className="text-xs font-mono" style={{ color: '#9C9080' }}>
            No tracked orders — place an order, sign in to your account, or enter a tracking code or receipt passphrase above.
          </p>
        </div>
      ) : isLoading && allOrders.length === 0 ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#C8A05B' }} />
        </div>
      ) : (
        allOrders.map((o) => (
          <div
            key={o.tracking_code}
            className="border p-4 space-y-3 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-[#5C4424] hover:shadow-[0_4px_20px_rgba(0,0,0,0.45)]"
            style={{
              borderColor: updatedCodes.includes(o.tracking_code) ? '#D4920B' : '#2A2118',
              background: '#121110',
              boxShadow: updatedCodes.includes(o.tracking_code) ? '0 0 20px rgba(212, 146, 11, 0.35)' : 'none',
            }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-mono font-bold tracking-wide" style={{ color: '#F0B43A' }}>{o.tracking_code}</div>
                <div className="text-xs font-mono truncate mt-0.5" style={{ color: '#D8CFC0' }}>
                  {(o.items || []).map((i) => `${i.quantity}x ${i.code || i.product_name}`).join(', ')}
                </div>
                <div className="text-[10px] font-mono" style={{ color: '#8A7E6C' }}>
                  PLACED {new Date(o.created_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  {o.delivery_location && (
                    <> • <LocationMarker name={o.delivery_location} className="w-3 h-3 inline -mt-0.5" style={{ color: '#6FA08F' }} /> {o.delivery_location}</>
                  )}
                </div>
                {!['delivered', 'cancelled'].includes(o.status) && etaFor(o.delivery_location) && (
                  <div className="text-[10px] font-mono" style={{ color: '#7BA05B' }}>
                    EST DELIVERY {etaFor(o.delivery_location)} AFTER CONFIRMATION
                  </div>
                )}
                {STATUS_NOTE[o.status] && (
                  <div className="text-[10px] font-mono mt-0.5" style={{ color: '#877D6D' }}>{STATUS_NOTE[o.status]}</div>
                )}
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <div className="text-xs font-mono font-bold" style={{ color: '#E0A22E' }}>
                  {(o.total_auec || 0).toLocaleString()} aUEC
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => downloadInvoice({
                      tracking_code: o.tracking_code,
                      handle: o.customer_handle,
                      location: o.delivery_location,
                      items: o.items,
                      total: o.total_auec,
                      discount_auec: o.discount_auec,
                      discount_percent: o.discount_percent,
                      discount_code: o.discount_code,
                      passphrase: o.handoff_passphrase,
                      placed_date: o.created_date,
                    })}
                    className="px-2.5 py-1 font-mono text-[9px] font-bold border inline-flex items-center gap-1 hover:brightness-125 transition-all"
                    style={{ borderColor: '#3C5A50', color: '#7FB3A0', background: '#101413' }}
                  >
                    <FileDown className="w-2.5 h-2.5" /> INVOICE
                  </button>
                  {onReorder && (o.items || []).length > 0 && (
                    <button
                      onClick={() => onReorder(o.items)}
                      className="px-2.5 py-1 font-mono text-[9px] font-bold border inline-flex items-center gap-1 hover:brightness-125 transition-all"
                      style={{ borderColor: '#3C5A50', color: '#7FB3A0', background: '#101413' }}
                    >
                      <RotateCcw className="w-2.5 h-2.5" /> REORDER
                    </button>
                  )}
                  {!['delivered', 'cancelled'].includes(o.status) && (
                    <button
                      onClick={() => setMessagingOrder(o)}
                      className="px-2.5 py-1 font-mono text-[9px] font-bold border inline-flex items-center gap-1 hover:brightness-125 transition-all"
                      style={{ borderColor: '#3A4A5A', color: '#7FA0B3', background: '#0D1318' }}
                    >
                      <MessageSquare className="w-2.5 h-2.5" /> MESSAGE
                    </button>
                  )}
                  {o.status === 'new' && (
                    <CancelOrder
                      trackingCode={o.tracking_code}
                      onCancelled={() => {
                        queryClient.invalidateQueries({ queryKey: ['tracked_orders'] });
                        queryClient.invalidateQueries({ queryKey: ['my_account_orders'] });
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
            {o.handoff_passphrase && !['delivered', 'cancelled'].includes(o.status) && (
              <div className="flex items-center gap-2 font-mono text-[10px]" title="Spoken at the in-person handoff to verify identity on both sides">
                <PassphraseSigil className="w-4 h-4 shrink-0" style={{ color: '#6FA08F' }} />
                <span style={{ color: '#8A7E6C' }}>HANDOFF PASSPHRASE:</span>
                <span className="font-bold tracking-[0.12em]" style={{ color: '#E0A22E' }}>{o.handoff_passphrase}</span>
              </div>
            )}
            <OrderTimeline status={o.status} />
            {['confirmed', 'in_fulfillment'].includes(o.status) && <CargoLotEta order={o} />}
          </div>
        ))
      )}
    </div>
  );
}