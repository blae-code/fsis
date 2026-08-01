import React, { useState } from 'react';
import { Clock, MapPin, Loader2, Upload, Hourglass } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { TASK_STATUS_META, PRIORITY_COLOR, fmtAuec, daysUntil } from '@/components/apps/management/tasks/taskMeta';
import TaskMessageThread from '@/components/work/TaskMessageThread';
import CrewStrip from '@/components/work/CrewStrip';

const box = { borderColor: '#3A2F20', background: '#0C0A07', color: '#EDE5D6' };

/** A task as the worker sees it: take it up, then file your own account of the labour done. */
export default function WorkerTaskCard({ task, mine, onClaim, onSubmit, onRelease, pending, actor }) {
  const [notes, setNotes] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [releaseReason, setReleaseReason] = useState('');
  const [hours, setHours] = useState('');
  const meta = TASK_STATUS_META[task.status] || TASK_STATUS_META.posted;
  const left = daysUntil(task.due_date);
  const overdue = left !== null && left < 0 && !['credited', 'cancelled'].includes(task.status);
  // A hand who has already filed is not asked twice while the rest of the crew finishes.
  const myHand = (task.crew || []).find((h) => h && h.user_id === actor?.id && !h.released_at);
  const iFiled = !!myHand?.submitted_at;
  const canFile = mine && !iFiled && ['claimed', 'returned'].includes(task.status);

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFileUrl(file_url);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border p-3 space-y-2" style={{ borderColor: overdue ? '#5C302A' : '#2E2519', background: '#0C0A07' }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[12px] truncate" style={{ color: '#EDE5D6' }}>{task.title}</div>
          <div className="text-[8px] tracking-[0.14em]" style={{ color: PRIORITY_COLOR[task.priority] || '#7A6E60' }}>
            {(task.category || '').toUpperCase()} · {(task.priority || 'routine').toUpperCase()}
          </div>
        </div>
        <span className="px-1.5 py-0.5 border text-[7px] font-bold tracking-[0.14em] shrink-0" style={{ borderColor: `${meta.color}55`, color: meta.color, background: `${meta.color}14` }}>
          {meta.label}
        </span>
      </div>

      {task.brief && <p className="text-[10px] leading-snug" style={{ color: '#A89C8A' }}>{task.brief}</p>}

      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[9px]" style={{ color: '#6B6155' }}>
        <span className="font-bold" style={{ color: '#8A8F45' }}>{fmtAuec(task.agreed_credit_auec)} — YOURS IN FULL</span>
        {task.estimated_hours > 0 && (
          <span className="flex items-center gap-1"><Hourglass className="w-2.5 h-2.5" /> ~{task.estimated_hours}H RECKONED</span>
        )}
        {task.location && <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" /> {task.location}</span>}
        {task.due_date && (
          <span className="flex items-center gap-1" style={{ color: overdue ? '#D08A6A' : '#6B6155' }}>
            <Clock className="w-2.5 h-2.5" /> {overdue ? `${Math.abs(left)}D OVERDUE` : `${left}D LEFT`}
          </span>
        )}
      </div>

      {task.review_notes && (
        <p className="text-[9px] border-l pl-2" style={{ color: task.status === 'returned' ? '#D08A6A' : '#8A8F45', borderColor: '#3A2F20' }}>
          COUNCIL: {task.review_notes}
        </p>
      )}
      {task.status === 'credited' && (
        <p className="text-[9px]" style={{ color: '#8A8F45' }}>CREDITED {fmtAuec(task.credited_auec)} — settled directly to you.</p>
      )}

      {task.status === 'posted' && !mine && (
        <button
          disabled={pending}
          onClick={() => onClaim(task)}
          className="h-9 w-full border text-[9px] font-bold tracking-[0.14em] inline-flex items-center justify-center gap-2 disabled:opacity-40"
          style={{ borderColor: '#E0A22E', color: '#0C0A07', background: 'linear-gradient(135deg, #E0A22E, #C8893B)' }}
        >
          {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : null} TAKE UP THIS WORK
        </button>
      )}

      {canFile && (
        <div className="space-y-2 border-t pt-2" style={{ borderColor: '#2E2519' }}>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Your account of the work done" className="w-full border px-2 py-1.5 text-[10px]" style={box} />
          <div className="flex items-center gap-2">
            <label className="h-8 px-2 border text-[8px] font-bold tracking-[0.12em] inline-flex items-center gap-1 cursor-pointer" style={{ borderColor: '#3A2F20', color: '#C8A05B', background: '#120D08' }}>
              {uploading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Upload className="w-2.5 h-2.5" />} ATTACH PROOF
              <input type="file" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
            </label>
            {fileUrl && <span className="text-[8px]" style={{ color: '#8A8F45' }}>PROOF ATTACHED</span>}
          </div>
          <div className="space-y-1">
            <input
              type="number"
              min="0"
              max="24"
              step="0.25"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="Hours it actually took (optional)"
              className="w-full border px-2 py-1.5 text-[10px]"
              style={box}
            />
            <p className="text-[8px] leading-relaxed" style={{ color: '#6B6155' }}>
              Your own count of your own labour — no clock is kept over you. It corrects the council's estimate so
              the next comrade offered this work is offered it honestly.
            </p>
          </div>
          <button
            disabled={pending || uploading || (!notes.trim() && !fileUrl)}
            onClick={() => onSubmit({ task_id: task.id, proof_notes: notes.trim(), proof_file_url: fileUrl, ...(hours ? { actual_hours: Number(hours) } : {}) })}
            className="h-9 w-full border text-[9px] font-bold tracking-[0.14em] disabled:opacity-40"
            style={{ borderColor: '#8A8F4555', color: '#8A8F45', background: '#0E1009' }}
          >
            FILE THE WORK
          </button>
        </div>
      )}

      {mine && ['claimed', 'returned'].includes(task.status) && onRelease && (
        releasing ? (
          <div className="space-y-1.5 border-t pt-2" style={{ borderColor: '#2E2519' }}>
            <p className="text-[8px] leading-relaxed" style={{ color: '#8A7E6C' }}>
              Nobody is chained to work they cannot finish. Handing it back costs the collective time it cannot
              recover, so it is counted against your standing — weighted by the harm done, and open to appeal.
            </p>
            <textarea
              value={releaseReason}
              onChange={(e) => setReleaseReason(e.target.value)}
              rows={2}
              placeholder="Why the work is going back on the board"
              className="w-full border px-2 py-1.5 text-[10px]"
              style={box}
            />
            <div className="flex gap-1">
              <button
                onClick={() => setReleasing(false)}
                className="flex-1 h-8 border text-[8px] font-bold tracking-[0.12em]"
                style={{ borderColor: '#2E2519', color: '#7A6E60', background: '#0C0A07' }}
              >
                KEEP IT
              </button>
              <button
                disabled={pending || !releaseReason.trim()}
                onClick={() => onRelease({ task_id: task.id, reason: releaseReason.trim() })}
                className="flex-1 h-8 border text-[8px] font-bold tracking-[0.12em] disabled:opacity-40"
                style={{ borderColor: '#5C302A', color: '#D08A6A', background: '#140B08' }}
              >
                HAND IT BACK
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setReleasing(true)}
            className="h-7 w-full border text-[8px] font-bold tracking-[0.12em]"
            style={{ borderColor: '#3A2F20', color: '#8A7E6C', background: '#0C0A07' }}
          >
            HAND THIS WORK BACK
          </button>
        )
      )}

      {iFiled && task.status !== 'submitted' && mine && (
        <p className="text-[9px]" style={{ color: '#C8893B' }}>YOUR ACCOUNT IS FILED — waiting on the rest of the crew.</p>
      )}

      {task.status === 'submitted' && mine && (
        <p className="text-[9px]" style={{ color: '#C8893B' }}>FILED — awaiting the council's review.</p>
      )}

      {mine && <CrewStrip task={task} userId={actor?.id} />}

      <TaskMessageThread task={task} as="worker" actor={actor} />
    </div>
  );
}