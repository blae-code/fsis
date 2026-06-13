import React from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ShoppingCart, ChevronUp } from 'lucide-react';
import OrderPanel from '@/components/store/OrderPanel';

/** Mobile-only sticky manifest bar — the order panel lives below the fold on
 *  small screens, so this keeps the cart one tap away. */
export default function MobileCartBar({ cart, setCart, user }) {
  const count = cart.reduce((s, i) => s + i.quantity, 0);
  const total = cart.reduce((s, i) => s + i.unit_price * i.quantity, 0);

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t" style={{ borderColor: '#8A6430', background: '#14110D' }}>
      <Sheet>
        <SheetTrigger asChild>
          <button className="w-full flex items-center justify-between px-4 py-3 font-mono">
            <span className="flex items-center gap-2 text-[11px] font-bold tracking-[0.15em]" style={{ color: '#D8CFC0' }}>
              <ShoppingCart className="w-4 h-4" style={{ color: '#6FA08F' }} />
              MANIFEST{count > 0 && (
                <span
                  className="px-1.5 py-0.5 text-[9px] font-bold"
                  style={{ background: 'linear-gradient(180deg, #A87C42, #6E4D24)', color: '#15100A' }}
                >
                  {count}
                </span>
              )}
            </span>
            <span className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight" style={{ color: '#F0B43A' }}>{total.toLocaleString()} aUEC</span>
              <ChevronUp className="w-4 h-4" style={{ color: '#8A7E6C' }} />
            </span>
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="p-3 border-t max-h-[85vh] overflow-y-auto" style={{ background: '#0C0B0A', borderColor: '#8A6430' }}>
          <OrderPanel cart={cart} setCart={setCart} user={user} />
        </SheetContent>
      </Sheet>
    </div>
  );
}