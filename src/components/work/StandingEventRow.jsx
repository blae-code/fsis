import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { EVENT_META, APPEAL_META, APPEAL_WINDOW_DAYS, stillCounts } from '@/lib/reputation';

/** One entry in a comrade's standing record — the cause, the figure, and the right to answer it. */
export default function StandingEventRow({ event, onAppeal, pending }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const meta = EVENT_META[event.kind] || EVENT_META.council_adjustment;
  const appeal = APPEAL_META[event.appeal_status] || APPEAL_META.none;
  const counts = stillCounts(event);
  const delta = Number(event.effective_delta) || 0;

  const withinWindow = event.appeal_status === 'none' && delta < 0 && counts
    && (!event.appeal_due_by || new Date(event.appeal_due_by) > new Date());

  return (
    <div className="border p-2 space-y-1" style={{ borderColor: '#2E2519', background: '#0C0A07' }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[8px] tracking-[0.16em]" style={{ color: meta.color }}>{meta.label}</div>
          <div className="text-[10px] leading-snug" style={{ color: '#A89C8A' }}>{event.reason}</div>
          <div className="text-[8px]" style={{ color: '#6B6155' }}>
            {new Date(event.created_date).toLocaleDateString()}
            {!counts && ' · NO LONGER COUNTED'}
            {event.expires_at && counts && ` · LAPSES ${new Date(event.expires_at).toLocaleDateString()}`}
          </div>
        </div>
        <span className="text-[12px] font-bold shrink-0" style={{ color: delta >= 0 ? '#8A8F45' : '#C05050' }}>
          {delta >= 0 ? '+' : ''}{delta}
        </span>
      </div>

      {appeal.label && <div className="text-[8px] tracking-[0.14em]" style={{ color: appeal.color }}>{appeal.label}</div>}
      {event.appeal_reason && (
        <p className="text-[9px] border-l pl-2 italic" style={{ color: '#8A7E6C', borderColor: '#3A2F20' }}>
          YOUR ACCOUNT: {event.appeal_reason}
        </p>
      )}
      {event.ruling && (
        <p className="text-[9px] border-l pl-2" style={{ color: '#6FA0C8', borderColor: '#3A2F20' }}>
          COUNCIL RULING: {event.ruling}
        </p>
      )}
      {event.appeal_status === 'filed' && event.appeal_due_by && (
        <p className="text-[8px]" style={{ color: '#E0A22E' }}>
          ANSWER OWED BY {new Date(event.appeal_due_by).toLocaleDateString()} — silence is not a denial.
        </p>
      )}

      {withinWindow && !open && (
        <button
          onClick={() => setOpen(true)}
          className="h-7 w-full border text-[8px] font-bold tracking-[0.12em]"
          style={{ borderColor: '#3A2F20', color: '#C8A05B', background: '#120D08' }}
        >
          ANSWER THIS MARK
        </button>
      )}
      {withinWindow && open && (
        <div className="space-y-1.5 border-t pt-1.5" style={{ borderColor: '#2E2519' }}>
          <p className="text-[8px]" style={{ color: '#6B6155' }}>
            One appeal per mark, within {APPEAL_WINDOW_DAYS} days. An Owner will read it and rule in the open.
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Your account of what happened"
            className="w-full border px-2 py-1.5 text-[10px]"
            style={{ borderColor: '#3A2F20', background: '#0C0A07', color: '#EDE5D6' }}
          />
          <button
            disabled={pending || !reason.trim()}
            onClick={() => onAppeal({ event_id: event.id, appeal_reason: reason.trim() })}
            className="h-8 w-full border text-[8px] font-bold tracking-[0.12em] inline-flex items-center justify-center gap-1.5 disabled:opacity-40"
            style={{ borderColor: '#E0A22E', color: '#0C0A07', background: 'linear-gradient(135deg, #E0A22E, #C8893B)' }}
          >
            {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : null} FILE THE APPEAL
          </button>
        </div>
      )}
    </div>
  );
}