import React from 'react';

const AMBER = '#E0A22E';
const TEAL = '#6FA08F';
const DIM = '#7A6E60';

/** One hand's month, read across: hours, work credited, what was settled, how standing moved. */
export default function ReportRow({ r }) {
  const up = r.standing > 0;
  return (
    <div
      className="grid grid-cols-[minmax(0,1fr)_70px_70px_100px_80px_50px] gap-2 items-center px-2.5 py-2 border"
      style={{ borderColor: '#2A2118', background: '#111009' }}
    >
      <span className="text-[11px] truncate" style={{ color: '#D8CFC0' }}>{r.handle}</span>
      <span className="text-right text-[12px] font-bold tabular-nums" style={{ color: r.hours > 0 ? AMBER : '#3A3028' }}>{r.hours.toFixed(1)}</span>
      <span className="text-right text-[11px] tabular-nums" style={{ color: r.tasks > 0 ? '#D8CFC0' : '#3A3028' }}>{r.tasks}</span>
      <span className="text-right text-[11px] font-bold tabular-nums" style={{ color: r.credited > 0 ? TEAL : '#3A3028' }}>
        {r.credited > 0 ? Math.round(r.credited).toLocaleString() : '—'}
      </span>
      <span className="text-right text-[11px] font-bold tabular-nums" style={{ color: r.standing === 0 ? '#3A3028' : up ? '#4EBF7A' : '#D08A6A' }}>
        {r.standing === 0 ? '—' : `${up ? '+' : ''}${r.standing}`}
      </span>
      <span className="text-right text-[10px] tabular-nums" style={{ color: r.marks > 0 ? '#D08A6A' : DIM }}>{r.marks}</span>
    </div>
  );
}