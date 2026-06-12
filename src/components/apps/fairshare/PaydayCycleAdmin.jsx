import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CalendarCheck, Timer, Coins, Loader2 } from 'lucide-react';
import { openPaydayCycle } from '@/functions/openPaydayCycle';
import { closePaydayCycle } from '@/functions/closePaydayCycle';
import PaydayReportCard from '@/components/apps/fairshare/PaydayReportCard';

const border = { borderColor: 'hsl(33, 18%, 18%)' };
const panel = { ...border, background: 'hsl(30, 10%, 8%)' };

function useCountdown(closesAt) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);
  if (!closesAt) return '';
  const ms = new Date(closesAt).getTime() - Date.now();
  if (ms <= 0) return 'WINDOW EXPIRED — closing on next check';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m remaining`;
}

/** Management pay day console: open the 72h window, adjust the pool,
    monitor elections, and publish the final report. */
export default function PaydayCycleAdmin() {
  const queryClient = useQueryClient();
  const [poolEdit, setPoolEdit] = useState(null);

  const { data: cycles = [] } = useQuery({
    queryKey: ['payday_cycles'],
    queryFn: () => base44.entities.payday_cycle.list('-created_date', 20),
  });
  const open = cycles.find((c) => c.status === 'open');
  const published = cycles.filter((c) => c.status === 'published');

  const { data: elections = [] } = useQuery({
    queryKey: ['payday_elections', open?.id],
    queryFn: () => base44.entities.payday_election.filter({ cycle_id: open.id }),
    enabled: !!open,
  });

  const { data: logs = [] } = useQuery({
    queryKey: ['time_logs'],
    queryFn: () => base44.entities.time_log.list('-created_date', 200),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['payday_cycles'] });
    queryClient.invalidateQueries({ queryKey: ['payday_elections'] });
    queryClient.invalidateQueries({ queryKey: ['time_logs'] });
    queryClient.invalidateQueries({ queryKey: ['ledger_entries'] });
  };

  const openMutation = useMutation({
    mutationFn: () => openPaydayCycle({}),
    onSuccess: invalidate,
  });
  const closeMutation = useMutation({
    mutationFn: () => closePaydayCycle({ cycle_id: open.id, force: true }),
    onSuccess: invalidate,
  });
  const poolMutation = useMutation({
    mutationFn: (pool) => base44.entities.payday_cycle.update(open.id, { pool_auec: pool }),
    onSuccess: () => { setPoolEdit(null); invalidate(); },
  });

  const countdown = useCountdown(open?.closes_at);

  // Outstanding shares by handle (live)
  const byHandle = {};
  logs.filter((l) => l.status !== 'cashed').forEach((l) => {
    byHandle[l.handle] = (byHandle[l.handle] || 0) + (l.shares || 0);
  });
  const totalShares = Object.values(byHandle).reduce((t, s) => t + s, 0);
  const shareValue = open && totalShares > 0 ? (open.pool_auec || 0) / totalShares : 0;
  const electionByHandle = Object.fromEntries(elections.map((e) => [e.handle, e]));

  return (
    <div className="p-4 space-y-4 font-mono">
      {!open ? (
        <div className="p-3 rounded border space-y-2" style={panel}>
          <div className="text-[10px] text-muted-foreground tracking-[0.2em] flex items-center gap-1.5">
            <CalendarCheck className="w-3 h-3" /> PAY DAY — AUTOMATED EVERY FRIDAY
          </div>
          <p className="text-xs text-foreground">
            No window is open. The system opens a 72-hour decision window automatically every Friday morning
            and notifies all linked crew by email.
          </p>
          <Button size="sm" className="h-8 text-[10px]" disabled={openMutation.isPending || totalShares <= 0} onClick={() => openMutation.mutate()}>
            {openMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
            OPEN PAY DAY WINDOW NOW
          </Button>
          {totalShares <= 0 && <p className="text-[9px] text-muted-foreground">No outstanding shares — log confirmed time first.</p>}
          {openMutation.data?.data?.skipped && <p className="text-[9px] text-destructive">{openMutation.data.data.reason}</p>}
        </div>
      ) : (
        <div className="p-3 rounded border space-y-3" style={panel}>
          <div className="flex items-center justify-between gap-2">
            <div className="text-[10px] text-muted-foreground tracking-[0.2em] flex items-center gap-1.5">
              <Timer className="w-3 h-3 text-primary" /> {open.cycle_name?.toUpperCase()} — WINDOW OPEN
            </div>
            <Badge variant="outline" className="text-[9px] h-4 border-primary/40 text-primary">{countdown}</Badge>
          </div>

          {/* Pool — adjustable while window is open */}
          <div className="grid grid-cols-[auto_1fr_auto] gap-2 items-center">
            <span className="text-[9px] text-muted-foreground flex items-center gap-1"><Coins className="w-3 h-3" /> POOL</span>
            <Input
              type="number" min="0"
              value={poolEdit ?? String(open.pool_auec || 0)}
              onChange={(e) => setPoolEdit(e.target.value)}
              className="h-8 text-xs" style={border}
            />
            {poolEdit !== null && parseFloat(poolEdit) !== open.pool_auec && (
              <Button size="sm" className="h-8 text-[10px]" disabled={poolMutation.isPending}
                onClick={() => poolMutation.mutate(parseFloat(poolEdit) || 0)}>
                UPDATE POOL
              </Button>
            )}
          </div>
          <p className="text-[9px] text-muted-foreground">
            {Math.round(totalShares * 100) / 100} shares outstanding → <span className="text-primary">{Math.round(shareValue).toLocaleString()} aUEC/share</span>.
            Share value is computed over ALL outstanding shares, so deferring never changes anyone else's payout.
          </p>

          {/* Elections board */}
          <div className="space-y-1 border-t pt-2" style={border}>
            <div className="text-[9px] text-muted-foreground tracking-[0.15em]">ELECTIONS ({elections.length} / {Object.keys(byHandle).length} responded)</div>
            {Object.entries(byHandle).map(([h, sh]) => {
              const el = electionByHandle[h];
              return (
                <div key={h} className="flex justify-between items-center text-[10px]">
                  <span className="text-foreground">{h}</span>
                  <span className="flex items-center gap-2">
                    <span className="text-muted-foreground">{Math.round(sh * 100) / 100} sh → {Math.round(sh * shareValue).toLocaleString()} aUEC</span>
                    {el ? (
                      <Badge variant="outline" className={`text-[8px] h-4 ${el.decision === 'cash_in' ? 'border-primary/40 text-primary' : 'border-muted text-muted-foreground'}`}>
                        {el.decision === 'cash_in' ? 'CASH IN' : 'DEFER'}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[8px] h-4 border-muted text-muted-foreground">AWAITING</Badge>
                    )}
                  </span>
                </div>
              );
            })}
          </div>

          <Button size="sm" variant="outline" className="h-8 text-[10px] w-full" style={border}
            disabled={closeMutation.isPending} onClick={() => closeMutation.mutate()}>
            {closeMutation.isPending ? 'PUBLISHING…' : 'CLOSE WINDOW & PUBLISH FINAL REPORT NOW'}
          </Button>
          <p className="text-[9px] text-muted-foreground">
            At close: cash-in elections are paid (one crew_pay ledger entry each), non-responders' and deferrers'
            shares are banked at full value — never forfeited. The final report is published and emailed to all crew.
          </p>
        </div>
      )}

      {/* Published reports */}
      {published.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] text-muted-foreground tracking-[0.2em]">PUBLISHED REPORTS</div>
          {published.map((c) => <PaydayReportCard key={c.id} cycleName={c.cycle_name} report={c.report} />)}
        </div>
      )}
    </div>
  );
}