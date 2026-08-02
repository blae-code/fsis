import React from 'react';
import { CalendarClock, Loader2, MapPin, Ship, Users, Play, Archive, RotateCcw } from 'lucide-react';
import { fmtAuec } from '@/components/apps/management/tasks/taskMeta';
import { WEEKDAYS, nextOccurrence } from '@/lib/operationTemplates';

/** One standing run: its terms, when it next comes round, and the call that puts it on the calendar. */
export default function OperationTemplateRow({ tpl, pending, onCall, onToggle }) {
  const next = nextOccurrence(tpl.weekday, tpl.time_of_day);
  const retired = tpl.active === false;

  return (
    <div className="border p-2 space-y-1.5" style={{ borderColor: retired ? '#241C12' : '#2E2519', background: '#0C0A07', opacity: retired ? 0.6 : 1 }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[11px] truncate" style={{ color: '#EDE5D6' }}>{tpl.template_name}</div>
          <div className="text-[8px] truncate" style={{ color: '#7A6E60' }}>POSTS AS: {tpl.op_name}</div>
        </div>
        <span className="px-1.5 py-0.5 border text-[7px] font-bold tracking-[0.14em] shrink-0" style={{ borderColor: '#4A3A22', color: '#E0A22E', background: '#E0A22E14' }}>
          EVERY {WEEKDAYS[Number(tpl.weekday) || 0]} {tpl.time_of_day}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[8px]" style={{ color: '#6B6155' }}>
        <span className="flex items-center gap-1" style={{ color: '#C8A05B' }}>
          <CalendarClock className="w-2.5 h-2.5" /> NEXT {next.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
        </span>
        {tpl.duration_hours ? <span>~{tpl.duration_hours}H</span> : null}
        {tpl.muster_location && <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" /> {tpl.muster_location}</span>}
        {tpl.ship && <span className="flex items-center gap-1"><Ship className="w-2.5 h-2.5" /> {tpl.ship}</span>}
        <span className="flex items-center gap-1"><Users className="w-2.5 h-2.5" /> {tpl.crew_needed || 0} HANDS</span>
        <span style={{ color: tpl.pay_basis === 'shares' ? '#8A8F45' : '#C8893B' }}>
          {tpl.pay_basis === 'shares' ? 'SHARES' : `DIRECT ${fmtAuec(tpl.flat_credit_auec)}/HAND`}
        </span>
        {tpl.times_called > 0 && <span>CALLED {tpl.times_called}×</span>}
      </div>

      <div className="flex gap-1">
        {!retired && (
          <button
            disabled={pending}
            onClick={() => onCall(tpl)}
            className="h-8 flex-1 border text-[8px] font-bold tracking-[0.14em] inline-flex items-center justify-center gap-1 disabled:opacity-40"
            style={{ borderColor: '#E0A22E', color: '#0C0A07', background: 'linear-gradient(135deg, #E0A22E, #C8893B)' }}
          >
            {pending ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Play className="w-2.5 h-2.5" />} PUT ON THE CALENDAR
          </button>
        )}
        <button
          disabled={pending}
          onClick={() => onToggle(tpl)}
          className="h-8 px-2 border text-[8px] font-bold tracking-[0.12em] inline-flex items-center gap-1 disabled:opacity-40"
          style={{ borderColor: '#3A2F20', color: '#8A7E6C', background: '#120D08' }}
        >
          {retired ? <><RotateCcw className="w-2.5 h-2.5" /> REINSTATE</> : <><Archive className="w-2.5 h-2.5" /> RETIRE</>}
        </button>
      </div>
    </div>
  );
}