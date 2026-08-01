import React from 'react';
import { tierFor, storefrontAdjustment, MAX_TOTAL_DISCOUNT_PERCENT } from '@/lib/reputation';

/**
 * What a comrade's standing does to this manifest, stated plainly at the point of purchase.
 * The collective returns value to those whose labour made it — and says so out loud.
 */
export default function StandingPriceNotice({ user, subtotal, hasCode }) {
  const pct = user ? storefrontAdjustment(user) : 0;
  if (!user || pct === 0) return null;

  const tier = tierFor(user.reputation);
  const amount = Math.round((subtotal * Math.abs(pct)) / 100 / 100) * 100;
  const isReturn = pct > 0;
  const color = isReturn ? '#8A8F45' : '#C05050';

  return (
    <div className="border px-2.5 py-2 font-mono space-y-1" style={{ borderColor: color, background: `${color}14` }}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold tracking-[0.12em]" style={{ color }}>
          {isReturn ? `${tier.label} — ${pct}% RETURNED TO YOU` : `SURCHARGE — ${Math.abs(pct)}% CARRIED`}
        </span>
        <span className="text-[10px] font-bold" style={{ color }}>
          {isReturn ? '−' : '+'}{amount.toLocaleString()} aUEC
        </span>
      </div>
      <p className="text-[9px] leading-relaxed" style={{ color: '#A89C8A' }}>
        {isReturn
          ? `Your standing is a record of labour given to the collective, so the collective returns part of it here. Applied at transmit${hasCode ? `, capped with any code at ${MAX_TOTAL_DISCOUNT_PERCENT}% in total` : ''}.`
          : 'You were released from the yard. The surcharge stands until an Owner reinstates you; your standing record explains why in full.'}
      </p>
    </div>
  );
}