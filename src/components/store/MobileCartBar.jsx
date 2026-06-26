import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ChevronUp } from 'lucide-react';
import OrderPanel from '@/components/store/OrderPanel';
import { roundPrice } from '@/lib/pricing';

/** Mobile-only sticky manifest bar — the order panel lives below the fold on
 *  small screens, so this keeps the cart one tap away. */
/** Cart icon as bespoke SVG glyph */
function ManifestGlyph({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 5 H19.5 L18 16 H6 Z" />
      <path d="M9 19 A1 1 0 1 0 11 19 A1 1 0 0 0 9 19 M15 19 A1 1 0 1 0 17 19 A1 1 0 0 0 15 19" />
      <path d="M7 9 H17 M7.5 12 H16.5" strokeWidth="1.1" opacity="0.5" />
    </svg>
  );
}

export default function MobileCartBar({ cart, setCart, user, preferredLocation }) {
  const count    = cart.reduce((s, i) => s + i.quantity, 0);
  const total    = cart.reduce((s, i) => s + roundPrice(i.unit_price) * i.quantity, 0);
  const prevRef  = useRef(count);
  const [pulse, setPulse] = React.useState(false);

  useEffect(() => {
    if (count > prevRef.current) {
      setPulse(true);
      setTimeout(() => setPulse(false), 700);
    }
    prevRef.current = count;
  }, [count]);

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t" style={{ borderColor: '#8A6430', background: '#14110D' }}>
      {/* Add-to-cart pulse ring */}
      <AnimatePresence>
        {pulse && (
          <motion.div
            className="absolute inset-x-0 top-0 h-px pointer-events-none"
            style={{ background: 'linear-gradient(90deg, transparent, #E0A22E, transparent)' }}
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      <Sheet>
        <SheetTrigger asChild>
          <button className="w-full flex items-center justify-between px-4 py-3 font-mono">
            <span className="flex items-center gap-2 text-[11px] font-bold tracking-[0.15em]" style={{ color: '#D8CFC0' }}>
              <motion.span animate={pulse ? { scale: [1, 1.35, 1] } : {}} transition={{ duration: 0.4 }}>
                <ManifestGlyph className="w-4 h-4" style={{ color: '#6FA08F' }} />
              </motion.span>
              MANIFEST
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.5, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                    className="px-1.5 py-0.5 text-[9px] font-bold"
                    style={{ background: 'linear-gradient(180deg, #A87C42, #6E4D24)', color: '#15100A' }}
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
            <span className="flex items-center gap-2">
              <motion.span
                key={total}
                initial={{ y: -6, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="text-sm font-bold tracking-tight"
                style={{ color: '#F0B43A' }}
              >
                {total.toLocaleString()} aUEC
              </motion.span>
              <ChevronUp className="w-4 h-4" style={{ color: '#8A7E6C' }} />
            </span>
          </button>
        </SheetTrigger>
        <SheetContent side="bottom" className="p-3 border-t max-h-[85vh] overflow-y-auto" style={{ background: '#0C0B0A', borderColor: '#8A6430' }}>
          <OrderPanel cart={cart} setCart={setCart} user={user} preferredLocation={preferredLocation} />
        </SheetContent>
      </Sheet>
    </div>
  );
}