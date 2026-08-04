import React from 'react';
import WorkerTaskCard from '@/components/work/WorkerTaskCard';
import OpenWorkCard from '@/components/work/OpenWorkCard';
import OperationRsvpCard from '@/components/work/OperationRsvpCard';
import OperationCalendar from '@/components/work/OperationCalendar';
import BoardEmpty from '@/components/work/BoardEmpty';
import NoticeCentre from '@/components/work/NoticeCentre';
import StandingPanel from '@/components/work/StandingPanel';
import MyRunsPanel from '@/components/work/MyRunsPanel';
import WorkHistoryPanel from '@/components/work/WorkHistoryPanel';
import ContractorProgressDesk from '@/components/work/progress/ContractorProgressDesk';

const GRID = 'grid md:grid-cols-2 xl:grid-cols-3 gap-2';

/** Only the desk in hand is mounted, so the board opens straight onto the work. */
export default function BoardDesk({ desk, mine, open, upcoming, operations, user, board, claim, submit, release, rsvp }) {
  if (desk === 'mine') {
    return mine.length === 0 ? (
      <BoardEmpty>You hold no tasks. Take one up from OPEN WORK.</BoardEmpty>
    ) : (
      <div className={GRID}>
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
    );
  }

  if (desk === 'progress') {
    return <ContractorProgressDesk user={user} mine={mine} upcoming={upcoming} />;
  }

  if (desk === 'musters') {
    return (
      <div className="space-y-3">
        <OperationCalendar operations={operations} />
        {upcoming.length === 0 ? (
          <BoardEmpty>No musters called. Nobody is owed your time until you offer it.</BoardEmpty>
        ) : (
          <div className={GRID}>
            {upcoming.map((op) => (
              <OperationRsvpCard key={op.id} op={op} userId={user?.id} pending={rsvp.isPending} onRsvp={(p) => rsvp.mutate(p)} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (desk === 'open') {
    return (
      <div className="space-y-3">
        {board?.note && <p className="text-[9px] leading-relaxed" style={{ color: '#8A7E6C' }}>{board.note}</p>}
        {open.length === 0 ? (
          <BoardEmpty>No work posted right now. Check back — the yard rarely stays quiet.</BoardEmpty>
        ) : (
          <div className={GRID}>
            {open.map((t) => (
              <OpenWorkCard key={t.id} task={t} pending={claim.isPending} onClaim={(task) => claim.mutate(task)} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <NoticeCentre />
      <StandingPanel user={user} />
      <MyRunsPanel userId={user?.id} />
      <WorkHistoryPanel tasks={mine} operations={operations} userId={user?.id} />
    </div>
  );
}