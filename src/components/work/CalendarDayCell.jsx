import React from 'react';
import { format, isSameMonth, isToday } from 'date-fns';

/** Live runs burn; scheduled work sits quiet. One day of the muster calendar. */
export default function CalendarDayCell({ day, month, ops, selected, onSelect }) {
  const outside = !isSameMonth(day, month);
  const today = isToday(day);
  const live = ops.filter((o) => ['mustering', 'underway'].includes(o.status));
  const ahead = ops.filter((o) => o.status === 'scheduled');
  const done = ops.length - live.length - ahead.length;

  return (
    <button
      type="button"
      onClick={() => onSelect(day)}
      className="h-14 border p-1 text-left flex flex-col justify-between"
      style={{
        borderColor: selected ? '#E0A22E' : today ? '#6FA0C8' : '#221B12',
        background: live.length ? 'rgba(224,162,46,0.07)' : '#0C0A07',
        opacity: outside ? 0.35 : 1,
      }}
    >
      <span className="text-[9px]" style={{ color: today ? '#6FA0C8' : '#8A7E6C' }}>{format(day, 'd')}</span>
      <span className="flex flex-wrap gap-0.5">
        {live.map((o) => (
          <span key={o.id} className="w-1.5 h-1.5 rounded-full animate-pulse-glow" style={{ background: '#E0A22E' }} />
        ))}
        {ahead.map((o) => (
          <span key={o.id} className="w-1.5 h-1.5 rounded-full" style={{ background: '#6FA0C8' }} />
        ))}
        {done > 0 && <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#4A4236' }} />}
      </span>
    </button>
  );
}