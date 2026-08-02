import React from 'react';
import { Users } from 'lucide-react';

/**
 * The places a run calls for, read as places rather than a headcount — a comrade can see at a
 * glance whether the place they would come for is still open, and who already holds one.
 */
export default function MusterSlots({ slots = [] }) {
  if (slots.length === 0) return null;

  return (
    <div className="space-y-1 border-t pt-2" style={{ borderColor: '#221B12' }}>
      <div className="flex items-center gap-1 text-[7px] font-bold tracking-[0.2em]" style={{ color: '#6B6155' }}>
        <Users className="w-2.5 h-2.5" /> PLACES CALLED FOR
      </div>
      <div className="grid grid-cols-2 gap-1">
        {slots.map((s) => {
          const open = s.places_left > 0;
          const color = open ? '#E0A22E' : '#8A8F45';
          return (
            <div
              key={s.role}
              className="border px-1.5 py-1 space-y-0.5"
              style={{ borderColor: `${color}44`, background: `${color}0D` }}
            >
              <div className="flex items-baseline justify-between gap-1">
                <span className="text-[8px] font-bold tracking-[0.14em]" style={{ color }}>
                  {(s.role === 'any' ? 'ANY HAND' : s.role).toUpperCase()}
                </span>
                <span className="text-[9px] font-bold tabular-nums" style={{ color }}>
                  {s.filled}/{s.wanted}
                </span>
              </div>
              <div className="flex gap-0.5">
                {Array.from({ length: s.wanted }).map((_, i) => (
                  <span
                    key={i}
                    className="h-1 flex-1"
                    style={{ background: i < s.filled ? color : '#241C12' }}
                  />
                ))}
              </div>
              <div className="text-[7px] tracking-[0.1em]" style={{ color: '#7A6E60' }}>
                {open ? `${s.places_left} OPEN` : 'FULL'}
                {s.waiting > 0 ? ` · ${s.waiting} WAITING` : ''}
              </div>
              {s.hands?.length > 0 && (
                <div className="text-[7px] truncate" style={{ color: '#8A7E6C' }}>
                  {s.hands.map((h) => h.handle).join(', ')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}