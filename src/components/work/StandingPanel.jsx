import React from 'react';
import { base44 } from '@/api/base44Client';
import { appealStandingEvent } from '@/functions/appealStandingEvent';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Scale, Loader2 } from 'lucide-react';
import StandingEventRow from '@/components/work/StandingEventRow';
import { tierFor, nextTier, storefrontAdjustment, MARK_LIFETIME_DAYS } from '@/lib/reputation';

/** A comrade's own standing, shown in full. No hidden score, no unexplained figure. */
export default function StandingPanel({ user }) {
  const qc = useQueryClient();

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['my_standing_events', user?.id],
    queryFn: () => base44.entities.standing_event.filter({ member_user_id: user.id }, '-created_date', 100),
    enabled: !!user?.id,
  });

  const appeal = useMutation({
    mutationFn: (payload) => appealStandingEvent(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my_standing_events'] }),
  });

  if (!user) return null;

  const points = Number(user.reputation) || 0;
  const tier = tierFor(points);
  const next = nextTier(points);
  const adjustment = storefrontAdjustment(user);

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2 text-[9px] tracking-[0.2em]" style={{ color: '#E0A22E' }}>
        <Scale className="w-3.5 h-3.5" /> YOUR STANDING IN THE COLLECTIVE
      </div>

      <div className="border p-3 space-y-2" style={{ borderColor: '#5C4424', background: 'linear-gradient(180deg, #14100B, #0B0906)' }}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[9px] tracking-[0.18em]" style={{ color: tier.color }}>{tier.label}</div>
            <div className="text-[26px] font-bold leading-none" style={{ color: '#EDE5D6' }}>{points}</div>
            <p className="text-[9px] mt-0.5" style={{ color: '#8A7E6C' }}>{tier.blurb}</p>
          </div>
          <div className="text-right">
            <div className="text-[8px] tracking-[0.16em]" style={{ color: '#6B6155' }}>STOREFRONT</div>
            <div className="text-[16px] font-bold" style={{ color: adjustment >= 0 ? '#8A8F45' : '#C05050' }}>
              {adjustment > 0 ? `−${adjustment}%` : adjustment < 0 ? `+${Math.abs(adjustment)}%` : 'NO ADJUSTMENT'}
            </div>
            <div className="text-[8px]" style={{ color: '#6B6155' }}>
              {adjustment > 0 ? 'RETURNED TO YOU' : adjustment < 0 ? 'SURCHARGE CARRIED' : 'NOTHING OWED EITHER WAY'}
            </div>
          </div>
        </div>

        {user.standing_locked && (
          <p className="border p-2 text-[9px]" style={{ borderColor: '#5C302A', color: '#D08A6A', background: '#140B08' }}>
            YOU WERE RELEASED FROM THE YARD — no claiming work and no answering musters until an Owner reinstates you.
            {user.standing_locked_reason ? ` Reason recorded: ${user.standing_locked_reason}` : ''}
          </p>
        )}

        {next && (
          <p className="text-[9px]" style={{ color: '#8A8F45' }}>
            {next.min - points} more to {next.label}{next.discount_percent > 0 ? ` — ${next.discount_percent}% returned at the storefront` : ''}.
          </p>
        )}
        <p className="text-[8px] leading-relaxed" style={{ color: '#6B6155' }}>
          Standing is a record of labour given and labour withheld, not a credit score. Work credited and musters
          stood add to it; work handed back costs it, weighted by the harm done. Marks lapse after {MARK_LIFETIME_DAYS} days,
          may be forgiven by the council, and may be answered once each.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin" style={{ color: '#E0A22E' }} /></div>
      ) : events.length === 0 ? (
        <p className="text-[9px] py-4 text-center border" style={{ color: '#6B6155', borderColor: '#2E2519' }}>
          Nothing on your record yet. Take up work and it will be counted here.
        </p>
      ) : (
        <>
          {appeal.error && (
            <p className="text-[9px]" style={{ color: '#D08A6A' }}>{appeal.error?.response?.data?.error || appeal.error.message}</p>
          )}
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-2">
            {events.map((e) => (
              <StandingEventRow key={e.id} event={e} pending={appeal.isPending} onAppeal={(p) => appeal.mutate(p)} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}