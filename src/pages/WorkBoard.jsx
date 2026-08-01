import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { claimTask } from '@/functions/claimTask';
import { submitTaskProof } from '@/functions/submitTaskProof';
import { releaseTask } from '@/functions/releaseTask';
import { rsvpOperation } from '@/functions/rsvpOperation';
import { listMusters } from '@/functions/listMusters';
import { listOpenWork } from '@/functions/listOpenWork';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Hammer, Loader2, ArrowLeft } from 'lucide-react';
import WorkerTaskCard from '@/components/work/WorkerTaskCard';
import OperationRsvpCard from '@/components/work/OperationRsvpCard';
import WorkHistoryPanel from '@/components/work/WorkHistoryPanel';
import StandingPanel from '@/components/work/StandingPanel';
import NoticeCentre from '@/components/work/NoticeCentre';
import OpenWorkCard from '@/components/work/OpenWorkCard';
import BoardSection from '@/components/work/BoardSection';
import BoardEmpty from '@/components/work/BoardEmpty';
import OperationCalendar from '@/components/work/OperationCalendar';
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

  const { data: board } = useQuery({
    queryKey: ['open_work'],
    queryFn: () => listOpenWork({}).then((r) => r.data),
    refetchInterval: 30000,
  });

  const { data: operations = [] } = useQuery({
    queryKey: ['work_board_operations'],
    queryFn: () => listMusters({}).then((r) => r.data.operations || []),
    refetchInterval: 30000,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['work_board_tasks'] });
    qc.invalidateQueries({ queryKey: ['labour_tasks'] });
    qc.invalidateQueries({ queryKey: ['open_work'] });
    qc.invalidateQueries({ queryKey: ['my_notices'] });
  };
  const claim = useMutation({ mutationFn: (task) => claimTask({ task_id: task.id }), onSuccess: invalidate });
  const release = useMutation({
    mutationFn: (payload) => releaseTask(payload),
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: ['user'] });
      qc.invalidateQueries({ queryKey: ['my_standing_events'] });
    },
  });
  const submit = useMutation({ mutationFn: (payload) => submitTaskProof(payload), onSuccess: invalidate });
  const rsvp = useMutation({
    mutationFn: (payload) => rsvpOperation(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['work_board_operations'] }),
  });

  // Every hand on a crew holds the work, not only the lead who took it up first.
  const mine = useMemo(
    () => tasks.filter((t) => user && (t.assigned_user_id === user.id || (t.crew_user_ids || []).includes(user.id))),
    [tasks, user],
  );
  const open = board?.tasks || [];
  const earned = useMemo(
    () => mine.filter((t) => t.status === 'credited').reduce((s, t) => s + (Number(t.credited_auec) || 0), 0),
    [mine],
  );
  const upcoming = useMemo(
    () => operations.filter((o) => ['scheduled', 'mustering', 'underway'].includes(o.status)),
    [operations],
  );
  const error = claim.error || submit.error || rsvp.error || release.error;

  if (loadingUser || isLoading) {
    return (
      <div className="os-viewport flex items-center justify-center" style={{ background: '#080604' }}>
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#E0A22E' }} />
      </div>
    );
  }

  return (
    <div className="os-viewport overflow-auto font-mono" style={{ background: '#080604' }}>
      <div className="max-w-6xl mx-auto p-4 space-y-5">
        <div
          className="sticky top-0 z-20 -mx-4 px-4 py-2.5 flex items-center justify-between gap-2 border-b backdrop-blur"
          style={{ borderColor: '#221B12', background: 'rgba(8,6,4,0.92)' }}
        >
          <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.24em] xian-glow-subtle" style={{ color: '#E0A22E' }}>
            <Hammer className="w-4 h-4" /> THE LABOUR BOARD
          </div>
          <Link
            to="/"
            className="h-7 px-2 border text-[8px] font-bold tracking-[0.16em] inline-flex items-center gap-1"
            style={{ borderColor: '#2E2519', color: '#8A7E6C', background: '#0C0A07' }}
          >
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

        <NoticeCentre />

        <StandingPanel user={user} />

        <BoardSection
          eyebrow="WORK IN YOUR HANDS"
          accent="#6FA0C8"
          count={mine.length}
          note={`${fmtAuec(earned)} credited to you so far.`}
        >
          {mine.length === 0 ? (
            <BoardEmpty>You hold no tasks. Take one up from the board below.</BoardEmpty>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-2">
              {mine.map((t) => (
                <WorkerTaskCard
                  key={t.id}
                  task={t}
                  mine
                  actor={user}
                  pending={submit.isPending || release.isPending}
                  onSubmit={(p) => submit.mutate(p)}
                  onRelease={(p) => release.mutate(p)}
                  onClaim={() => {}}
                />
              ))}
            </div>
          )}
        </BoardSection>

        <BoardSection eyebrow="MUSTERS CALLED" accent="#C8A05B" count={upcoming.length}>
          <OperationCalendar operations={operations} />
          {upcoming.length === 0 ? (
            <BoardEmpty>No musters called. Nobody is owed your time until you offer it.</BoardEmpty>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-2">
              {upcoming.map((op) => (
                <OperationRsvpCard key={op.id} op={op} userId={user?.id} pending={rsvp.isPending} onRsvp={(p) => rsvp.mutate(p)} />
              ))}
            </div>
          )}
        </BoardSection>

        <WorkHistoryPanel tasks={mine} operations={operations} userId={user?.id} />

        <BoardSection eyebrow="OPEN ON THE BOARD" accent="#E0A22E" count={open.length} note={board?.note}>
          {open.length === 0 ? (
            <BoardEmpty>No work posted right now. Check back — the yard rarely stays quiet.</BoardEmpty>
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-2">
              {open.map((t) => (
                <OpenWorkCard key={t.id} task={t} pending={claim.isPending} onClaim={(task) => claim.mutate(task)} />
              ))}
            </div>
          )}
        </BoardSection>
      </div>
    </div>
  );
}