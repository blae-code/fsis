import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { browseHall } from '@/functions/browseHall';
import { watchHallLot } from '@/functions/watchHallLot';
import { Gavel, Loader2, ArrowLeft } from 'lucide-react';
import HallLotCard from '@/components/hall/HallLotCard';
import HallLotDetail from '@/components/hall/HallLotDetail';
import HallListForm from '@/components/hall/HallListForm';
import BulkDraftPanel from '@/components/hall/BulkDraftPanel';
import { PlusSquare } from 'lucide-react';

const SCOPES = [
  { key: 'open', label: 'ON THE FLOOR' },
  { key: 'mine', label: 'MY LOTS' },
  { key: 'watching', label: 'WATCHING' },
];

/**
 * The hall: comrades selling to comrades, at a commission stated up front.
 *
 * Read only through browseHall — the lot record itself is closed to bidders so that a reserve cannot
 * simply be read off it.
 */
export default function Hall() {
  const qc = useQueryClient();
  const [scope, setScope] = useState('open');
  const [openLot, setOpenLot] = useState(null);
  const [selling, setSelling] = useState(false);

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

  return (
    <div className="os-viewport overflow-auto font-mono" style={{ background: '#080604' }}>
      <div className="max-w-6xl mx-auto p-4 space-y-4">
        <div
          className="sticky top-0 z-20 -mx-4 px-4 py-2.5 flex items-center justify-between gap-2 border-b backdrop-blur"
          style={{ borderColor: '#221B12', background: 'rgba(8,6,4,0.92)' }}
        >
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.24em] xian-glow-subtle" style={{ color: '#E0A22E' }}>
            <Gavel className="w-4 h-4" /> THE HALL
          </div>
          <Link
            to="/"
            className="h-7 px-2 border text-[8px] font-bold tracking-[0.16em] inline-flex items-center gap-1"
            style={{ borderColor: '#2E2519', color: '#8A7E6C', background: '#0C0A07' }}
          >
            <ArrowLeft className="w-3 h-3" /> STOREFRONT
          </Link>
        </div>

        <p className="text-[9px] max-w-3xl leading-relaxed" style={{ color: '#8A7E6C' }}>
          What a comrade recovered, a comrade may sell — here, to the outfit, at a commission named
          before the lot goes up. Bidding is public so the run of it can be checked. A seller may hold
          a figure they will not go below; you are never shown it, because a hall that leaks reserves
          is a hall that bids against you.
        </p>

        {data?.note && (
          <p className="border px-2 py-1.5 text-[9px] leading-relaxed" style={{ borderColor: '#4A3A22', color: '#C8A05B', background: '#14100A' }}>
            {data.note}
          </p>
        )}

        {errText && (
          <p className="border p-2 text-[9px]" style={{ borderColor: '#5C302A', color: '#D08A6A', background: '#140B08' }}>{errText}</p>
        )}

        <div className="flex gap-1">
          {SCOPES.map((s) => (
            <button
              key={s.key}
              onClick={() => setScope(s.key)}
              className="h-8 px-3 border text-[8px] font-bold tracking-[0.14em]"
              style={{
                borderColor: scope === s.key ? '#E0A22E' : '#2E2519',
                color: scope === s.key ? '#E0A22E' : '#7A6E60',
                background: scope === s.key ? '#E0A22E1A' : '#0C0A07',
              }}
            >
              {s.label}
            </button>
          ))}
          <button
            onClick={() => setSelling((v) => !v)}
            className="h-8 px-3 border text-[8px] font-bold tracking-[0.14em] inline-flex items-center gap-1 ml-auto"
            style={{
              borderColor: selling ? '#E0A22E' : '#2E2519',
              color: selling ? '#E0A22E' : '#7A6E60',
              background: selling ? '#E0A22E1A' : '#0C0A07',
            }}
          >
            <PlusSquare className="w-3 h-3" /> SELL SOMETHING
          </button>
        </div>

        {selling && (
          <div className="space-y-2">
            <HallListForm onListed={() => { setScope('mine'); setSelling(false); }} />
            <BulkDraftPanel />
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-4 h-4 animate-spin" style={{ color: '#E0A22E' }} /></div>
        ) : lots.length === 0 ? (
          <p className="text-[9px] py-6 text-center border" style={{ color: '#6B6155', borderColor: '#241C12' }}>
            {scope === 'mine'
              ? 'You have nothing on the floor.'
              : scope === 'watching'
                ? 'You are watching nothing. Watch a lot and you will be told before it closes.'
                : 'The floor is empty just now.'}
          </p>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-2">
            {lots.map((lot) => (
              <HallLotCard
                key={lot.id}
                lot={lot}
                pending={watch.isPending}
                onOpen={(l) => setOpenLot(l.id)}
                onWatch={(l) => watch.mutate(l)}
              />
            ))}
          </div>
        )}
      </div>

      {openLot && (
        <HallLotDetail lotId={openLot} youMayBid={data?.you_may_bid !== false} onClose={() => setOpenLot(null)} />
      )}
    </div>
  );
}