import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { recordTradeConduct } from '@/functions/recordTradeConduct';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Handshake, Loader2 } from 'lucide-react';
import { TRADE_KIND_LABEL, tradeTierFor } from '@/lib/trade';

const CONDUCT = [
  { kind: 'handoff_completed', label: 'TURNED UP', color: '#8A8F45' },
  { kind: 'late_cancellation', label: 'CANCELLED LATE', color: '#C8893B' },
  { kind: 'handoff_no_show', label: 'LEFT A HAND WAITING', color: '#C05050' },
];

/**
 * The buyer's side of the ledger. A hand who flies out to a meeting point and waits alone has lost
 * that time as surely as an abandoned task loses it — so it is recorded, plainly, and kept entirely
 * apart from labour standing.
 */
export default function TradeStandingPanel() {
  const qc = useQueryClient();
  const [reasons, setReasons] = useState({});

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['trade_conduct_orders'],
    queryFn: () => base44.entities.order.list('-created_date', 60),
  });
  const { data: events = [] } = useQuery({
    queryKey: ['trade_events'],
    queryFn: () => base44.entities.trade_event.list('-created_date', 30),
  });

  const record = useMutation({
    mutationFn: (payload) => recordTradeConduct(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trade_events'] });
      qc.invalidateQueries({ queryKey: ['access_roster'] });
    },
  });

  const eligible = orders.filter(
    (o) => (o.claimed_by_user_id || o.created_by_id) && ['delivered', 'in_fulfillment', 'cancelled'].includes(o.status),
  ).slice(0, 12);
  const error = record.error;

  return (
    <div className="border p-2 space-y-2" style={{ borderColor: '#2E2519', background: '#0C0A07' }}>
      <div className="flex items-center gap-1.5 text-[9px] tracking-[0.2em]" style={{ color: '#E0A22E' }}>
        <Handshake className="w-3.5 h-3.5" /> TRADE STANDING — THE BUYER'S SIDE
      </div>
      <p className="text-[8px] leading-relaxed" style={{ color: '#8A7E6C' }}>
        Recorded against accounts only — a guest order builds no file on anybody. A trade mark never touches
        labour standing and labour standing never excuses a no-show; the two ledgers are read apart and only
        their effect on a price is added together, inside the same stated caps. Marks lapse after 90 days.
      </p>

      {error && <p className="text-[8px]" style={{ color: '#D08A6A' }}>{error?.response?.data?.error || error.message}</p>}

      {isLoading ? (
        <div className="flex justify-center py-3"><Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: '#E0A22E' }} /></div>
      ) : eligible.length === 0 ? (
        <p className="text-[8px] py-3 text-center" style={{ color: '#6B6155' }}>
          No account-held orders at handoff. Guest orders carry no ledger.
        </p>
      ) : (
        <div className="space-y-1.5">
          {eligible.map((o) => (
            <div key={o.id} className="border p-1.5 space-y-1" style={{ borderColor: '#241D14', background: '#0A0805' }}>
              <div className="flex items-center justify-between gap-2 text-[9px]">
                {/* Never customer_handle — that is whatever the buyer typed, often their real name. */}
                <span className="truncate" style={{ color: '#EDE5D6' }}>{o.guest_number || o.customer_profile_handle || 'GUEST'} · {o.tracking_code}</span>
                <span className="text-[8px] shrink-0" style={{ color: '#7A6E60' }}>{(o.status || '').toUpperCase()}</span>
              </div>
              <input
                value={reasons[o.id] || ''}
                onChange={(e) => setReasons((r) => ({ ...r, [o.id]: e.target.value }))}
                placeholder="What happened at the handoff — the buyer will read this"
                className="w-full border px-2 h-7 text-[9px]"
                style={{ borderColor: '#3A2F20', background: '#0C0A07', color: '#EDE5D6' }}
              />
              <div className="flex gap-1">
                {CONDUCT.map((c) => (
                  <button
                    key={c.kind}
                    disabled={record.isPending || !(reasons[o.id] || '').trim()}
                    onClick={() => record.mutate({ order_id: o.id, kind: c.kind, reason: (reasons[o.id] || '').trim() })}
                    className="flex-1 h-7 border text-[7px] font-bold tracking-[0.1em] disabled:opacity-40"
                    style={{ borderColor: `${c.color}55`, color: c.color, background: '#0C0A07' }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {events.length > 0 && (
        <div className="border-t pt-1.5 space-y-1" style={{ borderColor: '#241D14' }}>
          <div className="text-[8px] tracking-[0.16em]" style={{ color: '#6FA0C8' }}>RECENT TRADE RECORD</div>
          {events.slice(0, 8).map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-2 text-[8px]">
              <span className="truncate" style={{ color: '#A89C8A' }}>
                {e.patron_handle} — {TRADE_KIND_LABEL[e.kind] || e.kind}
                {e.order_tracking_code ? ` · ${e.order_tracking_code}` : ''}
              </span>
              <span className="shrink-0 font-bold" style={{ color: (Number(e.effective_delta) || 0) < 0 ? '#D08A6A' : '#8A8F45' }}>
                {(Number(e.effective_delta) || 0) > 0 ? '+' : ''}{Number(e.effective_delta) || 0}
              </span>
            </div>
          ))}
          <div className="text-[8px]" style={{ color: '#6B6155' }}>
            Tiers: {tradeTierFor(0).label} at nil, a surcharge below it, value returned above.
          </div>
        </div>
      )}
    </div>
  );
}