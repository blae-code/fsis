import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { EVENT_META } from '@/lib/reputation';

const OUTCOMES = [
  { key: 'neutralised', label: 'NEUTRALISE', color: '#8A8F45' },
  { key: 'reduced', label: 'REDUCE', color: '#6FA0C8' },
  { key: 'upheld', label: 'UPHOLD', color: '#C8893B' },
  { key: 'increased', label: 'INCREASE', color: '#C05050' },
];

/** One comrade's appeal, and the council's answer to it — given in the open, with reasons. */
export default function StandingAppealCard({ event, onRule, pending }) {
  const [ruling, setRuling] = useState('');
  const [amount, setAmount] = useState('');
  const meta = EVENT_META[event.kind] || EVENT_META.council_adjustment;
  const overdue = event.appeal_due_by && new Date(event.appeal_due_by) < new Date();

  return (
    <div className="border p-2 space-y-1.5" style={{ borderColor: overdue ? '#5C302A' : '#2E2519', background: '#0C0A07' }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] truncate" style={{ color: '#EDE5D6' }}>{event.member_handle || event.member_email}</div>
          <div className="text-[8px] tracking-[0.14em]" style={{ color: meta.color }}>{meta.label}</div>
        </div>
        <span className="text-[12px] font-bold shrink-0" style={{ color: '#C05050' }}>{event.delta}</span>
      </div>

      <p className="text-[9px] leading-snug" style={{ color: '#A89C8A' }}>{event.reason}</p>
      <p className="text-[9px] border-l pl-2 italic" style={{ color: '#C8A05B', borderColor: '#3A2F20' }}>
        THEIR ACCOUNT: {event.appeal_reason}
      </p>
      <p className="text-[8px]" style={{ color: overdue ? '#D08A6A' : '#6B6155' }}>
        FILED {new Date(event.appeal_filed_at || event.created_date).toLocaleDateString()}
        {event.appeal_due_by ? ` · ANSWER ${overdue ? 'OVERDUE SINCE' : 'OWED BY'} ${new Date(event.appeal_due_by).toLocaleDateString()}` : ''}
      </p>

      <textarea
        value={ruling}
        onChange={(e) => setRuling(e.target.value)}
        rows={2}
        placeholder="Your reasoning — shown back to the worker in full"
        className="w-full border px-2 py-1.5 text-[10px]"
        style={{ borderColor: '#3A2F20', background: '#0C0A07', color: '#EDE5D6' }}
      />
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Revised cost (optional, for reduce/increase)"
        className="h-8 w-full border px-2 text-[10px]"
        style={{ borderColor: '#3A2F20', background: '#0C0A07', color: '#EDE5D6' }}
      />
      <div className="grid grid-cols-2 gap-1">
        {OUTCOMES.map((o) => (
          <button
            key={o.key}
            disabled={pending || !ruling.trim()}
            onClick={() => onRule({
              event_id: event.id,
              outcome: o.key,
              ruling: ruling.trim(),
              ...(amount ? { effective_delta: Number(amount) } : {}),
            })}
            className="h-8 border text-[8px] font-bold tracking-[0.12em] inline-flex items-center justify-center gap-1 disabled:opacity-40"
            style={{ borderColor: `${o.color}55`, color: o.color, background: '#120D08' }}
          >
            {pending ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : null} {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}