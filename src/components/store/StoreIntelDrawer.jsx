import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import ExchangeBoard from '@/components/store/ExchangeBoard';
import StoreLiveStatusPanel from '@/components/store/StoreLiveStatusPanel';
import BuyerProfilePanel from '@/components/store/BuyerProfilePanel';
import HowItWorksStrip from '@/components/store/HowItWorksStrip';
import RedscarTrustStrip from '@/components/store/RedscarTrustStrip';
import RecentDeliveries from '@/components/store/RecentDeliveries';

/** Slide-over deck holding all secondary storefront content so the main view never scrolls. */
export default function StoreIntelDrawer({ open, onClose, products, marketPrices, buyerProfile, onProfileSaved }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(4,3,2,0.72)' }}
          />
          <motion.aside
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full sm:w-[460px] border-l flex flex-col"
            style={{ borderColor: '#5C4424', background: '#0A0806' }}
          >
            <div className="shrink-0 flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: '#2A2118' }}>
              <span className="font-mono text-[9px] tracking-[0.26em]" style={{ color: '#E0A22E' }}>◈ FSIS INTEL DECK</span>
              <button onClick={onClose} className="p-1 border" style={{ borderColor: '#3A2F20', color: '#C8A05B' }}><X className="w-3 h-3" /></button>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
              <ExchangeBoard />
              <StoreLiveStatusPanel products={products} marketPrices={marketPrices} />
              <BuyerProfilePanel profile={buyerProfile} onProfileSaved={onProfileSaved} />
              <HowItWorksStrip />
              <RedscarTrustStrip />
              <RecentDeliveries />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}