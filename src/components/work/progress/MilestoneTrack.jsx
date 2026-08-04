import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

/** The way in, stage by stage — what is behind you and what is still ahead. */
export default function MilestoneTrack({ steps }) {
  const done = steps.filter((s) => s.done).length;
  return (
    <div className="border p-3 space-y-2" style={{ borderColor: '#3A2F20', background: '#0C0A07' }}>
      <div className="flex items-center justify-between">
        <span className="text-[9px] tracking-[0.24em]" style={{ color: '#E0A22E' }}>YOUR WAY IN</span>
        <span className="text-[9px] tabular-nums" style={{ color: '#8A7E6C' }}>{done}/{steps.length} DONE</span>
      </div>
      <div className="h-[3px]" style={{ background: '#241C14' }}>
        <div className="h-full" style={{ width: `${(done / steps.length) * 100}%`, background: '#E0A22E', boxShadow: '0 0 6px rgba(224,162,46,.6)' }} />
      </div>
      <ul className="space-y-1.5">
        {steps.map((s) => (
          <li key={s.key} className="flex items-start gap-2">
            {s.done
              ? <CheckCircle2 className="w-3 h-3 mt-0.5 shrink-0" style={{ color: '#8A8F45' }} />
              : <Circle className="w-3 h-3 mt-0.5 shrink-0" style={{ color: '#4A4136' }} />}
            <div className="min-w-0">
              <div className="text-[9px] font-bold tracking-[0.14em]" style={{ color: s.done ? '#B8AC9A' : '#8A7E6C' }}>{s.label}</div>
              <p className="text-[8px] leading-relaxed" style={{ color: '#6B6155' }}>{s.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}