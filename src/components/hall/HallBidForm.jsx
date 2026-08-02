import React, { useState } from 'react';
import { Gavel, Loader2 } from 'lucide-react';
import { fmtAuec } from '@/components/hall/hallMeta';

/**
 * The bid control.
 *
 * A bid under the reserve is taken rather than refused, and the comrade is told so plainly: a hall
 * that bounces low bids has told you where the reserve sits as surely as printing it would.
 */
export default function HallBidForm({ lot, onBid, pending, result }) {
  const floor = Math.round(Number(lot.next_bid_at_least) || 0);
  const [amount, setAmount] = useState(String(floor));
  const value = Math.round(Number(amount) || 0);

  return (
    <div className="border p-2.5 space-y-2" style={{ borderColor: '#5C4424', background: 'linear-gradient(180deg, #14100B, #0B0906)' }}>
      <div className="flex items-center gap-2 text-[9px] tracking-[0.22em]" style={{ color: '#E0A22E' }}>
        <Gavel className="w-3.5 h-3.5" /> BID ON THIS LOT
      </div>
      <p className="text-[9px] leading-relaxed" style={{ color: '#8A7E6C' }}>
        The next bid must be at least {fmtAuec(floor)}. The seller may have set a figure they will not
        go below; you are not told what it is, and a bid beneath it is still taken — it simply may not
        win. A bid in the last minutes pushes the close out, so nothing here is won by timing a click.
      </p>
      <div className="flex gap-1">
        <input
          type="number"
          min={floor}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="h-9 flex-1 border px-2 text-[11px]"
          style={{ borderColor: '#3A2F20', background: '#0C0A07', color: '#EDE5D6' }}
        />
        <button
          disabled={pending || value < floor}
          onClick={() => onBid(value)}
          className="h-9 px-4 border text-[9px] font-bold tracking-[0.14em] inline-flex items-center gap-2 disabled:opacity-40"
          style={{ borderColor: '#E0A22E', color: '#0C0A07', background: 'linear-gradient(135deg, #E0A22E, #C8893B)' }}
        >
          {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Gavel className="w-3 h-3" />} PLACE BID
        </button>
      </div>
      {result?.note && <p className="text-[9px] leading-relaxed" style={{ color: '#C8A05B' }}>{result.note}</p>}
    </div>
  );
}