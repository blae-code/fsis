import React, { useMemo, useState } from 'react';
import {
  addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, startOfMonth, startOfWeek, subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Radio, CalendarClock } from 'lucide-react';
import CalendarDayCell from '@/components/work/CalendarDayCell';

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/** The month at a glance: which runs are live now, and which are still ahead of us. */
export default function OperationCalendar({ operations = [], onPick }) {
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState(new Date());

  const days = useMemo(
    () => eachDayOfInterval({ start: startOfWeek(startOfMonth(month)), end: endOfWeek(endOfMonth(month)) }),
    [month],
  );
  const dated = useMemo(() => operations.filter((o) => o.starts_at), [operations]);
  const forDay = (d) => dated.filter((o) => isSameDay(new Date(o.starts_at), d));
  const picked = forDay(selected);

  return (
    <div className="border p-3 space-y-2" style={{ borderColor: '#2E2519', background: '#0B0906' }}>
      <div className="flex items-center justify-between">
        <button onClick={() => setMonth(subMonths(month, 1))} className="h-7 w-7 border grid place-items-center" style={{ borderColor: '#2E2519', color: '#8A7E6C' }}>
          <ChevronLeft className="w-3 h-3" />
        </button>
        <div className="text-[10px] font-bold tracking-[0.2em]" style={{ color: '#E0A22E' }}>{format(month, 'MMMM yyyy').toUpperCase()}</div>
        <button onClick={() => setMonth(addMonths(month, 1))} className="h-7 w-7 border grid place-items-center" style={{ borderColor: '#2E2519', color: '#8A7E6C' }}>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      <div className="flex items-center gap-3 text-[8px] tracking-[0.14em]" style={{ color: '#6B6155' }}>
        <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full animate-pulse-glow" style={{ background: '#E0A22E' }} /> UNDERWAY NOW</span>
        <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ background: '#6FA0C8' }} /> CALLED AHEAD</span>
        <span className="inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full" style={{ background: '#4A4236' }} /> CLOSED</span>
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {DOW.map((d, i) => (
          <div key={i} className="text-[7px] tracking-[0.16em] text-center pb-0.5" style={{ color: '#5C544A' }}>{d}</div>
        ))}
        {days.map((d) => (
          <CalendarDayCell
            key={d.toISOString()}
            day={d}
            month={month}
            ops={forDay(d)}
            selected={isSameDay(d, selected)}
            onSelect={setSelected}
          />
        ))}
      </div>

      <div className="border-t pt-2 space-y-1" style={{ borderColor: '#221B12' }}>
        <div className="text-[8px] tracking-[0.18em]" style={{ color: '#8A7E6C' }}>{format(selected, 'EEEE d MMMM').toUpperCase()}</div>
        {picked.length === 0 ? (
          <p className="text-[9px]" style={{ color: '#6B6155' }}>Nothing called for this day.</p>
        ) : (
          picked.map((o) => {
            const live = ['mustering', 'underway'].includes(o.status);
            return (
              <button
                key={o.id}
                onClick={() => onPick?.(o)}
                className="w-full border px-2 py-1.5 flex items-center gap-2 text-left"
                style={{ borderColor: live ? '#E0A22E55' : '#2E2519', background: live ? 'rgba(224,162,46,0.06)' : '#0C0A07' }}
              >
                {live ? <Radio className="w-3 h-3 shrink-0 animate-pulse-glow" style={{ color: '#E0A22E' }} />
                      : <CalendarClock className="w-3 h-3 shrink-0" style={{ color: '#6FA0C8' }} />}
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] truncate" style={{ color: '#EDE5D6' }}>{o.op_name}</span>
                  <span className="block text-[8px] truncate" style={{ color: '#6B6155' }}>
                    {format(new Date(o.starts_at), 'HH:mm')} · {(o.op_type || '').toUpperCase()}
                    {o.muster_location ? ` · ${o.muster_location}` : ''}
                  </span>
                </span>
                <span className="text-[7px] font-bold tracking-[0.14em] shrink-0" style={{ color: live ? '#E0A22E' : '#6FA0C8' }}>
                  {live ? 'UNDERWAY' : (o.status || '').toUpperCase()}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}