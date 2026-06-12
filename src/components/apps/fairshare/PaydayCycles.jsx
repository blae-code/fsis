import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { openPaydayCycle } from '@/functions/openPaydayCycle';
import { closePaydayCycle } from '@/functions/closePaydayCycle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CalendarCheck, Timer, FileCheck2, Loader2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

const border = { borderColor: 'hsl(33, 18%, 18%)' };
const panel = { ...border, background: 'hsl(30, 10%, 8%)' };

/** Management pay day console — cycle lifecycle, live elections, and the
    published transparency archive. Cycles open automatically every Friday;
    contractors get 72 hours to elect cash-in or defer. */
export default function PaydayCycles() {
  const queryClient = useQueryClient();
  const [pool, setPool] = useState('');
  const [working, setWorking] = useState(false);

  const { data: cycles = [] } = useQuery({
    queryKey: ['payday_cycles'],
    queryFn: () => base44.entities.payday_cycle.list('-created_date', 20),
  });
  const openCycle = cycles.find((c) => c.status === 'open');
  const publishedCycles = cycles.filter((c) => c.status === 'published');

  const { data: elections = [] } = useQuery({
    queryKey: ['payday_elections', openCycle?.id],
    queryFn: () => base44.entities.payday_election.filter({ cycle_id: openCycle.id }),
    enabled: !!openCycle,
  });
  const electionByHandle = Object.fromEntries(elections.map((e) => [e.handle, e]));

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['payday_cycles'] });
    queryClient.invalidateQueries({ queryKey: ['payday_elections'] });
    queryClient.invalidateQueries({ queryKey: ['time_logs'] });
    queryClient.invalidateQueries({ queryKey: ['ledger_entries'] });
  };

  const handleOpen = async () => {
    setWorking(true);
    try {
      await openPaydayCycle(pool ? { pool_auec: parseFloat(pool) } : {});
      setPool('');
      refresh();
    } finally {
      setWorking(false);
    }
  };

  const handleForceClose = async () => {
    if (!window.confirm('Close the decision window early and publish the final report now? Contractors lose remaining decision time — unanswered elections default to DEFER (shares roll over, never forfeited).')) return;
    setWorking(true);
    try {
      await closePaydayCycle({ force: true, cycle_id: openCycle.id });
      refresh();
    } finally {
      setWorking(false);
    }
  };

  const poolUpdate = useMutation({
    mutationFn: (newPool) =>
      base44.entities.payday_cycle.update(openCycle.id, {
        pool_auec: newPool,
        pool_source: 'Declared by management',
        share_value_auec: openCycle.total_shares > 0 ? Math.round((newPool / openCycle.total_shares) * 100) / 100 : 0,
      }),
    onSuccess: refresh,
  });

  return (
    <div className="p-4 space-y-4 font-mono">
      <div className="p-3 rounded border space-y-1" style={panel}>
        <div className="text-[10px] text-muted-foreground tracking-[0.2em] flex items-center gap-1.5">
          <CalendarCheck className="w-3 h-3" /> ETHICAL PAY DAY PROTOCOL
        </div>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Cycles open automatically every Friday 09:00. Contractors get <span className="text-primary">72 hours</span> to elect
          CASH IN or DEFER. No response = defer — shares roll over in full and are <span className="text-primary">never forfeited</span>.
          On close, a final report of all earnings and splits is published and emailed to every linked crew member.
        </p>
      </div>

      {openCycle ? (
        <div className="p-3 rounded border space-y-3" style={panel}>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="text-[10px] text-muted-foreground tracking-[0.2em] flex items-center gap-1.5">
              <Timer className="w-3 h-3 text-primary" /> CYCLE OPEN — {openCycle.cycle_name}
            </div>
            <Badge variant="outline" className="text-[9px] h-4 border-primary/40 text-primary">
              CLOSES {formatDistanceToNow(new Date(openCycle.closes_at), { addSuffix: true }).toUpperCase()}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="POOL" value={`${(openCycle.pool_auec || 0).toLocaleString()} aUEC`} />
            <Stat label="TOTAL SHARES" value={openCycle.total_shares} />
            <Stat label="SHARE VALUE" value={`${Math.round(openCycle.share_value_auec || 0).toLocaleString()} aUEC`} />
          </div>
          <p className="text-[9px] text-muted-foreground">Pool source: {openCycle.pool_source}</p>

          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Input type="number" min="0" placeholder="Adjust pool (aUEC) — notifies via final report" value={pool} onChange={(e) => setPool(e.target.value)} className="h-8 text-xs" style={border} />
            <Button variant="outline" size="sm" className="h-8 text-[10px]" style={border} disabled={!pool || poolUpdate.isPending}
              onClick={() => { poolUpdate.mutate(parseFloat(pool)); setPool(''); }}>
              UPDATE POOL
            </Button>
          </div>

          {/* Live elections */}
          <div className="space-y-1">
            <div className="text-[9px] text-muted-foreground tracking-[0.2em]">ELECTIONS ({elections.length}/{(openCycle.shares_by_handle || []).length})</div>
            {(openCycle.shares_by_handle || []).map((s) => {
              const e = electionByHandle[s.handle];
              return (
                <div key={s.handle} className="flex justify-between items-center text-[10px]">
                  <span className="text-foreground">{s.handle} <span className="text-muted-foreground">— {s.shares} sh</span></span>
                  {e ? (
                    <Badge variant="outline" className={`text-[8px] h-4 ${e.decision === 'cash_in' ? 'border-primary/50 text-primary' : 'border-muted-foreground/40 text-muted-foreground'}`}>
                      {e.decision === 'cash_in' ? 'CASH IN' : 'DEFER'}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-[8px]">AWAITING (defaults to defer)</span>
                  )}
                </div>
              );
            })}
          </div>

          <Button variant="outline" size="sm" className="h-8 text-[10px] w-full" style={border} disabled={working} onClick={handleForceClose}>
            {working ? <Loader2 className="w-3 h-3 animate-spin" /> : 'CLOSE EARLY & PUBLISH FINAL REPORT'}
          </Button>
        </div>
      ) : (
        <div className="p-3 rounded border space-y-2" style={panel}>
          <div className="text-[10px] text-muted-foreground tracking-[0.2em]">NO CYCLE OPEN — NEXT AUTO-OPEN: FRIDAY 09:00</div>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <Input type="number" min="0" placeholder="Pool aUEC (blank = auto from 7-day ledger net)" value={pool} onChange={(e) => setPool(e.target.value)} className="h-8 text-xs" style={border} />
            <Button size="sm" className="h-8 text-[10px]" disabled={working} onClick={handleOpen}>
              {working ? <Loader2 className="w-3 h-3 animate-spin" /> : 'OPEN CYCLE NOW'}
            </Button>
          </div>
          <p className="text-[9px] text-muted-foreground">Opening notifies every linked crew member by email and starts their 72-hour decision window.</p>
        </div>
      )}

      {/* Published transparency archive */}
      <div className="space-y-1.5">
        <div className="text-[10px] text-muted-foreground tracking-[0.2em] flex items-center gap-1.5">
          <FileCheck2 className="w-3 h-3" /> PUBLISHED REPORTS ({publishedCycles.length})
        </div>
        {publishedCycles.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">No pay day reports published yet.</p>
        ) : publishedCycles.map((c) => <CycleReport key={c.id} cycle={c} />)}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="border rounded px-2 py-1.5" style={{ borderColor: 'hsl(33, 18%, 18%)' }}>
      <div className="text-[8px] text-muted-foreground tracking-[0.15em]">{label}</div>
      <div className="text-xs text-primary">{value}</div>
    </div>
  );
}

export function CycleReport({ cycle }) {
  return (
    <div className="p-2.5 rounded border space-y-1.5" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 8%)' }}>
      <div className="flex justify-between items-center flex-wrap gap-1">
        <span className="text-xs text-foreground">{cycle.cycle_name}{cycle.force_closed ? ' • closed early by management' : ''}</span>
        <span className="text-[9px] text-muted-foreground">
          {cycle.published_at ? format(new Date(cycle.published_at), 'MMM d, HH:mm') : ''} • pool {(cycle.pool_auec || 0).toLocaleString()} aUEC • {Math.round(cycle.share_value_auec || 0).toLocaleString()}/share
        </span>
      </div>
      {(cycle.report || []).map((r) => (
        <div key={r.handle} className="flex justify-between text-[10px]">
          <span className="text-foreground">{r.handle} <span className="text-muted-foreground">— {r.shares} sh</span></span>
          <span className={r.decision === 'cash_in' ? 'text-primary' : 'text-muted-foreground'}>
            {r.decision === 'cash_in' ? `CASHED → ${(r.payout_auec || 0).toLocaleString()} aUEC` : 'DEFERRED — rolls over'}
          </span>
        </div>
      ))}
      <div className="text-[9px] text-muted-foreground border-t pt-1" style={{ borderColor: 'hsl(33, 18%, 18%)' }}>
        Paid: {(cycle.total_paid_auec || 0).toLocaleString()} aUEC • Deferred: {cycle.deferred_shares || 0} shares • Unclaimed pool retained in treasury
      </div>
    </div>
  );
}