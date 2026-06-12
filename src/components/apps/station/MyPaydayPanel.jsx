import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, Timer, Loader2, Banknote, PiggyBank } from 'lucide-react';
import { getMyPayday } from '@/functions/getMyPayday';
import { submitPaydayElection } from '@/functions/submitPaydayElection';
import PaydayReportCard from '@/components/apps/fairshare/PaydayReportCard';

const border = { borderColor: 'hsl(33, 18%, 18%)' };
const panel = { ...border, background: 'hsl(30, 10%, 7%)' };

/** Contractor pay day panel: see your banked shares, decide CASH IN or DEFER
    during the 72-hour window, and review the latest published report. */
export default function MyPaydayPanel() {
  const queryClient = useQueryClient();
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['my_payday'],
    queryFn: async () => (await getMyPayday({})).data,
  });

  const electMutation = useMutation({
    mutationFn: (decision) => submitPaydayElection({ cycle_id: data.cycle.id, decision }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my_payday'] }),
  });

  if (isLoading) return null;

  if (!data?.linked) {
    return (
      <div className="p-3 rounded border font-mono mb-3" style={panel}>
        <div className="text-[10px] text-muted-foreground tracking-[0.2em] flex items-center gap-1.5">
          <Coins className="w-3 h-3" /> MY PAY DAY
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">
          Your callsign isn't on the crew roster yet. Ask management to add your callsign — it must match
          your FSIS operator callsign (Settings) — to cast your cash-in decision here.
        </p>
      </div>
    );
  }

  const { cycle, election, shares, last_report } = data;
  const shareValue = cycle && (cycle.total_shares || 0) > 0 ? (cycle.pool_auec || 0) / cycle.total_shares : 0;
  const est = Math.round((shares || 0) * shareValue);

  let countdown = '';
  if (cycle) {
    const ms = new Date(cycle.closes_at).getTime() - Date.now();
    countdown = ms > 0 ? `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m left to decide` : 'window closing…';
  }

  return (
    <div className="space-y-3 font-mono mb-3">
      <div className="p-3 rounded border space-y-2" style={panel}>
        <div className="flex items-center justify-between gap-2">
          <div className="text-[10px] text-muted-foreground tracking-[0.2em] flex items-center gap-1.5">
            <Coins className="w-3 h-3 text-primary" /> MY PAY DAY — {data.handle?.toUpperCase()}
          </div>
          {cycle && <Badge variant="outline" className="text-[9px] h-4 border-primary/40 text-primary flex items-center gap-1"><Timer className="w-2.5 h-2.5" /> {countdown}</Badge>}
        </div>

        <div className="text-xs text-foreground">
          Banked shares: <span className="text-primary">{shares}</span>
          {cycle && <> • Pool: <span className="text-primary">{(cycle.pool_auec || 0).toLocaleString()} aUEC</span> • Est. payout if cashed: <span className="text-primary">~{est.toLocaleString()} aUEC</span></>}
        </div>

        {!cycle ? (
          <p className="text-[9px] text-muted-foreground">
            No pay day window is open. Windows open every Friday morning for 72 hours — your shares stay banked at full value until you cash in.
          </p>
        ) : (
          <>
            {election && (
              <p className="text-[10px]" style={{ color: election.decision === 'cash_in' ? 'hsl(38, 72%, 52%)' : 'hsl(210, 45%, 60%)' }}>
                Your decision: {election.decision === 'cash_in' ? 'CASH IN' : 'DEFER (bank shares)'} — you can change it until the window closes.
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" className="h-8 text-[10px] gap-1"
                disabled={electMutation.isPending || shares <= 0}
                onClick={() => electMutation.mutate('cash_in')}>
                {electMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Banknote className="w-3 h-3" />}
                CASH IN MY SHARES
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-[10px] gap-1" style={border}
                disabled={electMutation.isPending}
                onClick={() => electMutation.mutate('defer')}>
                <PiggyBank className="w-3 h-3" /> DEFER — KEEP BANKED
              </Button>
            </div>
            {electMutation.isError && (
              <p className="text-[9px] text-destructive">{electMutation.error?.response?.data?.error || 'Could not record your decision.'}</p>
            )}
            <p className="text-[9px] text-muted-foreground">
              No response = your shares are automatically banked at full value, never forfeited. The final transparency report is published here when the window closes.
            </p>
          </>
        )}
      </div>

      {last_report && <PaydayReportCard cycleName={last_report.cycle_name} report={last_report.report} />}
    </div>
  );
}