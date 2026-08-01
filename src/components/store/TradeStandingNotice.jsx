import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Handshake } from 'lucide-react';
import { TRADE_KIND_LABEL, tradeTierFor, tradeAdjustment } from '@/lib/trade';

/**
 * The buyer's own trade record, shown back to them in full. No hidden score: the tier, the figure it
 * moves a price by, and every entry with the reason the council stated for it.
 */
export default function TradeStandingNotice({ user }) {
  const { data: events = [] } = useQuery({
    queryKey: ['my_trade_events', user?.id],
    queryFn: () => base44.entities.trade_event.filter({ patron_user_id: user.id }, '-created_date', 40),
    enabled: !!user?.id,
  });

  if (!user) return null;
  const tier = user.trade_locked ? tradeTierFor(-Infinity) : tradeTierFor(user.trade_standing);
  const pct = tradeAdjustment(user);

  return (
    <div className="border p-2 space-y-1.5" style={{ borderColor: '#2E2519', background: '#0C0A07' }}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[9px] tracking-[0.18em]" style={{ color: '#E0A22E' }}>
          <Handshake className="w-3.5 h-3.5" /> YOUR TRADE STANDING
        </div>
        <span className="text-[8px] font-bold" style={{ color: tier.color }}>{tier.label} · {Number(user.trade_standing) || 0}</span>
      </div>

      <p className="text-[8px] leading-relaxed" style={{ color: '#8A7E6C' }}>
        {pct > 0
          ? `You turn up when you say you will, and ${pct}% comes back to you on every order.`
          : pct < 0
            ? `A ${Math.abs(pct)}% surcharge stands: a hand flew out and waited. It lifts as marks lapse after 90 days, or sooner if the council is satisfied.`
            : 'Nothing owed either way. Turning up at the handoff is what earns standing here — a hand flies out to meet you.'}
      </p>

      {user.trade_locked && user.trade_locked_reason && (
        <p className="text-[8px] border-l pl-2" style={{ borderColor: '#5C302A', color: '#D08A6A' }}>{user.trade_locked_reason}</p>
      )}

      {events.length > 0 && (
        <div className="space-y-0.5 border-t pt-1.5" style={{ borderColor: '#241D14' }}>
          {events.slice(0, 6).map((e) => (
            <div key={e.id} className="flex items-start justify-between gap-2 text-[8px]">
              <span style={{ color: '#A89C8A' }}>
                {TRADE_KIND_LABEL[e.kind] || e.kind}{e.order_tracking_code ? ` · ${e.order_tracking_code}` : ''}
                {e.reason ? ` — ${e.reason}` : ''}
              </span>
              <span className="shrink-0 font-bold" style={{ color: (Number(e.effective_delta) || 0) < 0 ? '#D08A6A' : '#8A8F45' }}>
                {(Number(e.effective_delta) || 0) > 0 ? '+' : ''}{Number(e.effective_delta) || 0}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}