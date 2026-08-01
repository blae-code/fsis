import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { claimTask } from '@/functions/claimTask';
import { submitTaskProof } from '@/functions/submitTaskProof';
import { rsvpOperation } from '@/functions/rsvpOperation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Hammer, Loader2, ArrowLeft } from 'lucide-react';
import WorkerTaskCard from '@/components/work/WorkerTaskCard';
import OperationRsvpCard from '@/components/work/OperationRsvpCard';
import WorkHistoryPanel from '@/components/work/WorkHistoryPanel';
import { fmtAuec } from '@/components/apps/management/tasks/taskMeta';

/** The labour board: work open to any comrade, and the tasks each holds in hand. */
export default function WorkBoard() {
  const qc = useQueryClient();
  const { data: user, isLoading: loadingUser } = useQuery({ queryKey: ['user'], queryFn: () => base44.auth.me() });
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['work_board_tasks'],
    queryFn: () => base44.entities.labour_task.list('-created_date', 200),
    refetchInterval: 30000,
  });

  const { data: operations = [] } = useQuery({
    queryKey: ['work_board_operations'],
    queryFn: () => base44.entities.crew_operation.list('-starts_at', 100),
    refetchInterval: 30000,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['work_board_tasks'] });
    qc.invalidateQueries({ queryKey: ['labour_tasks'] });
  };
  const claim = useMutation({ mutationFn: (task) => claimTask({ task_id: task.id }), onSuccess: invalidate });
  const submit = useMutation({ mutationFn: (payload) => submitTaskProof(payload), onSuccess: invalidate });
  const rsvp = useMutation({
    mutationFn: (payload) => rsvpOperation(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['work_board_operations'] }),
  });

  const mine = useMemo(() => tasks.filter((t) => user && t.assigned_user_id === user.id), [tasks, user]);
  const open = useMemo(() => tasks.filter((t) => t.status === 'posted'), [tasks]);
  const earned = useMemo(
    () => mine.filter((t) => t.status === 'credited').reduce((s, t) => s + (Number(t.credited_auec) || 0), 0),
    [mine],
  );
  const upcoming = useMemo(
    () => operations.filter((o) => ['scheduled', 'mustering', 'underway'].includes(o.status)),
    [operations],
  );
  const error = claim.error || submit.error || rsvp.error;

  if (loadingUser || isLoading) {
    return (
      <div className="os-viewport flex items-center justify-center" style={{ background: '#080604' }}>
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#E0A22E' }} />
      </div>
    );
  }

  return (
    <div className="os-viewport overflow-auto font-mono" style={{ background: '#080604' }}>
      <div className="max-w-6xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[10px] tracking-[0.24em]" style={{ color: '#E0A22E' }}>
            <Hammer className="w-4 h-4" /> THE LABOUR BOARD
          </div>
          <Link to="/" className="text-[9px] tracking-[0.16em] inline-flex items-center gap-1" style={{ color: '#7A6E60' }}>
            <ArrowLeft className="w-3 h-3" /> STOREFRONT
          </Link>
        </div>
        <p className="text-[9px] max-w-3xl leading-relaxed" style={{ color: '#8A7E6C' }}>
          Every task here carries its price up front. Take up only what you choose to, do the work, file your own
          account of it, and collect the whole sum — the value you create is not skimmed on its way back to you.
        </p>

        {error && (
          <p className="border p-2 text-[9px]" style={{ borderColor: '#5C302A', color: '#D08A6A', background: '#140B08' }}>
            {error?.response?.data?.error || error.message}
          </p>
        )}

        <section className="space-y-2">
          <div className="flex items-center gap-2 text-[9px] tracking-[0.2em]" style={{ color: '#6FA0C8' }}>
            WORK IN YOUR HANDS
            <span className="text-[8px]" style={{ color: '#8A8F45' }}>· {fmtAuec(earned)} CREDITED TO YOU</span>
          </div>
          {mine.length === 0 ? (
            <p className="text-[9px] py-4 text-center border" style={{ color: '#6B6155', borderColor: '#2E2519' }}>
              You hold no tasks. Take one up from the board below.
            </p>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-2">
              {mine.map((t) => (
                <WorkerTaskCard key={t.id} task={t} mine pending={submit.isPending} onSubmit={(p) => submit.mutate(p)} onClaim={() => {}} />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-2">
          <div className="text-[9px] tracking-[0.2em]" style={{ color: '#6FA0C8' }}>MUSTERS CALLED — {upcoming.length}</div>
          {upcoming.length === 0 ? (
            <p className="text-[9px] py-4 text-center border" style={{ color: '#6B6155', borderColor: '#2E2519' }}>
              No musters called. Nobody is owed your time until you offer it.
            </p>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-2">
              {upcoming.map((op) => (
                <OperationRsvpCard key={op.id} op={op} userId={user?.id} pending={rsvp.isPending} onRsvp={(p) => rsvp.mutate(p)} />
              ))}
            </div>
          )}
        </section>

        <WorkHistoryPanel tasks={mine} operations={operations} userId={user?.id} />

        <section className="space-y-2">
          <div className="text-[9px] tracking-[0.2em]" style={{ color: '#E0A22E' }}>OPEN ON THE BOARD — {open.length}</div>
          {open.length === 0 ? (
            <p className="text-[9px] py-4 text-center border" style={{ color: '#6B6155', borderColor: '#2E2519' }}>
              No work posted right now. Check back — the yard rarely stays quiet.
            </p>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-2">
              {open.map((t) => (
                <WorkerTaskCard key={t.id} task={t} mine={false} pending={claim.isPending} onClaim={(task) => claim.mutate(task)} onSubmit={() => {}} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}