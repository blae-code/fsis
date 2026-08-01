import React from 'react';
import { base44 } from '@/api/base44Client';
import { adjustStanding } from '@/functions/adjustStanding';
import { ruleOnAppeal } from '@/functions/ruleOnAppeal';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Scale, Loader2 } from 'lucide-react';
import StandingAppealCard from '@/components/apps/management/access/StandingAppealCard';
import StandingAdjustForm from '@/components/apps/management/access/StandingAdjustForm';

/** The council's side of standing: appeals awaiting an answer, and standing set by hand. */
export default function StandingLedgerConsole({ members = [] }) {
  const qc = useQueryClient();

  const { data: appeals = [], isLoading } = useQuery({
    queryKey: ['standing_appeals'],
    queryFn: () => base44.entities.standing_event.filter({ appeal_status: 'filed' }, 'appeal_due_by', 50),
    refetchInterval: 60000,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['standing_appeals'] });
    qc.invalidateQueries({ queryKey: ['access_roster'] });
  };
  const rule = useMutation({ mutationFn: (p) => ruleOnAppeal(p), onSuccess: invalidate });
  const adjust = useMutation({ mutationFn: (p) => adjustStanding(p), onSuccess: invalidate });
  const error = rule.error || adjust.error;

  const overdue = appeals.filter((a) => a.appeal_due_by && new Date(a.appeal_due_by) < new Date()).length;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-[9px] tracking-[0.2em]" style={{ color: '#E0A22E' }}>
        <Scale className="w-3.5 h-3.5" /> STANDING LEDGER — APPEALS AWAITING AN ANSWER: {appeals.length}
        {overdue > 0 && <span style={{ color: '#D08A6A' }}>· {overdue} PAST THE DATE OWED</span>}
      </div>

      {error && (
        <p className="text-[9px]" style={{ color: '#D08A6A' }}>{error?.response?.data?.error || error.message}</p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin" style={{ color: '#E0A22E' }} /></div>
      ) : appeals.length === 0 ? (
        <p className="text-[9px] py-3 text-center border" style={{ color: '#6B6155', borderColor: '#2E2519' }}>
          No appeals filed. Nobody is waiting on the council.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 gap-2">
          {appeals.map((a) => (
            <StandingAppealCard key={a.id} event={a} pending={rule.isPending} onRule={(p) => rule.mutate(p)} />
          ))}
        </div>
      )}

      <StandingAdjustForm members={members} pending={adjust.isPending} onAdjust={(p) => adjust.mutate(p)} />
    </div>
  );
}