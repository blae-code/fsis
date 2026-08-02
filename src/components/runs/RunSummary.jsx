import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { markSessionPayoutPaid } from '@/functions/markSessionPayoutPaid';
import { Loader2, Check } from 'lucide-react';
import { RUN_STATUS_META, fmtAuec, fmtMinutes } from '@/components/runs/runMeta';

/**
 * The run, read whole — by every hand who stood it, not only the council.
 *
 * The suggested gross is a reading, not a decision, and its basis is rendered beside it. Losses are
 * shown apart from costs and never as a deduction: a comrade who lost a hull has already borne it.
 */
export default function RunSummary({ data, council, queryKey }) {
  const qc = useQueryClient();
  const tick = useMutation({
    mutationFn: (p) => markSessionPayoutPaid(p),
    onSuccess: () => qc.invalidateQueries({ queryKey }),
  });

  if (!data) return null;
  const { session, roster = [], costs, losses, clusters = [], settled } = data;
  const yield_ = data.yield || {};
  const meta = RUN_STATUS_META[session.status] || RUN_STATUS_META.underway;
  const tickErr = tick.error?.response?.data?.error || tick.error?.message;

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[13px]" style={{ color: '#EDE5D6' }}>{session.session_name}</div>
          <div className="text-[8px]" style={{ color: '#7A6E60' }}>
            {session.started_at ? `BEGAN ${new Date(session.started_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}` : ''}
            {session.ended_at ? ` · ENDED ${new Date(session.ended_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}` : ''}
          </div>
        </div>
        <span className="px-1.5 py-0.5 border text-[7px] font-bold tracking-[0.14em] shrink-0" style={{ borderColor: `${meta.color}55`, color: meta.color }}>
          {meta.label}
        </span>
      </div>

      {/* Who stood it, and for how long. A clock, never a measure of anybody against anybody. */}
      <div className="space-y-1">
        <div className="text-[7px] font-bold tracking-[0.2em]" style={{ color: '#6B6155' }}>
          WHO STOOD THE RUN · {fmtMinutes(data.total_minutes)} BETWEEN {roster.length} HAND{roster.length === 1 ? '' : 'S'}
        </div>
        {roster.length === 0 ? (
          <p className="text-[9px] border p-2" style={{ color: '#6B6155', borderColor: '#241C12' }}>Nobody has stood this run yet.</p>
        ) : (
          <div className="border divide-y" style={{ borderColor: '#241C12' }}>
            {roster.map((hand) => (
              <div key={hand.user_id} className="flex items-center gap-2 px-2 py-1" style={{ borderColor: '#1C1610' }}>
                {hand.present_now && <span className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" style={{ background: '#8A8F45' }} />}
                <span className="text-[9px] truncate" style={{ color: '#EDE5D6' }}>{hand.handle}</span>
                <span className="text-[8px] ml-auto shrink-0" style={{ color: '#C8A05B' }}>
                  {fmtMinutes(hand.minutes)} · {hand.shares} SHARE{hand.shares === 1 ? '' : 'S'}
                  {hand.stints > 1 ? ` · ${hand.stints} STINTS` : ''}
                  {hand.present_now ? ' · ON NOW' : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* What came back. The suggested figure states its own limits — render the basis. */}
      <div className="border p-2 space-y-1" style={{ borderColor: '#241C12', background: '#0A0806' }}>
        <div className="text-[7px] font-bold tracking-[0.2em]" style={{ color: '#6B6155' }}>WHAT THE RUN BROUGHT BACK</div>
        <div className="flex flex-wrap gap-x-3 text-[9px]" style={{ color: '#C8A05B' }}>
          <span>{yield_.cargo_lots || 0} CARGO LOTS ({fmtAuec(yield_.lot_value_auec)})</span>
          <span>{yield_.loot_items || 0} LOOT ITEMS ({fmtAuec(yield_.loot_value_auec)})</span>
          <span>{yield_.scans || 0} SCANS</span>
        </div>
        <div className="text-[10px]" style={{ color: '#E0A22E' }}>SUGGESTED GROSS: {fmtAuec(yield_.suggested_gross_auec)}</div>
        <p className="text-[8px] leading-relaxed" style={{ color: '#8A7E6C' }}>{yield_.basis}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        <div className="border p-2 space-y-1" style={{ borderColor: '#241C12', background: '#0A0806' }}>
          <div className="text-[7px] font-bold tracking-[0.2em]" style={{ color: '#6B6155' }}>COSTS OF THE RUN · {fmtAuec(costs?.total_auec)}</div>
          {(costs?.lines || []).length === 0 ? (
            <p className="text-[8px]" style={{ color: '#6B6155' }}>No costs recorded.</p>
          ) : (
            (costs.lines || []).map((line, i) => (
              <div key={i} className="flex justify-between gap-2 text-[8px]" style={{ color: '#A89C8A' }}>
                <span className="truncate">{line.label}{line.paid_by_handle ? ` (carried by ${line.paid_by_handle})` : ''}</span>
                <span className="shrink-0">{fmtAuec(line.amount_auec)}</span>
              </div>
            ))
          )}
          <p className="text-[7px] leading-relaxed" style={{ color: '#6B6155' }}>Deducted from the gross before anything is divided, stated openly.</p>
        </div>
        <div className="border p-2 space-y-1" style={{ borderColor: '#241C12', background: '#0A0806' }}>
          <div className="text-[7px] font-bold tracking-[0.2em]" style={{ color: '#6B6155' }}>LOSSES · {fmtAuec(losses?.total_auec)}</div>
          {(losses?.lines || []).length === 0 ? (
            <p className="text-[8px]" style={{ color: '#6B6155' }}>Nothing lost. A good run.</p>
          ) : (
            (losses.lines || []).map((line, i) => (
              <div key={i} className="text-[8px]" style={{ color: '#A89C8A' }}>
                {(line.kind || 'other').toUpperCase()} — {line.label}
                {line.handle ? ` · borne by ${line.handle}` : ''}
                {line.estimated_auec ? ` · ${fmtAuec(line.estimated_auec)}` : ''}
                {line.claim_until ? ` · claim runs until ${new Date(line.claim_until).toLocaleDateString()}` : ''}
              </div>
            ))
          )}
          <p className="text-[7px] leading-relaxed" style={{ color: '#6B6155' }}>
            Never deducted from the split — a comrade who lost a hull has already borne it. Recorded so
            the collective can make them whole.
          </p>
        </div>
      </div>

      {clusters.length > 0 && (
        <div className="border p-2 space-y-1" style={{ borderColor: '#241C12', background: '#0A0806' }}>
          <div className="text-[7px] font-bold tracking-[0.2em]" style={{ color: '#6B6155' }}>CLUSTERS — MARKED, WORKED ONCE, FINISHED</div>
          {clusters.map((c) => (
            <div key={c.scan_id} className="text-[8px]" style={{ color: c.stripped ? '#6B6155' : '#C8A05B' }}>
              {c.cluster_name}{c.worked_by_handle ? ` · worked by ${c.worked_by_handle}` : ''} · {c.stripped ? 'STRIPPED' : 'STILL STANDING'}
            </div>
          ))}
        </div>
      )}

      {settled && (
        <div className="border p-2 space-y-2" style={{ borderColor: '#2E3A20', background: '#0D110A' }}>
          <div className="text-[7px] font-bold tracking-[0.2em]" style={{ color: '#8A8F45' }}>THE SETTLEMENT</div>
          <div className="flex flex-wrap gap-x-4 text-[10px]">
            <span style={{ color: '#E0A22E' }}>GROSS {fmtAuec(settled.gross_auec)}</span>
            <span style={{ color: '#C8893B' }}>COSTS {fmtAuec(settled.costs_auec)}</span>
            <span style={{ color: '#8A8F45' }}>NET {fmtAuec(settled.net_auec)}</span>
          </div>
          {tickErr && <p className="text-[9px]" style={{ color: '#D08A6A' }}>{tickErr}</p>}
          <div className="border divide-y" style={{ borderColor: '#241C12' }}>
            {(settled.payouts || []).map((p) => (
              <div key={p.user_id} className="flex items-center gap-2 px-2 py-1.5 flex-wrap" style={{ borderColor: '#1C1610' }}>
                <span className="text-[9px]" style={{ color: '#EDE5D6' }}>{p.handle}</span>
                <span className="text-[8px]" style={{ color: '#C8A05B' }}>{fmtMinutes(p.minutes)} · {p.shares} SHARES</span>
                <span className="ml-auto text-[8px] shrink-0" style={{ color: p.settles_at_payday ? '#6FA0C8' : p.paid ? '#8A8F45' : '#C8893B' }}>
                  {p.settles_at_payday
                    ? 'SETTLES AT PAY DAY WITH EVERYONE ELSE\u2019S — NOT THE COUNCIL\u2019S TO TICK'
                    : p.paid
                      ? `PAID${p.paid_at ? ` · ${new Date(p.paid_at).toLocaleDateString()}` : ''}`
                      : 'DIRECT SETTLEMENT — NOT YET CONFIRMED LANDED'}
                </span>
                {council && !p.settles_at_payday && (
                  <button
                    disabled={tick.isPending}
                    onClick={() => tick.mutate({ session_id: session.id, user_id: p.user_id, paid: !p.paid })}
                    className="h-6 px-2 border text-[7px] font-bold tracking-[0.12em] inline-flex items-center gap-1 disabled:opacity-40 shrink-0"
                    style={{ borderColor: '#3A2F20', color: p.paid ? '#7A6E60' : '#8A8F45', background: '#0C0A07' }}
                  >
                    {tick.isPending ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Check className="w-2.5 h-2.5" />}
                    {p.paid ? 'UNTICK — IT DID NOT LAND' : 'CONFIRM IT LANDED'}
                  </button>
                )}
              </div>
            ))}
          </div>
          {settled.outstanding_payouts > 0 && (
            <p className="text-[8px]" style={{ color: '#C8893B' }}>
              {settled.outstanding_payouts} direct settlement{settled.outstanding_payouts === 1 ? '' : 's'} not yet confirmed landed.
            </p>
          )}
          {(settled.no_shows || []).length > 0 && (
            <p className="text-[8px] leading-relaxed" style={{ color: '#8A7E6C' }}>
              Said they were in and did not stand it: {settled.no_shows.map((n) => n.handle).join(', ')}. A fact for
              the council to weigh with whatever they have to say — never a mark applied by arithmetic.
            </p>
          )}
        </div>
      )}

      {session.debrief && (
        <div className="border p-2 space-y-1" style={{ borderColor: '#241C12', background: '#0A0806' }}>
          <div className="text-[7px] font-bold tracking-[0.2em]" style={{ color: '#6B6155' }}>DEBRIEF — SO THE NEXT RUN IS BETTER</div>
          <p className="text-[9px] leading-relaxed whitespace-pre-wrap" style={{ color: '#C6BCAB' }}>{session.debrief}</p>
        </div>
      )}
    </div>
  );
}