import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import DeckPanel from '@/components/console/deck/DeckPanel';
import DeckChevronRail from '@/components/console/deck/DeckChevronRail';
import TradeSignalBoard from '@/components/apps/management/trade/TradeSignalBoard';
import TradeGauges from '@/components/apps/management/trade/TradeGauges';
import TradeDesk from '@/components/apps/management/trade/TradeDesk';
import { tradeModel } from '@/components/apps/management/trade/tradeSignals';

/**
 * The Trade deck, built to the Watchfloor's standard: the selling day as a stamped
 * line along the top, what buyers are waiting on down the left, the shop's vitals
 * down the right, and only the desk in hand mounted in the middle.
 */
const DESKS = [
  { id: 'catalogue', label: 'CATALOGUE', glyph: '⬡', blurb: 'What stands on the shelf, at what price.' },
  { id: 'pricing',   label: 'PRICING',   glyph: '✦', blurb: 'What it should be priced at, against the terminals.' },
  { id: 'orders',    label: 'ORDERS',    glyph: '➤', blurb: 'Orders placed, confirmed and owing delivery.', tone: 'hot' },
  { id: 'inbox',     label: 'INBOX',     glyph: '▣', blurb: 'Buyers asking to be told when stock returns.' },
  { id: 'restock',   label: 'RESTOCK',   glyph: '▲', blurb: 'Reserves promised, and stock allocated against them.', tone: 'hot' },
  { id: 'discounts', label: 'DISCOUNTS', glyph: '◆', blurb: 'Codes standing open to buyers.' },
];

export default function TradeConsole() {
  const [desk, setDesk] = useState('orders');

  const { data: orders = [] } = useQuery({ queryKey: ['all_orders'], queryFn: () => base44.entities.order.list('-created_date', 100) });
  const { data: products = [] } = useQuery({ queryKey: ['products_admin'], queryFn: () => base44.entities.product.list('-updated_date', 300) });
  const { data: restocks = [] } = useQuery({ queryKey: ['restock_command'], queryFn: () => base44.entities.restock_notify.list('-created_date', 100) });
  const { data: codes = [] } = useQuery({ queryKey: ['discount_codes_command'], queryFn: () => base44.entities.discount_code.list('-updated_date', 100) });

  const { counts, signals, gauges } = useMemo(() => tradeModel({ orders, products, restocks, codes }), [orders, products, restocks, codes]);
  const active = DESKS.find((d) => d.id === desk) || DESKS[0];

  return (
    <div className="relative h-full flex flex-col min-h-0 font-mono" style={{ background: '#080604' }}>
      <div className="relative z-10 flex flex-col min-h-0 h-full p-3 gap-3">
        <DeckChevronRail railId="trade" items={DESKS} active={desk} onSelect={setDesk} counts={counts} spine="THE SELLING DAY" />

        <div className="flex-1 min-h-0 grid gap-3 lg:grid-cols-[250px_minmax(0,1fr)_200px]">
          <div className="hidden lg:block min-h-0">
            <TradeSignalBoard signals={signals} activeDesk={desk} onGo={setDesk} />
          </div>

          <div className="min-h-0">
            <DeckPanel glyph={active.glyph} title={active.label} meta={active.blurb} notch="both" bright>
              <AnimatePresence mode="wait">
                <motion.div
                  key={desk}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className="p-3"
                >
                  <TradeDesk desk={desk} />
                </motion.div>
              </AnimatePresence>
            </DeckPanel>
          </div>

          <div className="hidden lg:block min-h-0">
            <TradeGauges g={gauges} />
          </div>
        </div>
      </div>
    </div>
  );
}