import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Loader2 } from 'lucide-react';
import TaskPostForm from '@/components/apps/management/tasks/TaskPostForm';
import TaskReviewQueue from '@/components/apps/management/tasks/TaskReviewQueue';
import TaskCard from '@/components/apps/management/tasks/TaskCard';
import { TASK_STATUS_META, fmtAuec } from '@/components/apps/management/tasks/taskMeta';

const FILTERS = ['posted', 'claimed', 'submitted', 'credited', 'returned', 'cancelled'];

/** Council view of all task labour: post work, watch it move, review what comes back. */
export default function TaskWorkOrderConsole() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('all');
  const { data: actor } = useQuery({ queryKey: ['user'], queryFn: () => base44.auth.me() });
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['labour_tasks'],
    queryFn: () => base44.entities.labour_task.list('-created_date', 300),
    refetchInterval: 30000,
  });

  const patch = useMutation({
    mutationFn: ({ id, data }) => base44.entities.labour_task.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['labour_tasks'] }),
  });

  const counts = useMemo(() => {
    const c = {};
    FILTERS.forEach((f) => { c[f] = tasks.filter((t) => t.status === f).length; });
    return c;
  }, [tasks]);

  const submitted = useMemo(() => tasks.filter((t) => t.status === 'submitted'), [tasks]);
  const visible = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);
  const outstanding = useMemo(
    () => tasks.filter((t) => ['posted', 'claimed', 'submitted'].includes(t.status))
      .reduce((sum, t) => sum + (Number(t.agreed_credit_auec) || 0), 0),
    [tasks],
  );
  const creditedTotal = useMemo(
    () => tasks.filter((t) => t.status === 'credited').reduce((sum, t) => sum + (Number(t.credited_auec) || 0), 0),
    [tasks],
  );

  return (
    <div className="p-4 space-y-3 font-mono">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-[10px] tracking-[0.24em]" style={{ color: '#E0A22E' }}>
          <ClipboardList className="w-4 h-4" /> TASK WORK ORDERS — LABOUR OWED AND LABOUR PAID
        </div>
        <p className="text-[9px] max-w-3xl leading-relaxed" style={{ color: '#8A7E6C' }}>
          A task is a discrete piece of labour with an agreed price attached. The worker takes it up of their own
          accord, files their own account of what was done, and is paid the full sum on credit — no deductions,
          no share dilution, no waiting on the pay day cycle.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { k: 'OPEN ON BOARD', v: counts.posted || 0, c: '#E0A22E' },
          { k: 'IN HAND', v: counts.claimed || 0, c: '#6FA0C8' },
          { k: 'OWED OUT', v: fmtAuec(outstanding), c: '#C8893B' },
          { k: 'PAID TO DATE', v: fmtAuec(creditedTotal), c: '#8A8F45' },
        ].map((s) => (
          <div key={s.k} className="border p-2" style={{ borderColor: '#2E2519', background: '#0C0A07' }}>
            <div className="text-[7px] tracking-[0.2em]" style={{ color: '#6B6155' }}>{s.k}</div>
            <div className="text-sm font-bold" style={{ color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>

      <TaskPostForm actorEmail={actor?.email} />
      <TaskReviewQueue tasks={submitted} />

      <div className="flex flex-wrap gap-1">
        {['all', ...FILTERS].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-2 py-1 border text-[8px] font-bold tracking-[0.14em]"
            style={{
              borderColor: filter === f ? '#E0A22E' : '#2E2519',
              color: filter === f ? '#E0A22E' : '#7A6E60',
              background: '#0C0A07',
            }}
          >
            {f === 'all' ? `ALL ${tasks.length}` : `${TASK_STATUS_META[f].label} ${counts[f]}`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-4 h-4 animate-spin" style={{ color: '#E0A22E' }} /></div>
      ) : visible.length === 0 ? (
        <p className="text-[9px] py-6 text-center" style={{ color: '#6B6155' }}>No tasks in this state.</p>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-2">
          {visible.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              pending={patch.isPending}
              onCancel={(task) => patch.mutate({ id: task.id, data: { status: 'cancelled' } })}
              onRepost={(task) => patch.mutate({ id: task.id, data: { status: 'posted', assigned_user_id: '', assigned_handle: '', assigned_email: '', proof_notes: '', proof_file_url: '' } })}
            />
          ))}
        </div>
      )}
    </div>
  );
}