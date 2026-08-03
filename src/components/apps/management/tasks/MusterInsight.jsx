import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMusterTimes } from '@/functions/getMusterTimes';
import { getOperationPlan } from '@/functions/getOperationPlan';
import { Loader2, Clock3, CalendarArrowDown as CalendarDown } from 'lucide-react';

/**
 * The run in everybody's own time, and whether the haul actually fits the hull.
 *
 * The best-time reading is a reading, never a verdict — every hour is listed with who it is awkward
 * for, because an hour that suits the most people can still be the same two comrades losing out
 * every week.
 */
export default function MusterInsight({ op }) {
  const [open, setOpen] = useState(false);

  const { data: times, isLoading: loadingTimes } = useQuery({
    queryKey: ['muster_times', op.id],
    queryFn: () => getMusterTimes({ operation_id: op.id }).then((r) => r.data),
    enabled: open,
  });
  const { data: plan, isLoading: loadingPlan } = useQuery({
    queryKey: ['op_plan', op.id],
    queryFn: () => getOperationPlan({ operation_id: op.id }).then((r) => r.data),
    enabled: open,
  });

  const downloadIcs = () => {
    const blob = new Blob([times.calendar], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(op.op_name || 'muster').replace(/[^a-z0-9]+/gi, '-')}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-2 py-1 border text-[7px] font-bold tracking-[0.12em] inline-flex items-center gap-1"
        style={{ borderColor: '#3A2F20', color: '#6FA0C8', background: '#0A0C0E' }}
      >
        <Clock3 className="w-2.5 h-2.5" /> TIMES & PLAN
      </button>
    );
  }

  return (
    <div className="w-full border p-2 space-y-2" style={{ borderColor: '#2E2519', background: '#0A0806' }}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[7px] font-bold tracking-[0.2em]" style={{ color: '#6FA0C8' }}>TIMES & PLAN</div>
        <button onClick={() => setOpen(false)} className="text-[7px]" style={{ color: '#6B6155' }}>CLOSE</button>
      </div>

      {(loadingTimes || loadingPlan) && (
        <div className="flex justify-center py-3"><Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: '#E0A22E' }} /></div>
      )}

      {times && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap text-[8px]" style={{ color: '#C8A05B' }}>
            {times.your_time
              ? <span>YOUR CLOCK: {times.your_time.label} ({times.your_time.date}){times.your_time.in_evening ? ' — YOUR EVENING' : ''}</span>
              : <span style={{ color: '#8A7E6C' }}>{times.your_time_note}</span>}
            {times.calendar && (
              <button onClick={downloadIcs} className="h-6 px-2 border text-[7px] font-bold tracking-[0.1em] inline-flex items-center gap-1" style={{ borderColor: '#3A2F20', color: '#C8A05B', background: '#120D08' }}>
                <CalendarDown className="w-2.5 h-2.5" /> CALENDAR FILE
              </button>
            )}
          </div>

          {(times.respondents || []).length > 0 && (
            <div className="border divide-y" style={{ borderColor: '#241C12' }}>
              {times.respondents.map((r, i) => (
                <div key={i} className="flex items-center gap-2 px-2 py-1 text-[8px]" style={{ borderColor: '#1C1610' }}>
                  <span style={{ color: '#EDE5D6' }}>{r.handle}</span>
                  <span style={{ color: r.response === 'in' ? '#8A8F45' : '#C8893B' }}>{r.response.toUpperCase()}</span>
                  {r.waitlisted && <span style={{ color: '#6FA0C8' }}>WAITLISTED</span>}
                  <span className="ml-auto" style={{ color: r.their_time ? (r.their_time.in_evening ? '#8A8F45' : '#C8893B') : '#6B6155' }}>
                    {r.their_time ? `${r.their_time.label} THEIR TIME${r.their_time.in_evening ? '' : ' — OUTSIDE THEIR EVENING'}` : 'ZONE NOT ON RECORD'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {times.best_times_note && (
            <p className="text-[7px] leading-relaxed" style={{ color: '#8A7E6C' }}>
              {times.best_times_note}
              {times.zones_unknown > 0 ? ` ${times.zones_unknown} respondent${times.zones_unknown === 1 ? "'s zone is" : "s' zones are"} unknown and left out rather than assumed.` : ''}
            </p>
          )}
          {(times.best_times || []).slice(0, 5).map((h) => (
            <div key={h.utc_hour} className="flex items-baseline gap-2 text-[8px]">
              <span style={{ color: '#E0A22E' }}>{h.utc_label}</span>
              <span style={{ color: '#8A8F45' }}>SUITS {h.suits}/{h.of}</span>
              {h.awkward_for.length > 0 && (
                <span className="truncate" style={{ color: '#C8893B' }}>
                  AWKWARD FOR {h.awkward_for.map((a) => `${a.time_zone} (${a.local})`).join(', ')}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {plan && (
        <div className="border-t pt-2 space-y-1" style={{ borderColor: '#241C12' }}>
          <div className="text-[7px] font-bold tracking-[0.18em]" style={{ color: '#6B6155' }}>
            THE HAUL AGAINST THE HULL
            {plan.capacity_source === 'freight_plan' ? ` — CAPACITY FROM FREIGHT PLAN "${plan.freight_plan?.plan_name}"` : plan.capacity_source === 'operation' ? ' — CAPACITY AS STATED ON THE MUSTER' : ''}
          </div>
          <p className="text-[8px] leading-relaxed" style={{ color: plan.haul?.fits === false ? '#D08A6A' : '#C8A05B' }}>{plan.haul?.note}</p>
          {plan.against_the_run && (
            <div className="space-y-0.5">
              <div className="text-[8px]" style={{ color: '#6FA0C8' }}>
                EXPECTED {plan.against_the_run.expected_scu} SCU · CAME BACK {plan.against_the_run.actual_scu} SCU
                {plan.against_the_run.ratio !== null ? ` · ${Math.round(plan.against_the_run.ratio * 100)}% OF THE ESTIMATE` : ''}
                {` · ${plan.against_the_run.value_auec?.toLocaleString?.() || 0} aUEC ACROSS ${plan.against_the_run.cargo_lots} LOTS`}
              </div>
              <p className="text-[7px] leading-relaxed" style={{ color: '#6B6155' }}>{plan.against_the_run.note}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}