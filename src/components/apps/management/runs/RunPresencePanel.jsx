import React from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { markSessionPresence } from '@/functions/markSessionPresence';
import { Loader2, UserPlus, UserMinus } from 'lucide-react';
import { fmtMinutes } from '@/components/runs/runMeta';

/**
 * Who is on the run right now, with time building against the clock.
 * Presence is a record of being there — a stint, never a measure of how hard anyone worked.
 */
export default function RunPresencePanel({ session, roster = [], me, queryKey }) {
  const qc = useQueryClient();
  const { data: op } = useQuery({
    queryKey: ['run_op', session.operation_id],
    queryFn: () => base44.entities.crew_operation.get(session.operation_id),
    enabled: !!session.operation_id,
  });

  const mark = useMutation({
    mutationFn: (p) => markSessionPresence({ session_id: session.id, ...p }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: ['run_sessions'] });
    },
  });

  const onRoster = new Set(roster.map((h) => h.user_id));
  const presentNow = new Set(roster.filter((h) => h.present_now).map((h) => h.user_id));
  const iAmOn = me && presentNow.has(me.id);
  // Comrades who answered the muster and are not presently on — one tap to mark them present.
  const answered = (op?.rsvps || []).filter((r) => ['in', 'maybe'].includes(r.response) && r.user_id && !presentNow.has(r.user_id));
  const err = mark.error?.response?.data?.error || mark.error?.message;

  return (
    <div className="border p-2 space-y-2" style={{ borderColor: '#2E2519', background: '#0C0A07' }}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[7px] font-bold tracking-[0.2em]" style={{ color: '#8A8F45' }}>ON THE RUN NOW — TIME ACCRUING</div>
        <button
          disabled={mark.isPending}
          onClick={() => mark.mutate({ action: iAmOn ? 'leave' : 'join' })}
          className="h-7 px-3 border text-[7px] font-bold tracking-[0.14em] inline-flex items-center gap-1 disabled:opacity-40"
          style={{ borderColor: iAmOn ? '#5C302A' : '#2E3A20', color: iAmOn ? '#D08A6A' : '#8A8F45', background: '#0A0806' }}
        >
          {mark.isPending ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : iAmOn ? <UserMinus className="w-2.5 h-2.5" /> : <UserPlus className="w-2.5 h-2.5" />}
          {iAmOn ? 'I AM STEPPING OFF' : 'I AM ON'}
        </button>
      </div>

      {roster.length === 0 ? (
        <p className="text-[8px]" style={{ color: '#6B6155' }}>Nobody has stood the run yet.</p>
      ) : (
        <div className="border divide-y" style={{ borderColor: '#241C12' }}>
          {roster.map((hand) => (
            <div key={hand.user_id} className="flex items-center gap-2 px-2 py-1" style={{ borderColor: '#1C1610' }}>
              {hand.present_now && <span className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" style={{ background: '#8A8F45' }} />}
              <span className="text-[9px] truncate" style={{ color: '#EDE5D6' }}>{hand.handle}</span>
              <span className="text-[8px] ml-auto shrink-0" style={{ color: '#C8A05B' }}>
                {fmtMinutes(hand.minutes)} · {hand.shares} SHARES{hand.present_now ? ' · ON NOW' : ''}
              </span>
              {hand.user_id !== me?.id && (
                <button
                  disabled={mark.isPending}
                  onClick={() => mark.mutate({ action: hand.present_now ? 'leave' : 'join', user_id: hand.user_id })}
                  className="h-6 px-2 border text-[7px] shrink-0 disabled:opacity-40"
                  style={{ borderColor: '#2E2519', color: '#7A6E60', background: '#0A0806' }}
                >
                  {hand.present_now ? 'MARK LEFT' : 'MARK BACK ON'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {answered.length > 0 && (
        <div className="space-y-1">
          <div className="text-[7px] font-bold tracking-[0.18em]" style={{ color: '#6B6155' }}>ANSWERED THE MUSTER, NOT YET ON</div>
          <div className="flex flex-wrap gap-1">
            {answered.map((r) => (
              <button
                key={r.user_id}
                disabled={mark.isPending || onRoster.has(r.user_id)}
                onClick={() => mark.mutate({ action: 'join', user_id: r.user_id })}
                className="px-2 py-1 border text-[7px] font-bold tracking-[0.1em] disabled:opacity-40"
                style={{ borderColor: '#3A2F20', color: '#C8A05B', background: '#120D08' }}
              >
                MARK {r.handle?.toUpperCase()} PRESENT
              </button>
            ))}
          </div>
        </div>
      )}

      {err && <p className="text-[8px]" style={{ color: '#D08A6A' }}>{err}</p>}
    </div>
  );
}