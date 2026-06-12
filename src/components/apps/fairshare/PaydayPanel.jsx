import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CalendarCheck, Coins } from 'lucide-react';

const border = { borderColor: 'hsl(33, 18%, 18%)' };
const panel = { ...border, background: 'hsl(30, 10%, 8%)' };

function nextFriday() {
  const d = new Date();
  d.setDate(d.getDate() + ((5 - d.getDay() + 7) % 7 || 7));
  return d;
}

/** Friday pay day: cash outstanding shares against a declared pool. Proprietor draws are
    logged as crew_pay so personal income never mixes silently with business funds. */
export default function PaydayPanel() {
  const queryClient = useQueryClient();
  const [pool, setPool] = useState('');

  const { data: logs = [] } = useQuery({
    queryKey: ['time_logs'],
    queryFn: () => base44.entities.time_log.list('-created_date', 200),
  });

  const outstanding = logs.filter((l) => l.status !== 'cashed');
  const byHandle = {};
  outstanding.forEach((l) => {
    byHandle[l.handle] = (byHandle[l.handle] || 0) + (l.shares || 0);
  });
  const totalShares = Object.values(byHandle).reduce((t, s) => t + s, 0);
  const poolNum = parseFloat(pool) || 0;
  const shareValue = totalShares > 0 && poolNum > 0 ? poolNum / totalShares : 0;

  const today = new Date();
  const isFriday = today.getDay() === 5;
  const payday = isFriday ? today : nextFriday();
  const paydayStr = payday.toISOString().slice(0, 10);

  const settleMutation = useMutation({
    mutationFn: async () => {
      // One crew_pay ledger expense per contractor — owner draws explicitly labelled
      for (const [handle, shares] of Object.entries(byHandle)) {
        const amount = Math.round(shares * shareValue);
        if (amount <= 0) continue;
        const isOwner = handle.toLowerCase() === 'blae';
        await base44.entities.ledger_entry.create({
          entry_type: 'expense',
          category: 'crew_pay',
          amount_auec: amount,
          counterparty: isOwner ? `${handle} (owner draw — personal)` : handle,
          description: `Pay day ${paydayStr} — ${Math.round(shares * 100) / 100} shares @ ${Math.round(shareValue).toLocaleString()} aUEC/share`,
          entry_date: paydayStr,
        });
      }
      // Mark every outstanding log as cashed at this share value
      for (const l of outstanding) {
        await base44.entities.time_log.update(l.id, {
          status: 'cashed',
          payday_date: paydayStr,
          payout_auec: Math.round((l.shares || 0) * shareValue),
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time_logs'] });
      queryClient.invalidateQueries({ queryKey: ['ledger_entries'] });
      setPool('');
    },
  });

  return (
    <div className="p-4 space-y-4 font-mono">
      <div className="p-3 rounded border space-y-1" style={panel}>
        <div className="text-[10px] text-muted-foreground tracking-[0.2em] flex items-center gap-1.5">
          <CalendarCheck className="w-3 h-3" /> PAY DAY — EVERY FRIDAY
        </div>
        <p className="text-xs text-foreground">
          {isFriday ? 'Today is pay day.' : `Next pay day: ${payday.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}`}
          {' '}• {Math.round(totalShares * 100) / 100} shares outstanding across {Object.keys(byHandle).length} crew
        </p>
      </div>

      {totalShares === 0 ? (
        <p className="text-xs text-muted-foreground py-6 text-center">No outstanding shares — log confirmed time first.</p>
      ) : (
        <div className="p-3 rounded border space-y-3" style={panel}>
          <div className="text-[10px] text-muted-foreground tracking-[0.2em] flex items-center gap-1.5">
            <Coins className="w-3 h-3" /> DECLARE DISTRIBUTABLE POOL
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
            <Input type="number" min="0" placeholder="Pool in aUEC (this week's distributable net)" value={pool} onChange={(e) => setPool(e.target.value)} className="h-8 text-xs" style={border} />
            <div className="text-xs text-primary">
              {shareValue > 0 ? `= ${Math.round(shareValue).toLocaleString()} aUEC / share` : '—'}
            </div>
          </div>

          {/* Published breakdown — everyone sees the same math before cash-in */}
          <div className="space-y-1">
            {Object.entries(byHandle).map(([h, sh]) => (
              <div key={h} className="flex justify-between text-[10px]">
                <span className="text-foreground">{h}{h.toLowerCase() === 'blae' ? ' (owner draw — personal)' : ''}</span>
                <span className="text-muted-foreground">
                  {Math.round(sh * 100) / 100} sh → <span className="text-primary">{shareValue > 0 ? Math.round(sh * shareValue).toLocaleString() : '—'} aUEC</span>
                </span>
              </div>
            ))}
          </div>

          <Button size="sm" className="h-8 text-[10px] w-full" disabled={shareValue <= 0 || settleMutation.isPending}
            onClick={() => settleMutation.mutate()}>
            {settleMutation.isPending ? 'SETTLING…' : `CASH IN ALL SHARES — PAY DAY ${paydayStr}`}
          </Button>
          <p className="text-[9px] text-muted-foreground">
            Settlement writes one crew_pay ledger expense per crew member. The Proprietor's payout is labelled an owner draw —
            once paid, those credits are personal; everything left in the wallet is business funds.
          </p>
        </div>
      )}
    </div>
  );
}