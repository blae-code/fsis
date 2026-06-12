import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ShoppingCart, Trash2, Loader2, CheckCircle2 } from 'lucide-react';
import CornerBrackets from '@/components/brand/CornerBrackets';

export default function OrderPanel({ cart, setCart, user }) {
  const queryClient = useQueryClient();
  const [handle, setHandle] = useState(user?.full_name || '');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [placed, setPlaced] = useState(false);

  const total = cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

  const orderMutation = useMutation({
    mutationFn: () =>
      base44.entities.order.create({
        customer_handle: handle,
        items: cart.map(({ product_id, product_name, code, quantity, unit, unit_price }) => ({
          product_id, product_name, code, quantity, unit, unit_price,
        })),
        total_auec: total,
        delivery_location: location,
        customer_notes: notes,
        status: 'new',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my_orders'] });
      setCart([]);
      setLocation('');
      setNotes('');
      setPlaced(true);
      setTimeout(() => setPlaced(false), 4000);
    },
  });

  const setQty = (id, qty) =>
    setCart(cart.map((i) => (i.product_id === id ? { ...i, quantity: Math.max(1, qty) } : i)));

  return (
    <div className="relative rounded-lg border xian-panel p-4 space-y-4 sticky top-4">
      <CornerBrackets />
      <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground tracking-[0.2em]">
        <ShoppingCart className="w-3.5 h-3.5 text-primary" /> ORDER MANIFEST
      </div>

      {placed && (
        <div className="flex items-center gap-2 p-3 rounded text-xs font-mono text-primary" style={{ background: 'hsl(168, 65%, 45%, 0.1)' }}>
          <CheckCircle2 className="w-4 h-4" /> Order received — FSIS will confirm shortly.
        </div>
      )}

      {cart.length === 0 ? (
        <p className="text-xs font-mono text-muted-foreground py-6 text-center">Manifest empty — add wares from the catalog</p>
      ) : (
        <>
          <div className="space-y-2">
            {cart.map((item) => (
              <div key={item.product_id} className="flex items-center gap-2 text-xs font-mono">
                <span className="flex-1 truncate text-foreground">{item.code || item.product_name}</span>
                <Input
                  type="number" min="1" value={item.quantity}
                  onChange={(e) => setQty(item.product_id, parseInt(e.target.value) || 1)}
                  className="h-7 w-16 text-xs font-mono"
                />
                <span className="w-24 text-right text-primary">{(item.unit_price * item.quantity).toLocaleString()}</span>
                <button onClick={() => setCart(cart.filter((i) => i.product_id !== item.product_id))} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-between font-mono text-sm font-bold border-t pt-3" style={{ borderColor: 'hsl(170, 25%, 18%)' }}>
            <span className="text-foreground">TOTAL</span>
            <span className="text-primary xian-glow-subtle">{total.toLocaleString()} aUEC</span>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-[10px] font-mono text-muted-foreground">IN-GAME HANDLE</Label>
              <Input value={handle} onChange={(e) => setHandle(e.target.value)} className="h-8 text-xs font-mono" placeholder="Your RSI handle" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-mono text-muted-foreground">DELIVERY LOCATION</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} className="h-8 text-xs font-mono" placeholder="e.g. Port Tressler" />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] font-mono text-muted-foreground">NOTES</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="text-xs font-mono h-16" placeholder="Anything we should know?" />
            </div>
          </div>

          <Button
            className="w-full font-mono text-xs"
            disabled={!handle || orderMutation.isPending}
            onClick={() => orderMutation.mutate()}
          >
            {orderMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'TRANSMIT ORDER'}
          </Button>
        </>
      )}
    </div>
  );
}