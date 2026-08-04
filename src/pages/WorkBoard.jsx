import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { claimTask } from '@/functions/claimTask';
import { submitTaskProof } from '@/functions/submitTaskProof';
import { releaseTask } from '@/functions/releaseTask';
import { rsvpOperation } from '@/functions/rsvpOperation';
import { listMusters } from '@/functions/listMusters';
import { listOpenWork } from '@/functions/listOpenWork';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Hammer, Loader2, ArrowLeft } from 'lucide-react';
import DeckPanel from '@/components/console/deck/DeckPanel';
import DeckChevronRail from '@/components/console/deck/DeckChevronRail';
import WorkerSignalBoard from '@/components/work/board/WorkerSignalBoard';
import WorkerGauges from '@/components/work/board/WorkerGauges';
import BoardDesk from '@/components/work/board/BoardDesk';
import { boardModel } from '@/components/work/board/boardSignals';
import ContractorOnboarding from '@/components/work/onboarding/ContractorOnboarding';
import { workCache, setCacheScope } from '@/lib/localCache';

const DESKS = [
  { id: 'progress', label: 'YOUR PROGRESS', glyph: '◈',            blurb: 'How far in you are, what is outstanding, and where you stand.' },
  { id: 'mine',    label: 'IN YOUR HANDS', glyph: '◆', tone: 'hot', blurb: 'Work you took up — file your own account of it and collect the whole sum.' },
  { id: 'musters', label: 'MUSTERS',       glyph: '◉',              blurb: 'Runs called. Nobody is owed your time until you offer it.' },
  { id: 'open',    label: 'OPEN WORK',     glyph: '⚒',              blurb: 'Posted to the board, every task priced before you take it up.' },
  { id: 'record',  label: 'YOUR RECORD',   glyph: '▤',              blurb: 'Notices, standing, runs flown and work credited.' },
];

/** The labour board, on the same deck as the council consoles: work open to any comrade, and the tasks each holds in hand. */
export default function WorkBoard() {
  const qc = useQueryClient();
  const [desk, setDesk] = useState('mine');
  const [showIntro, setShowIntro] = useState(false);

  const { data: user, isLoading: loadingUser } = useQuery({ queryKey: ['user'], queryFn: () => base44.auth.me() });

  // Walk a comrade through the board once — scoped to their account, since standing is granted
  // to a person rather than to a browser.
  React.useEffect(() => {
    if (!user) return;
    setCacheScope(user.id);
    if (!workCache.hasOnboarded()) setShowIntro(true);
  }, [user]);
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
  const { counts, signals, gauges } = useMemo(
    () => boardModel({ mine, open, upcoming, userId: user?.id, earned }),
    [mine, open, upcoming, user, earned],
  );
  const error = claim.error || submit.error || rsvp.error || release.error;
  const active = DESKS.find((d) => d.id === desk) || DESKS[0];

  if (loadingUser || isLoading) {
    return (
      <div className="os-viewport flex items-center justify-center" style={{ background: '#080604' }}>
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: '#E0A22E' }} />
      </div>
    );
  }

  return (
    <div className="os-viewport flex flex-col min-h-0 font-mono" style={{ background: '#080604' }}>
      <AnimatePresence>
        {showIntro && (
          <ContractorOnboarding
            onComplete={() => { workCache.markOnboarded(); setShowIntro(false); }}
          />
        )}
      </AnimatePresence>

      <div className="shrink-0 px-3 py-2 flex items-center justify-between gap-2 border-b" style={{ borderColor: '#221B12' }}>
        <div className="flex items-center gap-2 text-[10px] font-bold tracking-[0.24em] xian-glow-subtle" style={{ color: '#E0A22E' }}>
          <Hammer className="w-4 h-4" /> THE LABOUR BOARD
        </div>
        <p className="hidden md:block flex-1 text-[8px] leading-relaxed truncate" style={{ color: '#5F564A' }}>
          Every task carries its price up front — take up only what you choose to, and collect the whole sum.
        </p>
        <Link
          to="/"
          className="h-7 px-2 border text-[8px] font-bold tracking-[0.16em] inline-flex items-center gap-1 shrink-0"
          style={{ borderColor: '#2E2519', color: '#8A7E6C', background: '#0C0A07' }}
        >
          <ArrowLeft className="w-3 h-3" /> STOREFRONT
        </Link>
      </div>

      <div className="flex-1 min-h-0 flex flex-col p-3 gap-3">
        <DeckChevronRail railId="labourboard" items={DESKS} active={desk} onSelect={setDesk} counts={counts} spine="YOUR DAY ON THE BOARD" />

        {error && (
          <p className="shrink-0 border p-2 text-[9px]" style={{ borderColor: '#5C302A', color: '#D08A6A', background: '#140B08' }}>
            {error?.response?.data?.error || error.message}
          </p>
        )}

        <div className="flex-1 min-h-0 grid gap-3 lg:grid-cols-[250px_minmax(0,1fr)_200px]">
          <div className="hidden lg:block min-h-0">
            <WorkerSignalBoard signals={signals} activeDesk={desk} onGo={setDesk} />
          </div>

          <div className="min-h-0">
            <DeckPanel glyph={active.glyph} title={active.label} meta={active.blurb} notch="both" bright>
              <AnimatePresence mode="wait">
                <motion.div
                  key={desk}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className="p-3"
                >
                  <BoardDesk
                    desk={desk}
                    mine={mine}
                    open={open}
                    upcoming={upcoming}
                    operations={operations}
                    user={user}
                    board={board}
                    claim={claim}
                    submit={submit}
                    release={release}
                    rsvp={rsvp}
                  />
                </motion.div>
              </AnimatePresence>
            </DeckPanel>
          </div>

          <div className="hidden lg:block min-h-0">
            <WorkerGauges g={gauges} />
          </div>
        </div>
      </div>
    </div>
  );
}