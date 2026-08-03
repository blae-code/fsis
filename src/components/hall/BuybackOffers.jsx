import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { respondToBuyback } from '@/functions/respondToBuyback';
import { Loader2, HandCoins } from 'lucide-react';

/**
 * Offers FSIS has made for this comrade's gear — the fraction stated on its face, the expiry counted
 * down, and the truth said plainly: the hall would very likely pay more; this buys certainty and speed.
 */
export default function BuybackOffers() {
  const qc = useQueryClient();
  const [confirming, setConfirming] = useState(null);

  // Row-level security scopes this to offers made to the caller.
  const { data: offers = [] } = useQuery({
    queryKey: ['my_buyback_offers'],
    queryFn: () => base44.entities.buyback_offer.list('-created_date', 20),
    refetchInterval: 60000,
  });

  const respond = useMutation({
    mutationFn: (p) => respondToBuyback(p).then((r) => r.data),
    onSuccess: () => { setConfirming(null); qc.invalidateQueries({ queryKey: ['my_buyback_offers'] }); },
  });

  const live = offers.filter((o) => o.status === 'offered');
  if (live.length === 0) return null;
  const err = respond.error?.response?.data?.error || respond.error?.message;

  return (
    <div className="border p-3 space-y-2" style={{ borderColor: '#4A3A22', background: '#14100A' }}>
      <div className="flex items-center gap-2 text-[9px] font-bold tracking-[0.2em]" style={{ color: '#E0A22E' }}>
        <HandCoins className="w-3.5 h-3.5" /> FSIS HAS OFFERED TO BUY YOUR GEAR
      </div>
      {err && <p className="text-[9px]" style={{ color: '#D08A6A' }}>{err}</p>}
      {live.map((o) => {
        const expired = o.expires_at && new Date(o.expires_at) <= new Date();
        return (
          <div key={o.id} className="border p-2 space-y-1.5" style={{ borderColor: '#2E2519', background: '#0C0A07' }}>
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div className="text-[10px]" style={{ color: '#EDE5D6' }}>
                {o.item_name}{o.quantity > 1 ? ` ×${o.quantity}` : ''}
                {o.condition_grade ? ` · ${o.condition_grade.toUpperCase()}` : ''}
              </div>
              <div className="text-[12px]" style={{ color: '#E0A22E' }}>{Number(o.offer_auec).toLocaleString()} aUEC</div>
            </div>
            <p className="text-[8px] leading-relaxed" style={{ color: '#8A7E6C' }}>
              That is {o.fraction_percent}% of {Number(o.market_reference_auec) > 0
                ? `the ${Number(o.market_reference_auec).toLocaleString()} aUEC the market was paying at appraisal${o.market_reference_source ? ` (${o.market_reference_source})` : ''}`
                : 'market'} — stated rather than hidden inside the number. You would very likely get more
              selling it yourself in the hall; what this buys you is the certainty and the speed.
            </p>
            {o.appraisal_notes && <p className="text-[8px] leading-relaxed" style={{ color: '#A89C8A' }}>HOW THE FIGURE WAS REACHED: {o.appraisal_notes}</p>}
            <div className="text-[8px]" style={{ color: expired ? '#C05050' : '#C8893B' }}>
              {expired
                ? 'THIS OFFER HAS EXPIRED — ask for a fresh appraisal rather than a stale figure being honoured.'
                : o.expires_at ? `STANDS UNTIL ${new Date(o.expires_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}` : ''}
            </div>
            {!expired && (
              confirming === o.id ? (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[8px]" style={{ color: '#C8A05B' }}>
                    Accepting passes the item to FSIS under the buyback release, with the sum settled in-game.
                  </span>
                  <button
                    disabled={respond.isPending}
                    onClick={() => respond.mutate({ offer_id: o.id, decision: 'accept' })}
                    className="h-7 px-3 border text-[7px] font-bold tracking-[0.14em] inline-flex items-center gap-1 disabled:opacity-40"
                    style={{ borderColor: '#E0A22E', color: '#0C0A07', background: 'linear-gradient(135deg, #E0A22E, #C8893B)' }}
                  >
                    {respond.isPending ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : null} YES — TAKE THE OFFER
                  </button>
                  <button onClick={() => setConfirming(null)} className="h-7 px-3 border text-[7px]" style={{ borderColor: '#2E2519', color: '#7A6E60' }}>
                    NOT YET
                  </button>
                </div>
              ) : (
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setConfirming(o.id)}
                    className="h-7 px-3 border text-[7px] font-bold tracking-[0.14em]"
                    style={{ borderColor: '#4A3A22', color: '#E0A22E', background: '#120D08' }}
                  >
                    ACCEPT…
                  </button>
                  <button
                    disabled={respond.isPending}
                    onClick={() => respond.mutate({ offer_id: o.id, decision: 'decline' })}
                    className="h-7 px-3 border text-[7px] font-bold tracking-[0.14em] disabled:opacity-40"
                    style={{ borderColor: '#2E2519', color: '#8A7E6C', background: '#0A0806' }}
                  >
                    DECLINE — COSTS NOTHING, THE HALL IS THERE
                  </button>
                </div>
              )
            )}
          </div>
        );
      })}
    </div>
  );
}