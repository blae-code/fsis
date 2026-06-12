import React, { useState } from 'react';
import { placeOrder } from '@/functions/placeOrder';
import { storeCache } from '@/lib/localCache';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Trash2, Loader2 } from 'lucide-react';
import ManifestReceipt from '@/components/store/ManifestReceipt';
import { DELIVERY_LOCATIONS, etaFor } from '@/lib/storeLocations';

const fieldStyle = { borderColor: '#3A2F20', background: '#0E0C09', color: '#D8CFC0' };

export default function OrderPanel({ cart, setCart, user }) {
  const queryClient = useQueryClient();
  const saved = storeCache.getCustomer();
  const [handle, setHandle] = useState(saved?.handle || user?.full_name || '');
  const [location, setLocation] = useState(saved?.location || '');
  const [notes, setNotes] = useState('');
  const [svcWindow, setSvcWindow] = useState('');
  const [placed, setPlaced] = useState(null); // manifest snapshot of last placed order

  const total = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);
  const hasService = cart.some((i) => i.category === 'service');

  const orderMutation = useMutation({
    mutationFn: async () => {
      const finalNotes = svcWindow ? `${notes}\n[SERVICE WINDOW] ${svcWindow.replace('T', ' ')}`.trim() : notes;
      const res = await placeOrder({
        customer_handle: handle,
        items: cart.map(({ product_id, product_name, quantity }) => ({ product_id, product_name, quantity })),
        delivery_location: location,
        customer_notes: finalNotes,
      });
      return res.data;
    },
    onSuccess: (data) => {
      // Remember this purchaser and their tracking code for next time
      storeCache.setCustomer({ handle, location });
      storeCache.addTrackingCode(data.tracking_code);
      queryClient.invalidateQueries({ queryKey: ['tracked_orders'] });
      setPlaced({ tracking_code: data.tracking_code, handle, location, items: [...cart], total });
      setCart([]);
      setNotes('');
      setSvcWindow('');
    },
  });

  const setQty = (id, qty) =>
    setCart(cart.map((i) => (i.product_id === id ? { ...i, quantity: Math.max(1, qty) } : i)));

  return (
    <div
      className="relative border p-4 space-y-4 sticky top-4"
      style={{
        borderColor: '#5C4A33',
        background: '#14110D',
        clipPath: 'polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)',
      }}
    >
      <div className="flex items-center gap-2 font-mono text-xs tracking-[0.2em]" style={{ color: '#C8A05B' }}>
        <ShoppingCart className="w-3.5 h-3.5" /> ORDER MANIFEST
      </div>

      {placed && <ManifestReceipt order={placed} />}

      {cart.length === 0 ? (
        <div className="border p-6 text-center" style={{ borderColor: '#3A2F20' }}>
          <p className="text-xs font-mono" style={{ color: '#9C9080' }}>Manifest empty — add wares from the catalog</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {cart.map((item) => (
              <div key={item.product_id} className="flex items-center gap-2 text-xs font-mono">
                <span className="flex-1 truncate" style={{ color: '#D8CFC0' }}>{item.code || item.product_name}</span>
                <Input
                  type="number" min="1" value={item.quantity}
                  onChange={(e) => setQty(item.product_id, parseInt(e.target.value) || 1)}
                  className="h-7 w-16 text-xs font-mono"
                  style={fieldStyle}
                />
                <span className="w-24 text-right" style={{ color: '#E0A22E' }}>{(item.unit_price * item.quantity).toLocaleString()}</span>
                <button onClick={() => setCart(cart.filter((i) => i.product_id !== item.product_id))} className="hover:opacity-70" style={{ color: '#8A7E6C' }}>
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-between font-mono text-sm font-bold border-t pt-3" style={{ borderColor: '#3A2F20' }}>
            <span style={{ color: '#D8CFC0' }}>TOTAL</span>
            <span style={{ color: '#E0A22E' }}>{total.toLocaleString()} aUEC</span>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-[10px] font-mono" style={{ color: '#8A7E6C' }}>IN-GAME HANDLE</Label>
              <Input value={handle} onChange={(e) => setHandle(e.target.value)} className="h-8 text-xs font-mono" style={fieldStyle} placeholder="Your RSI handle" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-mono" style={{ color: '#8A7E6C' }}>DELIVERY LOCATION</Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger className="h-8 text-xs font-mono" style={fieldStyle}>
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {DELIVERY_LOCATIONS.map((l) => (
                    <SelectItem key={l.name} value={l.name} className="text-xs font-mono">
                      {l.name} — {l.region}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {location && (
                <p className="text-[9px] font-mono" style={{ color: '#7BA05B' }}>
                  EST DELIVERY {etaFor(location)} after confirmation
                  {DELIVERY_LOCATIONS.find((l) => l.name === location)?.note ? ` • ${DELIVERY_LOCATIONS.find((l) => l.name === location).note}` : ''}
                </p>
              )}
            </div>
            {hasService && (
              <div className="space-y-1">
                <Label className="text-[10px] font-mono" style={{ color: '#8A7E6C' }}>SERVICE WINDOW (YOUR PREFERRED TIME)</Label>
                <Input type="datetime-local" value={svcWindow} onChange={(e) => setSvcWindow(e.target.value)} className="h-8 text-xs font-mono" style={fieldStyle} />
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-[10px] font-mono" style={{ color: '#8A7E6C' }}>NOTES</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="text-xs font-mono h-16" style={fieldStyle} placeholder="Anything we should know?" />
            </div>
          </div>

          <button
            className="w-full h-9 font-mono text-xs font-bold rounded-full disabled:opacity-40 disabled:pointer-events-none hover:brightness-110 transition-all inline-flex items-center justify-center"
            disabled={!handle || orderMutation.isPending}
            onClick={() => { setPlaced(null); orderMutation.mutate(); }}
            style={{
              background: 'linear-gradient(180deg, #E8B13A, #BD7E16)',
              color: '#1A1206',
              boxShadow: 'inset 0 1px 0 rgba(255, 235, 190, 0.4), 0 1px 3px rgba(0, 0, 0, 0.5)',
            }}
          >
            {orderMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'TRANSMIT ORDER'}
          </button>
        </>
      )}
    </div>
  );
}