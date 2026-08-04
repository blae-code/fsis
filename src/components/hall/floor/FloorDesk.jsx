import React from 'react';
import { Loader2 } from 'lucide-react';
import HallLotCard from '@/components/hall/HallLotCard';
import HallListForm from '@/components/hall/HallListForm';
import BulkDraftPanel from '@/components/hall/BulkDraftPanel';
import BuybackOffers from '@/components/hall/BuybackOffers';

const EMPTY = {
  open: 'The floor is empty just now.',
  mine: 'You have nothing on the floor.',
  watching: 'You are watching nothing. Watch a lot and you will be told before it closes.',
};

/** One desk of the hall floor mounted at a time. */
export default function FloorDesk({ desk, lots, isLoading, note, watch, onOpen, onListed }) {
  if (desk === 'sell') {
    return (
      <div className="space-y-3">
        <HallListForm onListed={onListed} />
        <BulkDraftPanel />
        <BuybackOffers />
      </div>
    );
  }

  if (isLoading) {
    return <div className="flex justify-center py-10"><Loader2 className="w-4 h-4 animate-spin" style={{ color: '#E0A22E' }} /></div>;
  }

  return (
    <div className="space-y-3">
      {note && (
        <p className="border px-2 py-1.5 text-[9px] leading-relaxed" style={{ borderColor: '#4A3A22', color: '#C8A05B', background: '#14100A' }}>
          {note}
        </p>
      )}
      {lots.length === 0 ? (
        <p className="text-[9px] py-6 text-center border" style={{ color: '#6B6155', borderColor: '#241C12' }}>{EMPTY[desk]}</p>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-2">
          {lots.map((lot) => (
            <HallLotCard
              key={lot.id}
              lot={lot}
              pending={watch.isPending}
              onOpen={onOpen}
              onWatch={(l) => watch.mutate(l)}
            />
          ))}
        </div>
      )}
    </div>
  );
}