import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { browseHall } from '@/functions/browseHall';
import { placeHallBid } from '@/functions/placeHallBid';
import { withdrawHallLot } from '@/functions/withdrawHallLot';
import { relistHallLot } from '@/functions/relistHallLot';
import { X, Loader2, Clock, ShieldAlert, RotateCcw, Ban } from 'lucide-react';
import { LOT_STATUS_META, CONDITION_COLOR, fmtAuec, timeLeft } from '@/components/hall/hallMeta';
import HallBidForm from '@/components/hall/HallBidForm';
import HallBidHistory from '@/components/hall/HallBidHistory';
import HallDisputeForm from '@/components/hall/HallDisputeForm';

/** A lot in full: what it is, what it stands at, who has bid, and what you may do about it. */
export default function HallLotDetail({ lotId, youMayBid, onClose }) {
  const qc = useQueryClient();
  const [disputing, setDisputing] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['hall_lot', lotId],
    queryFn: () => browseHall({ lot_id: lotId }).then((r) => r.data),
    refetchInterval: 15000,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['hall_lot', lotId] });
    qc.invalidateQueries({ queryKey: ['hall'] });
  };
  const bid = useMutation({ mutationFn: (amount) => placeHallBid({ lot_id: lotId, amount_auec: amount }).then((r) => r.data), onSuccess: refresh });
  const withdraw = useMutation({ mutationFn: () => withdrawHallLot({ lot_id: lotId }), onSuccess: refresh });
  const relist = useMutation({ mutationFn: () => relistHallLot({ lot_id: lotId }), onSuccess: refresh });

  const lot = data?.lot;
  const meta = lot ? (LOT_STATUS_META[lot.status] || LOT_STATUS_META.listed) : null;
  const error = bid.error || withdraw.error || relist.error;
  const errText = error?.response?.data?.error || error?.message;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-auto" style={{ background: 'rgba(4,3,2,0.86)' }}>
      <div className="w-full max-w-2xl border my-4" style={{ borderColor: '#3A2F20', background: '#0A0806' }}>
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b" style={{ borderColor: '#241C12' }}>
          <div className="text-[9px] tracking-[0.22em]" style={{ color: '#E0A22E' }}>THE HALL — LOT</div>
          <button onClick={onClose} className="h-7 w-7 border inline-flex items-center justify-center" style={{ borderColor: '#2E2519', color: '#8A7E6C' }}>
            <X className="w-3 h-3" />
          </button>
        </div>

        {isLoading || !lot ? (
          <div className="flex justify-center py-10"><Loader2 className="w-4 h-4 animate-spin" style={{ color: '#E0A22E' }} /></div>
        ) : (
          <div className="p-3 space-y-3 font-mono">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[15px]" style={{ color: '#EDE5D6' }}>{lot.title}</div>
                <div className="text-[8px] tracking-[0.14em]" style={{ color: '#7A6E60' }}>
                  {(lot.item_type || '').toUpperCase()}{lot.manufacturer ? ` · ${lot.manufacturer}` : ''}
                  {lot.size_class ? ` · SIZE ${lot.size_class}` : ''}{lot.quantity > 1 ? ` · ×${lot.quantity}` : ''}
                </div>
              </div>
              <span className="px-1.5 py-0.5 border text-[7px] font-bold tracking-[0.14em] shrink-0" style={{ borderColor: `${meta.color}55`, color: meta.color, background: `${meta.color}14` }}>
                {meta.label}
              </span>
            </div>

            {lot.description && <p className="text-[10px] leading-relaxed" style={{ color: '#A89C8A' }}>{lot.description}</p>}

            {lot.evidence_image_url && (
              <img src={lot.evidence_image_url} alt={lot.title} className="w-full border object-cover max-h-64" style={{ borderColor: '#241C12' }} />
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: lot.bid_count > 0 ? 'STANDING BID' : 'OPENS AT', value: fmtAuec(lot.bid_count > 0 ? lot.current_bid_auec : lot.start_auec), color: '#E0A22E' },
                { label: 'BIDS TAKEN', value: lot.bid_count, color: '#6FA0C8' },
                { label: 'CONDITION', value: (lot.condition_grade || '—').toUpperCase(), color: CONDITION_COLOR[lot.condition_grade] || '#A89C8A' },
                { label: 'COMMISSION', value: `${Number(lot.commission_percent) || 0}%`, color: '#C8A05B' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="relative p-1.5 overflow-hidden"
                  style={{ clipPath: 'polygon(0 6px, 6px 0, 100% 0, 100% 100%, 0 100%)', background: 'linear-gradient(180deg,#100C08,#0A0806)', boxShadow: 'inset 0 0 0 1px #2E2519' }}
                >
                  <div className="pointer-events-none absolute inset-0 opacity-[0.12]" style={{ background: 'repeating-linear-gradient(180deg,rgba(255,220,160,.10) 0 1px,transparent 1px 3px)' }} />
                  <div className="relative text-[7px] tracking-[0.18em]" style={{ color: '#6B6155' }}>{s.label}</div>
                  <div className="relative text-[13px] tabular-nums" style={{ color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-x-3 text-[9px]" style={{ color: '#8A7E6C' }}>
              <span>SOLD BY {lot.seller_handle}{lot.seller_is_you ? ' (YOU)' : ''}</span>
              <span className="flex items-center gap-1" style={{ color: '#C8A05B' }}>
                <Clock className="w-2.5 h-2.5" /> {timeLeft(lot.closes_at)}
                {lot.closes_at ? ` · ${new Date(lot.closes_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}` : ''}
              </span>
            </div>

            {lot.council_interest && (
              <p className="flex items-start gap-1 text-[9px] leading-relaxed border px-2 py-1.5" style={{ color: '#C8A05B', borderColor: '#4A3A22', background: '#14100A' }}>
                <ShieldAlert className="w-3 h-3 mt-px shrink-0" /> COUNCIL INTEREST STATED OPENLY: {lot.council_interest}
              </p>
            )}

            {/* Only ever shown to the comrade whose figure it is. */}
            {lot.reserve_auec !== undefined && (
              <p className="text-[9px] border px-2 py-1.5" style={{ color: '#8A8F45', borderColor: '#2E3A20', background: '#0D110A' }}>
                YOUR RESERVE: {fmtAuec(lot.reserve_auec)} — bidders are never shown this, nor told whether it has been met.
              </p>
            )}

            {errText && (
              <p className="border p-2 text-[9px] leading-relaxed" style={{ borderColor: '#5C302A', color: '#D08A6A', background: '#140B08' }}>{errText}</p>
            )}

            {lot.open_for_bids && !lot.seller_is_you && youMayBid && (
              <HallBidForm lot={lot} pending={bid.isPending} result={bid.data} onBid={(amount) => bid.mutate(amount)} />
            )}
            {lot.seller_is_you && (
              <div className="flex flex-wrap gap-1">
                {lot.open_for_bids && (
                  <button
                    disabled={withdraw.isPending}
                    onClick={() => withdraw.mutate()}
                    className="h-8 px-3 border text-[8px] font-bold tracking-[0.12em] inline-flex items-center gap-1 disabled:opacity-40"
                    style={{ borderColor: '#5C302A', color: '#D08A6A', background: '#140B08' }}
                  >
                    <Ban className="w-2.5 h-2.5" /> WITHDRAW THE LOT
                  </button>
                )}
                {['reserve_not_met', 'no_bids', 'withdrawn', 'expired'].includes(lot.status) && (
                  <button
                    disabled={relist.isPending}
                    onClick={() => relist.mutate()}
                    className="h-8 px-3 border text-[8px] font-bold tracking-[0.12em] inline-flex items-center gap-1 disabled:opacity-40"
                    style={{ borderColor: '#4A3A22', color: '#E0A22E', background: '#14100A' }}
                  >
                    <RotateCcw className="w-2.5 h-2.5" /> PUT IT BACK ON THE FLOOR
                  </button>
                )}
              </div>
            )}

            {/* A vanished counterparty needs a route. Party checks live server-side; a non-party is refused plainly. */}
            {['won', 'settled', 'disputed'].includes(lot.status) && (
              disputing ? (
                <HallDisputeForm lotId={lotId} />
              ) : (
                <button
                  onClick={() => setDisputing(true)}
                  className="h-8 px-3 border text-[8px] font-bold tracking-[0.12em]"
                  style={{ borderColor: '#5C302A', color: '#D08A6A', background: '#140B08' }}
                >
                  SOMETHING WENT WRONG WITH THIS TRADE
                </button>
              )
            )}

            {relist.data?.data?.note && (
              <p className="text-[9px] leading-relaxed" style={{ color: '#C8A05B' }}>{relist.data.data.note}</p>
            )}

            <div className="space-y-1">
              <div className="text-[7px] font-bold tracking-[0.2em]" style={{ color: '#6B6155' }}>THE RUN OF BIDDING</div>
              <HallBidHistory bids={data.bids} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}