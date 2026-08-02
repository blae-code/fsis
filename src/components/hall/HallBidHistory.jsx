import React from 'react';
import { fmtAuec } from '@/components/hall/hallMeta';

/** The run of bidding, shown openly — a hall whose bidding cannot be read cannot be checked. */
export default function HallBidHistory({ bids = [] }) {
  if (bids.length === 0) {
    return <p className="text-[9px] border p-2" style={{ color: '#6B6155', borderColor: '#241C12' }}>No bids yet.</p>;
  }
  return (
    <div className="border divide-y" style={{ borderColor: '#241C12', borderBottomColor: '#241C12' }}>
      {bids.map((b, i) => (
        <div
          key={`${b.placed_at}-${i}`}
          className="flex items-center justify-between gap-2 px-2 py-1 text-[9px]"
          style={{ borderColor: '#1B1610', color: b.was_you ? '#E0A22E' : '#A89C8A' }}
        >
          <span className="truncate">{b.handle}{b.was_you ? ' (YOU)' : ''}</span>
          <span className="flex items-center gap-2 shrink-0">
            <span style={{ color: '#6B6155' }}>{new Date(b.placed_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
            <span>{fmtAuec(b.amount_auec)}</span>
          </span>
        </div>
      ))}
    </div>
  );
}