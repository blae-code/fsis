import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Gavel } from 'lucide-react';
import StandingRequestQueue from '@/components/apps/management/access/StandingRequestQueue';
import TaskReviewQueue from '@/components/apps/management/tasks/TaskReviewQueue';
import HallDisputePanel from '@/components/apps/management/hall/HallDisputePanel';
import ReviewQueueRail from '@/components/apps/management/review/ReviewQueueRail';

/**
 * Everything waiting on the council, in one place. Work filed and unanswered, comrades
 * asking to join, and disputes still open — each of them is somebody waiting on us.
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

  const counts = { work: submitted.length, standing: requests.length, disputes: disputes.length };
  const total = counts.work + counts.standing + counts.disputes;

  return (
    <div className="p-4 space-y-3 font-mono">
      <div className="flex items-center gap-2 text-[9px] tracking-[0.22em]" style={{ color: '#E0A22E' }}>
        <Gavel className="w-3.5 h-3.5" />
        COUNCIL REVIEW QUEUE — {total} AWAITING AN ANSWER
      </div>
      <p className="text-[9px] leading-relaxed max-w-3xl" style={{ color: '#8A7E6C' }}>
        Every item here is a comrade waiting on us. Work filed and not yet credited, labour offered and
        not yet answered, a dispute still open. Silence is not a decision — answer, and say why.
      </p>

      <ReviewQueueRail section={section} onSection={setSection} counts={counts} />

      {section === 'work' && <TaskReviewQueue tasks={submitted} />}
      {section === 'standing' && <StandingRequestQueue />}
      {section === 'disputes' && <HallDisputePanel />}
    </div>
  );
}