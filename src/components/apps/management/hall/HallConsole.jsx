import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import DeckPanel from '@/components/console/deck/DeckPanel';
import DeckChevronRail from '@/components/console/deck/DeckChevronRail';
import HallSignalBoard from '@/components/apps/management/hall/HallSignalBoard';
import HallGauges from '@/components/apps/management/hall/HallGauges';
import HallDesk from '@/components/apps/management/hall/HallDesk';
import { hallModel } from '@/components/apps/management/hall/hallSignals';

/**
 * The Hall deck, to the same standard as Command, Trade, the Yard and Labour: the
 * order a trade is actually settled in stamped along the top, what is owing an answer
 * down the left, the hall's vitals down the right, one desk mounted in the middle.
 */
const DESKS = [
  { id: 'collections', label: 'COLLECTIONS', glyph: '⚖', tone: 'hot', blurb: 'Commission owed on sold lots, and who owes it.' },
  { id: 'disputes',    label: 'DISPUTES',    glyph: '⚑', tone: 'hot', blurb: 'Complaints raised, answers heard, rulings made.' },
  { id: 'buyback',     label: 'BUYBACK',     glyph: '◆',              blurb: 'Appraising a comrade\u2019s goods and standing an offer.' },
  { id: 'assets',      label: 'ASSETS',      glyph: '▨',              blurb: 'The artwork the hall is dressed in, and who made it.' },
];

export default function HallConsole() {
  const [desk, setDesk] = useState('collections');

  const { data: obligations = [] } = useQuery({
    queryKey: ['hall_obligations_deck'],
    queryFn: () => base44.entities.hall_obligation.list('-incurred_at', 200),
    refetchInterval: 60000,
  });
  const { data: disputes = [] } = useQuery({
    queryKey: ['hall_disputes_deck'],
    queryFn: () => base44.entities.hall_dispute.list('-raised_at', 120),
    refetchInterval: 60000,
  });
  const { data: offers = [] } = useQuery({
    queryKey: ['hall_offers_deck'],
    queryFn: () => base44.entities.buyback_offer.list('-created_date', 150),
    refetchInterval: 120000,
  });
  const { data: assets = [] } = useQuery({
    queryKey: ['hall_assets_deck'],
    queryFn: () => base44.entities.visual_asset.list('-updated_date', 300),
    refetchInterval: 300000,
  });

  const { counts, signals, gauges } = useMemo(
    () => hallModel({ obligations, disputes, offers, assets }),
    [obligations, disputes, offers, assets],
  );
  const active = DESKS.find((d) => d.id === desk) || DESKS[0];

  return (
    <div className="relative h-full flex flex-col min-h-0 font-mono" style={{ background: '#080604' }}>
      <div className="relative z-10 flex flex-col min-h-0 h-full p-3 gap-3">
        <DeckChevronRail railId="hall" items={DESKS} active={desk} onSelect={setDesk} counts={counts} spine="HOW A TRADE IS SETTLED" />

        <div className="flex-1 min-h-0 grid gap-3 lg:grid-cols-[250px_minmax(0,1fr)_200px]">
          <div className="hidden lg:block min-h-0">
            <HallSignalBoard signals={signals} activeDesk={desk} onGo={setDesk} />
          </div>

          <div className="min-h-0">
            <DeckPanel
              glyph={active.glyph}
              title={active.label}
              meta={active.blurb}
              notch="both"
              bright
              footer={<Link to="/hall" className="text-[7px] tracking-[0.2em]" style={{ color: '#8A7E6C' }}>PUBLIC HALL ↗</Link>}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={desk}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className="p-3"
                >
                  <HallDesk desk={desk} />
                </motion.div>
              </AnimatePresence>
            </DeckPanel>
          </div>

          <div className="hidden lg:block min-h-0">
            <HallGauges g={gauges} />
          </div>
        </div>
      </div>
    </div>
  );
}