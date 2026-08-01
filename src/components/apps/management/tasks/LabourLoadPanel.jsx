import React, { useMemo } from 'react';
import { Users, AlertTriangle } from 'lucide-react';
import { fmtAuec, daysUntil } from '@/components/apps/management/tasks/taskMeta';

/** Days a filed task has waited on the council. Labour must never go unpaid through silence. */
const daysWaiting = (task) =>
  Math.floor((Date.now() - new Date(task.submitted_at || task.created_date).getTime()) / 86400000);

const SLA_DAYS = 3;

/**
 * Who is carrying what, and what the council has left waiting. Both halves of the same duty:
 * no comrade overloaded, and no filed work left unanswered.
 */
export default function LabourLoadPanel({ tasks }) {
  const hands = useMemo(() => {
    const byHand = new Map();
    tasks
      .filter((t) => ['claimed', 'submitted'].includes(t.status) && t.assigned_user_id)
      .forEach((t) => {
        const key = t.assigned_handle || t.assigned_email || t.assigned_user_id;
        const row = byHand.get(key) || { handle: key, held: 0, filed: 0, overdue: 0, owed: 0 };
        if (t.status === 'claimed') row.held += 1; else row.filed += 1;
        const left = daysUntil(t.due_date);
        if (left !== null && left < 0) row.overdue += 1;
        row.owed += Number(t.agreed_credit_auec) || 0;
        byHand.set(key, row);
      });
    return [...byHand.values()].sort((a, b) => (b.held + b.filed) - (a.held + a.filed));
  }, [tasks]);

  const ageing = useMemo(
    () => tasks.filter((t) => t.status === 'submitted' && daysWaiting(t) >= SLA_DAYS)
      .sort((a, b) => daysWaiting(b) - daysWaiting(a)),
    [tasks],
  );

  if (hands.length === 0 && ageing.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[9px] tracking-[0.2em]" style={{ color: '#6FA0C8' }}>
        <Users className="w-3.5 h-3.5" /> WHO CARRIES THE WORK
      </div>

      {ageing.length > 0 && (
        <div className="border p-2 space-y-1" style={{ borderColor: '#5C302A', background: '#140B08' }}>
          <div className="flex items-center gap-1.5 text-[9px] font-bold tracking-[0.14em]" style={{ color: '#D08A6A' }}>
            <AlertTriangle className="w-3 h-3" /> {ageing.length} FILED {ageing.length === 1 ? 'TASK' : 'TASKS'} WAITING {SLA_DAYS}+ DAYS ON THE COUNCIL
          </div>
          {ageing.slice(0, 6).map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-2 text-[9px]">
              <span className="truncate" style={{ color: '#EDE5D6' }}>{t.title}</span>
              <span className="shrink-0" style={{ color: '#D08A6A' }}>
                {t.assigned_handle || t.assigned_email} · {daysWaiting(t)}D UNPAID
              </span>
            </div>
          ))}
          <p className="text-[8px]" style={{ color: '#8A7E6C' }}>
            Work filed is work done. Credit it or send it back with reasons — silence is not an answer.
          </p>
        </div>
      )}

      {hands.length > 0 && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-2">
          {hands.map((h) => (
            <div key={h.handle} className="border p-2 space-y-0.5" style={{ borderColor: h.overdue > 0 ? '#5C302A' : '#2E2519', background: '#0C0A07' }}>
              <div className="text-[10px] truncate" style={{ color: '#EDE5D6' }}>{h.handle}</div>
              <div className="flex flex-wrap gap-x-2 text-[8px] tracking-[0.12em]">
                <span style={{ color: '#6FA0C8' }}>{h.held} IN HAND</span>
                {h.filed > 0 && <span style={{ color: '#C8893B' }}>{h.filed} FILED</span>}
                {h.overdue > 0 && <span style={{ color: '#D08A6A' }}>{h.overdue} OVERDUE</span>}
              </div>
              <div className="text-[9px]" style={{ color: '#8A8F45' }}>{fmtAuec(h.owed)} OWED TO THEM</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}