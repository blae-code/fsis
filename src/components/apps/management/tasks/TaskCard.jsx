import React from 'react';
import { Clock, MapPin, User } from 'lucide-react';
import { TASK_STATUS_META, PRIORITY_COLOR, fmtAuec, daysUntil } from '@/components/apps/management/tasks/taskMeta';

/** One task as the council sees it, with withdraw/repost controls where they apply. */
export default function TaskCard({ task, onCancel, onRepost, pending }) {
  const meta = TASK_STATUS_META[task.status] || TASK_STATUS_META.posted;
  const left = daysUntil(task.due_date);
  const overdue = left !== null && left < 0 && !['credited', 'cancelled'].includes(task.status);

  return (
    <div className="border p-2 space-y-1.5" style={{ borderColor: overdue ? '#5C302A' : '#2E2519', background: '#0C0A07' }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[11px] truncate" style={{ color: '#EDE5D6' }}>{task.title}</div>
          <div className="text-[8px] tracking-[0.14em]" style={{ color: PRIORITY_COLOR[task.priority] || '#7A6E60' }}>
            {(task.category || '').toUpperCase()} · {(task.priority || 'routine').toUpperCase()}
          </div>
        </div>
        <span className="px-1.5 py-0.5 border text-[7px] font-bold tracking-[0.14em] shrink-0" style={{ borderColor: `${meta.color}55`, color: meta.color, background: `${meta.color}14` }}>
          {meta.label}
        </span>
      </div>
      {task.brief && <p className="text-[9px] leading-snug line-clamp-2" style={{ color: '#8A7E6C' }}>{task.brief}</p>}
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[8px]" style={{ color: '#6B6155' }}>
        <span style={{ color: '#8A8F45' }}>{fmtAuec(task.agreed_credit_auec)}</span>
        {task.assigned_handle && <span className="flex items-center gap-1"><User className="w-2.5 h-2.5" /> {task.assigned_handle}</span>}
        {task.location && <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" /> {task.location}</span>}
        {task.due_date && (
          <span className="flex items-center gap-1" style={{ color: overdue ? '#D08A6A' : '#6B6155' }}>
            <Clock className="w-2.5 h-2.5" /> {overdue ? `${Math.abs(left)}D OVERDUE` : `${left}D LEFT`}
          </span>
        )}
      </div>
      {task.review_notes && <p className="text-[8px]" style={{ color: '#8A7E6C' }}>COUNCIL: {task.review_notes}</p>}
      <div className="flex gap-1">
        {['posted', 'claimed'].includes(task.status) && (
          <button disabled={pending} onClick={() => onCancel(task)} className="px-2 py-1 border text-[7px] font-bold tracking-[0.12em] disabled:opacity-40" style={{ borderColor: '#5C302A', color: '#D08A6A', background: '#140B08' }}>
            WITHDRAW
          </button>
        )}
        {['cancelled', 'returned'].includes(task.status) && (
          <button disabled={pending} onClick={() => onRepost(task)} className="px-2 py-1 border text-[7px] font-bold tracking-[0.12em] disabled:opacity-40" style={{ borderColor: '#5C4424', color: '#C8A05B', background: '#120D08' }}>
            REPOST TO BOARD
          </button>
        )}
      </div>
    </div>
  );
}