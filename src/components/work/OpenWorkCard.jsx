import React from 'react';
import { Clock, MapPin, Users, Loader2, Lock, Hourglass } from 'lucide-react';
import { PRIORITY_COLOR, fmtAuec, daysUntil } from '@/components/apps/management/tasks/taskMeta';

/**
 * A task open on the board, as the board itself describes it: what it pays, how many places are
 * left, what it is waiting on, and why it was put in front of you. Matching surfaces work; it
 * never restricts it — every open task is here and every one is yours to take.
 */
export default function OpenWorkCard({ task, pending, onClaim }) {
  const left = daysUntil(task.due_date);
  const blocked = (task.waiting_on || []).length > 0;
  const full = task.places_left <= 0;
  const canTake = !blocked && !full && !task.already_yours;

  return (
    <div className="border p-3 space-y-2" style={{ borderColor: blocked ? '#3A2F20' : '#2E2519', background: '#0C0A07' }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[12px] truncate" style={{ color: '#EDE5D6' }}>{task.title}</div>
          <div className="text-[8px] tracking-[0.14em]" style={{ color: PRIORITY_COLOR[task.priority] || '#7A6E60' }}>
            {(task.category || '').toUpperCase()} · {(task.priority || 'routine').toUpperCase()}
          </div>
        </div>
        {task.hands_needed > 1 && (
          <span
            className="px-1.5 py-0.5 border text-[7px] font-bold tracking-[0.14em] shrink-0 inline-flex items-center gap-1"
            style={{ borderColor: '#6FA0C855', color: '#6FA0C8', background: '#6FA0C814' }}
          >
            <Users className="w-2.5 h-2.5" /> {task.hands_on}/{task.hands_needed} HANDS
          </span>
        )}
      </div>

      {task.brief && <p className="text-[10px] leading-snug" style={{ color: '#A89C8A' }}>{task.brief}</p>}

      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[9px]" style={{ color: '#6B6155' }}>
        <span className="font-bold" style={{ color: '#8A8F45' }}>{fmtAuec(task.agreed_credit_auec)} — YOURS IN FULL</span>
        {task.estimated_hours > 0 && (
          <span className="inline-flex items-center gap-1"><Hourglass className="w-2.5 h-2.5" /> ~{task.estimated_hours}H RECKONED</span>
        )}
        {task.location && <span className="inline-flex items-center gap-1"><MapPin className="w-2.5 h-2.5" /> {task.location}</span>}
        {task.due_date && (
          <span className="inline-flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {left}D LEFT</span>
        )}
      </div>

      {(task.match_reasons || []).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.match_reasons.map((reason, i) => (
            <span
              key={i}
              className="px-1.5 py-0.5 border text-[7px] tracking-[0.1em]"
              style={{ borderColor: '#3A2F20', color: '#C8A05B', background: '#120D08' }}
            >
              {String(reason).toUpperCase()}
            </span>
          ))}
        </div>
      )}

      {blocked && (
        <div className="border-l-2 pl-2 py-1 space-y-0.5" style={{ borderColor: '#C8893B' }}>
          <div className="text-[8px] tracking-[0.14em] inline-flex items-center gap-1" style={{ color: '#C8893B' }}>
            <Lock className="w-2.5 h-2.5" /> WAITING ON OTHER WORK
          </div>
          {task.waiting_on.map((w) => (
            <div key={w.task_id} className="text-[9px]" style={{ color: '#8A7E6C' }}>{w.title}</div>
          ))}
        </div>
      )}

      {task.already_yours ? (
        <p className="text-[9px] text-center py-1" style={{ color: '#6FA0C8' }}>YOUR HANDS ARE ALREADY ON THIS.</p>
      ) : full ? (
        <p className="text-[9px] text-center py-1" style={{ color: '#7A6E60' }}>ALL PLACES TAKEN.</p>
      ) : (
        <button
          disabled={pending || !canTake}
          onClick={() => onClaim(task)}
          className="h-9 w-full border text-[9px] font-bold tracking-[0.14em] inline-flex items-center justify-center gap-2 disabled:opacity-40"
          style={{ borderColor: '#E0A22E', color: '#0C0A07', background: 'linear-gradient(135deg, #E0A22E, #C8893B)' }}
        >
          {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
          {blocked ? 'NOT YET READY' : task.hands_needed > 1 ? `JOIN THIS CREW — ${task.places_left} PLACE${task.places_left === 1 ? '' : 'S'} LEFT` : 'TAKE UP THIS WORK'}
        </button>
      )}
    </div>
  );
}