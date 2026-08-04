import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import StandingRequestQueue from '@/components/apps/management/access/StandingRequestQueue';
import TaskReviewQueue from '@/components/apps/management/tasks/TaskReviewQueue';
import HallDisputePanel from '@/components/apps/management/hall/HallDisputePanel';
import ReviewQueueRail, { REVIEW_SECTIONS } from '@/components/apps/management/review/ReviewQueueRail';
import DocketBoard from '@/components/apps/management/review/DocketBoard';
import BenchGauges from '@/components/apps/management/review/BenchGauges';
import DeckPanel from '@/components/console/deck/DeckPanel';
import { buildDocket, benchModel } from '@/components/apps/management/review/reviewSignals';

/**
 * The bench. One screen, no page scroll: what the council owes along the top, the docket of
 * who is waiting down the left, how the bench is keeping up down the right, and the hearing
 * itself in the middle. Every item here is a comrade waiting on us.
 */
export default function CouncilReviewQueue() {
  const [section, setSection] = useState('work');

  const { data: requests = [] } = useQuery({
    queryKey: ['standing_requests'],
    queryFn: () => base44.entities.standing_request.filter({ status: 'pending' }, '-created_date', 50),
    refetchInterval: 60000,
  });
  const { data: submitted = [] } = useQuery({
    queryKey: ['review_queue_submitted'],
    queryFn: () => base44.entities.labour_task.filter({ status: 'submitted' }, '-submitted_at', 100),
    refetchInterval: 60000,
  });
  const { data: disputes = [] } = useQuery({
    queryKey: ['review_queue_disputes'],
    queryFn: () => base44.entities.hall_dispute.filter({ status: 'open' }, '-created_date', 100),
    refetchInterval: 60000,
  });
  const { data: answered = [] } = useQuery({
    queryKey: ['review_queue_answered'],
    queryFn: () => base44.entities.labour_task.filter({ status: 'credited' }, '-reviewed_at', 100),
    refetchInterval: 120000,
  });

  const counts = { work: submitted.length, standing: requests.length, disputes: disputes.length };
  const docket = useMemo(() => buildDocket({ submitted, requests, disputes }), [submitted, requests, disputes]);
  const bench = useMemo(() => benchModel({ submitted, requests, disputes, answered }), [submitted, requests, disputes, answered]);
  const active = REVIEW_SECTIONS.find((s) => s.id === section);

  return (
    <div className="relative h-full flex flex-col min-h-0 font-mono" style={{ background: '#080604' }}>
      <div className="flex flex-col min-h-0 h-full p-3 gap-3">
        <ReviewQueueRail section={section} onSection={setSection} counts={counts} />

        <div className="flex-1 min-h-0 grid gap-3 lg:grid-cols-[260px_minmax(0,1fr)_210px]">
          <div className="hidden lg:block min-h-0">
            <DocketBoard docket={docket} onGo={setSection} activeStage={section} />
          </div>

          <div className="min-h-0">
            <DeckPanel
              glyph={active?.glyph}
              title={active?.label}
              meta={`${counts[section] || 0} WAITING`}
              notch="both"
              bright
            >
              <div className="p-3">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={section}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.16 }}
                  >
                    {section === 'work' && <TaskReviewQueue tasks={submitted} />}
                    {section === 'standing' && <StandingRequestQueue />}
                    {section === 'disputes' && <HallDisputePanel />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </DeckPanel>
          </div>

          <div className="hidden lg:block min-h-0">
            <BenchGauges b={bench} />
          </div>
        </div>
      </div>
    </div>
  );
}