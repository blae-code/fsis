import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { browseHall } from '@/functions/browseHall';
import { watchHallLot } from '@/functions/watchHallLot';
import { Gavel, ArrowLeft } from 'lucide-react';
import DeckPanel from '@/components/console/deck/DeckPanel';
import DeckChevronRail from '@/components/console/deck/DeckChevronRail';
import HallLotDetail from '@/components/hall/HallLotDetail';
import FloorSignalBoard from '@/components/hall/floor/FloorSignalBoard';
import FloorGauges from '@/components/hall/floor/FloorGauges';
import FloorDesk from '@/components/hall/floor/FloorDesk';
import { floorModel } from '@/components/hall/floor/floorSignals';

const DESKS = [
  { id: 'open',     label: 'ON THE FLOOR', glyph: '⚖', tone: 'hot', blurb: 'Lots open to bid, at a commission named before they went up.' },
  { id: 'watching', label: 'WATCHING',     glyph: '◉',              blurb: 'Lots you asked to be told about before they close.' },
  { id: 'mine',     label: 'MY LOTS',      glyph: '◆',              blurb: 'What you have on the floor, and how it has run.' },
  { id: 'sell',     label: 'SELL',         glyph: '▤',              blurb: 'List a recovery, draft a batch, or answer a buyback offer.' },
];

/**
 * The hall: comrades selling to comrades, on the same deck as the council consoles.
 *
 * Read only through browseHall — the lot record itself is closed to bidders so that a reserve cannot
 * simply be read off it.
 */
export default function Hall() {
  const qc = useQueryClient();
  const [desk, setDesk] = useState('open');
  const [openLot, setOpenLot] = useState(null);

  const scope = desk === 'sell' ? 'mine' : desk;
  const { data, isLoading, error } = useQuery({
    queryKey: ['hall', scope],
    queryFn: () => browseHall({ scope }).then((r) => r.data),
    refetchInterval: 20000,
  });

  const watch = useMutation({
    mutationFn: (lot) => watchHallLot({ lot_id: lot.id, watch: !lot.you_are_watching }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hall'] }),
  });

  const lots = data?.lots || [];
  const errText = error?.response?.data?.error || error?.message;
  const { signals, gauges } = useMemo(() => floorModel({ lots, scope: desk }), [lots, desk]);
  const active = DESKS.find((d) => d.id === desk) || DESKS[0];
  const counts = { open: gauges.live, watching: gauges.watching, mine: desk === 'mine' ? lots.length : 0, sell: 0 };

  return (
    <div className="os-viewport flex flex-col min-h-0 font-mono" style={{ background: '#080604' }}>
      <div className="shrink-0 px-3 py-2 flex items-center justify-between gap-2 border-b" style={{ borderColor: '#221B12' }}>
        <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.24em] xian-glow-subtle" style={{ color: '#E0A22E' }}>
          <Gavel className="w-4 h-4" /> THE HALL
        </div>
        <p className="hidden md:block flex-1 text-[8px] leading-relaxed truncate" style={{ color: '#5F564A' }}>
          Bidding is public so the run of it can be checked — a seller's reserve is never shown, because a hall that leaks reserves bids against you.
        </p>
        <Link
          to="/"
          className="h-7 px-2 border text-[8px] font-bold tracking-[0.16em] inline-flex items-center gap-1 shrink-0"
          style={{ borderColor: '#2E2519', color: '#8A7E6C', background: '#0C0A07' }}
        >
          <ArrowLeft className="w-3 h-3" /> STOREFRONT
        </Link>
      </div>

      <div className="flex-1 min-h-0 flex flex-col p-3 gap-3">
        <DeckChevronRail railId="hallfloor" items={DESKS} active={desk} onSelect={setDesk} counts={counts} spine="HOW A LOT CHANGES HANDS" />

        {errText && (
          <p className="shrink-0 border p-2 text-[9px]" style={{ borderColor: '#5C302A', color: '#D08A6A', background: '#140B08' }}>{errText}</p>
        )}

        <div className="flex-1 min-h-0 grid gap-3 lg:grid-cols-[250px_minmax(0,1fr)_200px]">
          <div className="hidden lg:block min-h-0">
            <FloorSignalBoard signals={signals} activeDesk={desk} onGo={setDesk} />
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
                  <FloorDesk
                    desk={desk}
                    lots={lots}
                    isLoading={isLoading}
                    note={data?.note}
                    watch={watch}
                    onOpen={(l) => setOpenLot(l.id)}
                    onListed={() => setDesk('mine')}
                  />
                </motion.div>
              </AnimatePresence>
            </DeckPanel>
          </div>

          <div className="hidden lg:block min-h-0">
            <FloorGauges g={gauges} />
          </div>
        </div>
      </div>

      {openLot && (
        <HallLotDetail lotId={openLot} youMayBid={data?.you_may_bid !== false} onClose={() => setOpenLot(null)} />
      )}
    </div>
  );
}