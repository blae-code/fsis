import React, { useEffect, useState } from 'react';
import { placeOrder } from '@/functions/placeOrder';
import { storeCache } from '@/lib/localCache';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input'; // still used for handle, location, discount, notes
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Trash2 } from 'lucide-react';
import ManifestStepper from '@/components/store/ManifestStepper';
import { motion, AnimatePresence } from 'framer-motion';
import ManifestReceipt from '@/components/store/ManifestReceipt';
import OrderReceiptModal from '@/components/store/OrderReceiptModal';
import HoldToTransmit from '@/components/store/HoldToTransmit';
import CheckoutReadiness from '@/components/store/CheckoutReadiness';
import DeliveryRouteCard from '@/components/store/DeliveryRouteCard';
import BuyerSafetyPanel from '@/components/store/BuyerSafetyPanel';
import { DELIVERY_LOCATIONS, etaFor } from '@/lib/storeLocations';
import { roundPrice } from '@/lib/pricing';

const fieldStyle = { borderColor: '#3A2F20', background: '#0E0C09', color: '#D8CFC0' };
const REDSCAR_CODE = 'REDSCAR-2956';
const REDSCAR_DISCOUNT_PERCENT = 10;

export default function OrderPanel({ cart, setCart, user, preferredLocation = '' }) {
  const queryClient = useQueryClient();
  const saved = storeCache.getCustomer();
  const [handle, setHandle] = useState(saved?.handle || user?.full_name || '');
  const [location, setLocation] = useState(saved?.location || preferredLocation || '');
  const [notes, setNotes] = useState('');
  const [svcWindow, setSvcWindow] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [placed, setPlaced] = useState(null); // manifest snapshot of last placed order
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    if (preferredLocation) setLocation(preferredLocation);
  }, [preferredLocation]);

  const total = cart.reduce((sum, item) => sum + roundPrice(item.unit_price) * item.quantity, 0);
  const normalizedDiscountCode = discountCode.trim().toUpperCase();
  const isRedscarPreferred = normalizedDiscountCode === REDSCAR_CODE;
  const redscarDiscountAuec = isRedscarPreferred ? roundPrice((total * REDSCAR_DISCOUNT_PERCENT) / 100) : 0;
  const estimatedTotal = roundPrice(total - redscarDiscountAuec);
  const hasService = cart.some((i) => i.category === 'service');
  const deliveryEta = etaFor(location);

  const orderMutation = useMutation({
    mutationFn: async () => {
      const finalNotes = svcWindow ? `${notes}\n[SERVICE WINDOW] ${svcWindow.replace('T', ' ')}`.trim() : notes;
      const res = await placeOrder({
        customer_handle: handle,
        items: cart.map(({ product_id, product_name, quantity }) => ({ product_id, product_name, quantity })),
        delivery_location: location,
        customer_notes: finalNotes,
        discount_code: discountCode.trim(),
      });
      return res.data;
    },
    onSuccess: (data) => {
      // Remember this purchaser and their tracking code for next time
      storeCache.setCustomer({ handle, location });
      storeCache.addTrackingCode(data.tracking_code);
      queryClient.invalidateQueries({ queryKey: ['tracked_orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setPlaced({
        tracking_code: data.tracking_code,
        handle,
        location,
        items: [...cart],
        total: data.total_auec,
        discount_auec: data.discount_auec,
        discount_percent: data.discount_percent,
        passphrase: data.handoff_passphrase,
      });
      setShowReceipt(true);
      setCart([]);
      setNotes('');
      setSvcWindow('');
      setDiscountCode('');
    },
  });

  const setQty = (id, qty) =>
    setCart(cart.map((i) => {
      if (i.product_id !== id) return i;
      const cap = i.stock == null ? Infinity : i.stock;
      return { ...i, quantity: Math.min(cap, Math.max(1, qty)) };
    }));

  return (
    <div
      className="relative border p-4 space-y-4 sticky top-4"
      style={{
        borderColor: '#5C4A33',
        background: '#14110D',
        clipPath: 'polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)',
      }}
    >
      <div className="flex items-center gap-2 font-mono text-xs tracking-[0.2em]" style={{ color: '#8A8F45' }}>
        <ShoppingCart className="w-3.5 h-3.5" /> ORDER MANIFEST
      </div>

      <CheckoutReadiness cart={cart} handle={handle} location={location} />

      {placed && <ManifestReceipt order={placed} />}
      <OrderReceiptModal order={placed} open={showReceipt} onClose={() => setShowReceipt(false)} />

      {cart.length === 0 ? (
        <div className="border p-6 text-center" style={{ borderColor: '#3A2F20' }}>
          <p className="text-xs font-mono" style={{ color: '#9C9080' }}>Manifest empty — add wares from the catalog</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <AnimatePresence initial={false}>
            {cart.map((item) => (
              <motion.div
                key={item.product_id}
                initial={{ opacity: 0, x: 16, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, x: -16, height: 0 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="flex items-center gap-2 text-xs font-mono overflow-hidden"
              >
                <span className="flex-1 truncate" style={{ color: '#D8CFC0' }}>{item.code || item.product_name}</span>
                <ManifestStepper
                  value={item.quantity}
                  min={1}
                  max={item.stock == null ? Infinity : item.stock}
                  onChange={(qty) => setQty(item.product_id, qty)}
                />
                <span className="w-24 text-right" style={{ color: '#E0A22E' }}>{(roundPrice(item.unit_price) * item.quantity).toLocaleString()}</span>
                <button onClick={() => setCart(cart.filter((i) => i.product_id !== item.product_id))} className="hover:opacity-70" style={{ color: '#8A7E6C' }}>
                  <Trash2 className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
            </AnimatePresence>
          </div>

          <div className="font-mono border-t pt-3 space-y-2" style={{ borderColor: '#3A2F20' }}>
            <div className="flex items-baseline justify-between">
              <span className="text-xs font-bold tracking-[0.15em]" style={{ color: '#A89C8A' }}>{isRedscarPreferred ? 'SUBTOTAL' : 'TOTAL'}</span>
              <span className="text-lg font-bold tracking-tight" style={{ color: '#F0B43A', textShadow: '0 0 14px rgba(240, 180, 58, 0.18)' }}>{total.toLocaleString()} aUEC</span>
            </div>
            {isRedscarPreferred && (
              <>
                <div className="flex items-center justify-between text-[10px] tracking-[0.12em]">
                  <span style={{ color: '#8A8F45' }}>REDSCAR NOMADS RATE APPLIED</span>
                  <span style={{ color: '#8A8F45' }}>-{redscarDiscountAuec.toLocaleString()} aUEC</span>
                </div>
                <div className="flex items-baseline justify-between border-t pt-2" style={{ borderColor: '#2A2118' }}>
                  <span className="text-xs font-bold tracking-[0.15em]" style={{ color: '#F2EADC' }}>PREFERRED TOTAL</span>
                  <span className="text-xl font-bold tracking-tight" style={{ color: '#F0B43A', textShadow: '0 0 14px rgba(240, 180, 58, 0.22)' }}>{estimatedTotal.toLocaleString()} aUEC</span>
                </div>
              </>
            )}
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
              <DeliveryRouteCard location={location} />
              <p className="text-[9px] font-mono" style={{ color: '#6B6155' }}>
                Availability and route exceptions are confirmed by FSIS before fulfillment.
              </p>
            </div>
            {hasService && (
              <div className="space-y-1">
                <Label className="text-[10px] font-mono" style={{ color: '#8A7E6C' }}>SERVICE WINDOW (YOUR PREFERRED TIME)</Label>
                <Input type="datetime-local" value={svcWindow} onChange={(e) => setSvcWindow(e.target.value)} className="h-8 text-xs font-mono" style={fieldStyle} />
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-[10px] font-mono" style={{ color: '#8A7E6C' }}>DISCOUNT CODE (OPTIONAL)</Label>
              <Input
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                className="h-8 text-xs font-mono"
                style={fieldStyle}
                placeholder="REDSCAR-2956"
              />
              <div className="border px-2.5 py-2 font-mono" style={{ borderColor: isRedscarPreferred ? '#8A8F45' : '#5C4424', background: isRedscarPreferred ? 'rgba(111, 160, 143, 0.08)' : 'rgba(224, 162, 46, 0.07)' }}>
                <p className="text-[10px] font-bold tracking-[0.12em]" style={{ color: isRedscarPreferred ? '#8A8F45' : '#E0A22E' }}>{isRedscarPreferred ? 'REDSCAR MEMBER DETECTED' : 'REDSCAR NOMADS PREFERRED RATE'}</p>
                <p className="mt-1 text-[9px] leading-relaxed" style={{ color: '#A89C8A' }}>{isRedscarPreferred ? `${REDSCAR_DISCOUNT_PERCENT}% preferential pricing is active in the order summary.` : 'Members enter REDSCAR-2956 to apply preferential pricing at checkout.'}</p>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-mono" style={{ color: '#8A7E6C' }}>NOTES</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="text-xs font-mono h-16" style={fieldStyle} placeholder="Anything we should know?" />
            </div>
          </div>

          <BuyerSafetyPanel />

          <div className="border p-3 font-mono space-y-2" style={{ borderColor: '#5C4424', background: 'rgba(92, 68, 36, 0.12)' }}>
            <div className="text-[9px] font-bold tracking-[0.18em]" style={{ color: '#E0A22E' }}>FINAL TRANSMISSION CHECK</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
              <span style={{ color: '#8A7E6C' }}>MANIFEST VALUE</span><span className="text-right" style={{ color: '#D8CFC0' }}>{total.toLocaleString()} aUEC</span>
              {isRedscarPreferred && <><span style={{ color: '#8A8F45' }}>REDSCAR SAVINGS</span><span className="text-right" style={{ color: '#8A8F45' }}>-{redscarDiscountAuec.toLocaleString()} aUEC</span></>}
              <span style={{ color: '#8A7E6C' }}>DESTINATION</span><span className="text-right" style={{ color: '#D8CFC0' }}>{location || 'UNSET'}</span>
              {deliveryEta && <><span style={{ color: '#8A7E6C' }}>EST. WINDOW</span><span className="text-right" style={{ color: '#D8CFC0' }}>{deliveryEta} after confirmation</span></>}
              <span style={{ color: '#F2EADC' }}>TRANSMIT TOTAL</span><span className="text-right font-bold" style={{ color: '#F0B43A' }}>{estimatedTotal.toLocaleString()} aUEC</span>
            </div>
            <p className="text-[9px] leading-relaxed" style={{ color: '#8A8F45' }}>Once transmitted, listed stock is reserved and your private tracking code + handoff passphrase are issued.</p>
          </div>

          {orderMutation.isError && (
            <p className="text-[10px] font-mono" style={{ color: '#C05050' }}>
              {orderMutation.error?.response?.data?.error || 'Order failed — please try again.'}
            </p>
          )}

          <HoldToTransmit
            disabled={!handle.trim() || !location}
            pending={orderMutation.isPending}
            onConfirm={() => { setPlaced(null); orderMutation.mutate(); }}
          />
        </>
      )}
    </div>
  );
}