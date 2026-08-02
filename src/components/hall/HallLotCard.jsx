import React from 'react';
import { Gavel, Eye, EyeOff, Clock, Users } from 'lucide-react';
import { LOT_STATUS_META, CONDITION_COLOR, fmtAuec, timeLeft, closingSoon } from '@/components/hall/hallMeta';

/**
 * One lot as a comrade on the floor sees it.
 *
 * No reserve appears here, and no hint of whether one has been met — a lot that says "reserve met"
 * gives the figure away to anybody willing to bid twice.
 */
export default function HallLotCard({ lot, onOpen, onWatch, pending }) {
  const meta = LOT_STATUS_META[lot.status] || LOT_STATUS_META.listed;
  const soon = closingSoon(lot.closes_at);

  return (
    <div
      className="border p-2.5 space-y-1.5 cursor-pointer"
      style={{ borderColor: lot.you_are_leading ? '#4A6A45' : '#2E2519', background: '#0C0A07' }}
      onClick={() => onOpen(lot)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[12px] truncate" style={{ color: '#EDE5D6' }}>{lot.title}</div>
          <div className="text-[8px] tracking-[0.14em] truncate" style={{ color: '#7A6E60' }}>
            {(lot.item_type || '').toUpperCase()}{lot.manufacturer ? ` · ${lot.manufacturer}` : ''}
            {lot.quantity > 1 ? ` · ×${lot.quantity}` : ''}
          </div>
        </div>
        <span
          className="px-1.5 py-0.5 border text-[7px] font-bold tracking-[0.14em] shrink-0"
          style={{ borderColor: `${meta.color}55`, color: meta.color, background: `${meta.color}14` }}
        >
          {meta.label}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[8px]" style={{ color: '#6B6155' }}>
        {lot.condition_grade && (
          <span style={{ color: CONDITION_COLOR[lot.condition_grade] || '#7A6E60' }}>
            {lot.condition_grade.toUpperCase()}{lot.condition_pct ? ` ${lot.condition_pct}%` : ''}
          </span>
        )}
        <span>BY {lot.seller_handle}{lot.seller_is_you ? ' (YOU)' : ''}</span>
        <span className="flex items-center gap-1"><Gavel className="w-2.5 h-2.5" /> {lot.bid_count} BIDS</span>
        {lot.watchers > 0 && <span className="flex items-center gap-1"><Users className="w-2.5 h-2.5" /> {lot.watchers}</span>}
        <span className="flex items-center gap-1" style={{ color: soon ? '#C05050' : '#C8A05B' }}>
          <Clock className="w-2.5 h-2.5" /> {timeLeft(lot.closes_at)}
        </span>
      </div>

      <div className="flex items-end justify-between gap-2">
        <div>
          <div className="text-[7px] tracking-[0.2em]" style={{ color: '#6B6155' }}>
            {lot.bid_count > 0 ? 'STANDING BID' : 'OPENS AT'}
          </div>
          <div className="text-[14px]" style={{ color: '#E0A22E' }}>
            {fmtAuec(lot.bid_count > 0 ? lot.current_bid_auec : lot.start_auec)}
          </div>
          {lot.you_are_leading && <div className="text-[7px]" style={{ color: '#8A8F45' }}>YOURS AT PRESENT</div>}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onWatch(lot); }}
          disabled={pending}
          className="h-7 px-2 border text-[7px] font-bold tracking-[0.12em] inline-flex items-center gap-1 disabled:opacity-40"
          style={{
            borderColor: lot.you_are_watching ? '#4A3A22' : '#2E2519',
            color: lot.you_are_watching ? '#E0A22E' : '#7A6E60',
            background: '#120D08',
          }}
        >
          {lot.you_are_watching ? <><Eye className="w-2.5 h-2.5" /> WATCHING</> : <><EyeOff className="w-2.5 h-2.5" /> WATCH</>}
        </button>
      </div>
    </div>
  );
}