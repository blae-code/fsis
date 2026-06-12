import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { contractorPayday } from '@/functions/contractorPayday';
import { submitPaydayElection } from '@/functions/submitPaydayElection';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, Timer, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { CycleReport } from '@/components/apps/fairshare/PaydayCycles';

const border = { borderColor: 'hsl(33, 18%, 18%)' };
const panel = { ...border, background: 'hsl(30, 10%, 7%)' };

/** Contractor pay day station — see your shares, make your 72-hour election,
    and read the published transparency reports. */
export default function ContractorPaydayView() {
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['contractor_payday'],
    queryFn: async () => (await contractorPayday({})).data,
  });

  if (isLoading) {
    return <div className="p-3 text-[10px] font-mono text-muted-foreground">Loading pay day status…</div>;
  }

  const { linked, handle, my_shares, open_cycle, my_election, last_report } = data || {};

  const elect = async (decision) => {
    setSubmitting(true);
    try {
      await submitPaydayElection({ decision });
      queryClient.invalidateQueries({ queryKey: ['contractor_payday'] });
    } finally {
      setSubmitting(false);
    }
  };

  const shareValue = open_cycle?.share_value_auec || 0;
  const estPayout = Math.round((my_shares || 0) * shareValue);
  const windowClosed = open_cycle && new Date(open_cycle.closes_at) <= new Date();

  return (
    <div className="border rounded p-3 space-y-3 font-mono" style={panel}>
      <div className="text-[10px] text-muted-foreground tracking-[0.2em] flex items-center gap-1.5">
        <Coins className="w-3 h-3 text-primary" /> MY PAY DAY{handle ? ` — ${handle.toUpperCase()}` : ''}
      </div>

      {!linked ? (
        <p className="text-[10px] text-muted-foreground">
          Your account isn't linked to the crew roster yet. Ask management to add your login email to your roster record
          to receive pay day notifications and make elections.
        </p>
      ) : (
        <>
          {open_cycle ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs text-foreground flex items-center gap-1.5">
                  <Timer className="w-3 h-3 text-primary" /> Decision window open
                </span>
                <Badge variant="outline" className="text-[9px] h-4 border-primary/40 text-primary">
                  CLOSES {formatDistanceToNow(new Date(open_cycle.closes_at), { addSuffix: true }).toUpperCase()}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Your shares: <span className="text-primary">{my_shares}</span> • Share value:{' '}
                <span className="text-primary">{Math.round(shareValue).toLocaleString()} aUEC</span> • Est. payout:{' '}
                <span className="text-primary">{estPayout.toLocaleString()} aUEC</span>
              </p>

              {my_election ? (
                <p className="text-[10px] text-foreground">
                  Your election:{' '}
                  <Badge variant="outline" className={`text-[8px] h-4 ${my_election.decision === 'cash_in' ? 'border-primary/50 text-primary' : 'border-muted-foreground/40 text-muted-foreground'}`}>
                    {my_election.decision === 'cash_in' ? 'CASH IN' : 'DEFER'}
                  </Badge>{' '}
                  <span className="text-muted-foreground">— you can change it until the window closes.</span>
                </p>
              ) : (
                <p className="text-[10px] text-muted-foreground">No election yet — if you don't respond, your shares safely roll over (DEFER). Nothing is ever forfeited.</p>
              )}

              {!windowClosed && my_shares > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  <Button size="sm" className="h-8 text-[10px]" disabled={submitting || my_election?.decision === 'cash_in'} onClick={() => elect('cash_in')}>
                    {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : `CASH IN — ~${estPayout.toLocaleString()} aUEC`}
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 text-[10px]" style={border} disabled={submitting || my_election?.decision === 'defer'} onClick={() => elect('defer')}>
                    DEFER — ROLL OVER
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[10px] text-muted-foreground">
              No pay day window open. Your banked shares: <span className="text-primary">{my_shares}</span> — the next cycle opens Friday 09:00, and you'll be notified by email with 72 hours to decide.
            </p>
          )}
        </>
      )}

      {last_report && (
        <div className="space-y-1">
          <div className="text-[9px] text-muted-foreground tracking-[0.2em]">LATEST PUBLISHED REPORT — FULL TRANSPARENCY</div>
          <CycleReport cycle={last_report} />
        </div>
      )}
    </div>
  );
}