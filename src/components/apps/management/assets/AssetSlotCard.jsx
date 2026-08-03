import React from 'react';
import { ImageOff, Pencil, Trash2 } from 'lucide-react';

const STATUS_COLOR = { live: '#8A8F45', placeholder: '#C8893B' };

/**
 * One slot, filled or not.
 *
 * A slot with nothing in it reads as its absence — a labelled gap with the brief attached, never a
 * broken frame. Nothing on this card is conveyed by the image alone: the slot key, the state and the
 * alt text are all written out.
 */
export default function AssetSlotCard({ slot, asset, onEdit, onRetire, retiring }) {
  const status = asset ? (STATUS_COLOR[asset.status] || '#8A7E6C') : '#6B6155';

  return (
    <div className="border p-2 space-y-1.5" style={{ borderColor: asset ? '#3A2F20' : '#241C12', background: '#0C0A07' }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] truncate" style={{ color: '#EDE5D6' }}>{slot.key}</div>
          <div className="text-[7px] tracking-[0.16em]" style={{ color: '#6B6155' }}>
            {(slot.family_label || slot.family || '').toUpperCase()} · {(asset?.kind || slot.kind || '').toUpperCase()}
          </div>
        </div>
        <span className="px-1.5 py-0.5 border text-[7px] font-bold tracking-[0.12em] shrink-0" style={{ borderColor: `${status}55`, color: status, background: `${status}14` }}>
          {asset ? `${asset.status.toUpperCase()} v${asset.version || 1}` : 'UNFILLED'}
        </span>
      </div>

      {asset ? (
        <img src={asset.image_url} alt={asset.alt_text} className="w-full h-24 object-contain border" style={{ borderColor: '#241C12', background: '#0A0806' }} />
      ) : (
        <div className="w-full h-24 border border-dashed flex flex-col items-center justify-center gap-1 px-2 text-center" style={{ borderColor: '#2E2519' }}>
          <ImageOff className="w-3.5 h-3.5" style={{ color: '#4A4038' }} />
          <span className="text-[7px] tracking-[0.14em]" style={{ color: '#6B6155' }}>NOTHING MADE FOR THIS YET</span>
        </div>
      )}

      <p className="text-[8px] leading-relaxed" style={{ color: '#8A7E6C' }}>
        {asset ? asset.alt_text : slot.guidance}
      </p>

      {asset?.artist_handle && (
        <div className="text-[8px]" style={{ color: '#C8A05B' }}>MADE BY {asset.artist_handle}</div>
      )}

      <div className="flex gap-1">
        <button
          onClick={() => onEdit(slot, asset)}
          className="h-7 px-2 border text-[7px] font-bold tracking-[0.12em] inline-flex items-center gap-1"
          style={{ borderColor: '#4A3A22', color: '#E0A22E', background: '#14100A' }}
        >
          <Pencil className="w-2.5 h-2.5" /> {asset ? 'REPLACE' : 'PUT WORK HERE'}
        </button>
        {asset && (
          <button
            disabled={retiring}
            onClick={() => onRetire(slot.key)}
            className="h-7 px-2 border text-[7px] font-bold tracking-[0.12em] inline-flex items-center gap-1 disabled:opacity-40"
            style={{ borderColor: '#5C302A', color: '#D08A6A', background: '#140B08' }}
          >
            <Trash2 className="w-2.5 h-2.5" /> RETIRE
          </button>
        )}
      </div>
    </div>
  );
}