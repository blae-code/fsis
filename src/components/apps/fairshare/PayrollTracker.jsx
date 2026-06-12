import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { computePayout } from '@/components/apps/fairshare/payout';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

const border = { borderColor: 'hsl(33, 18%, 18%)' };
const panel = { ...border, background: 'hsl(30, 10%, 7%)' };

// Per-contractor payroll rollup: fair-share owed from ACTIVE (open) work orders,
// plus payments categorized by source — work-order settlements vs Friday pay-day share cash-ins.
export default function PayrollTracker() {
  const { data: crew = [] } = useQuery({
    queryKey: ['crew_members'],
    queryFn: () => base44.entities.crew_member.list('-created_date'),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['work_orders'],
    queryFn: () => base44.entities.work_order.list('-created_date', 50),
  });

  const { data: payEntries = [] } = useQuery({
    queryKey: ['ledger_crew_pay'],
    queryFn: () => base44.entities.ledger_entry.filter({ category: 'crew_pay' }, '-created_date', 200),
  });

  // Build per-handle rollup
  const rollup = {};
  const ensure = (handle) => {
    if (!rollup[handle]) rollup[handle] = { owed: 0, openOrders: 0, paydayPaid: 0, workOrderPaid: 0 };
    return rollup[handle];
  };
  crew.forEach((m) => ensure(m.handle));

  // Owed fair-share from active (open) work orders
  orders.filter((o) => o.status !== 'settled').forEach((o) => {
    computePayout(o).rows.forEach((r) => {
      const row = ensure(r.handle);
      row.owed += r.payout;
      row.openOrders += 1;
    });
  });

  // Categorize ledgered crew_pay: "Pay day ..." descriptions are share cash-ins; the rest are work-order settlements
  payEntries.forEach((e) => {
    const handle = Object.keys(rollup).find((h) => e.counterparty === h || e.counterparty?.startsWith(`${h} (`));
    if (!handle) return;
    if ((e.description || '').startsWith('Pay day')) rollup[handle].paydayPaid += e.amount_auec || 0;
    else rollup[handle].workOrderPaid += e.amount_auec || 0;
  });

  const totalOwed = Object.values(rollup).reduce((t, r) => t + r.owed, 0);
  const byType = (h) => crew.find((m) => m.handle === h)?.employment_type;

  return (
    <div className="border" style={panel}>
      <div className="flex items-center justify-between px-3 py-2 border-b" style={border}>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono tracking-[0.2em] text-muted-foreground">
          <Users className="w-3 h-3" /> CONTRACTOR PAYROLL TRACKER
        </span>
        <span className="text-[10px] font-mono text-muted-foreground">
          OWED FROM ACTIVE ORDERS: <span className="text-primary font-bold">{totalOwed.toLocaleString()} aUEC</span>
        </span>
      </div>

      <div className="grid grid-cols-[1fr_110px_110px_110px_110px] gap-2 px-3 py-1.5 text-[9px] font-mono tracking-[0.15em] text-muted-foreground border-b" style={border}>
        <span>CREW</span>
        <span className="text-right">OWED (ACTIVE)</span>
        <span className="text-right">WO SETTLED</span>
        <span className="text-right">PAY DAY</span>
        <span className="text-right">TOTAL PAID</span>
      </div>

      {Object.keys(rollup).length === 0 ? (
        <p className="text-center py-6 text-xs font-mono text-muted-foreground">No crew on roster yet.</p>
      ) : (
        Object.entries(rollup)
          .sort(([, a], [, b]) => b.owed - a.owed)
          .map(([handle, r]) => (
            <div key={handle} className="grid grid-cols-[1fr_110px_110px_110px_110px] gap-2 items-center px-3 py-2 text-xs font-mono border-b last:border-b-0" style={border}>
              <span className="flex items-center gap-2 min-w-0">
                <span className="truncate text-foreground">{handle}</span>
                <Badge variant="outline" className={`text-[8px] h-4 shrink-0 ${byType(handle) === 'proprietor' ? 'border-primary/50 text-primary' : 'border-muted text-muted-foreground'}`}>
                  {byType(handle) === 'proprietor' ? 'PROPRIETOR' : 'CONTRACTOR'}
                </Badge>
              </span>
              <span className="text-right" style={{ color: r.owed > 0 ? 'hsl(45, 80%, 55%)' : 'hsl(35, 12%, 52%)' }}>
                {r.owed > 0 ? `${r.owed.toLocaleString()}` : '—'}
                {r.openOrders > 0 && <span className="text-[8px] text-muted-foreground ml-1">({r.openOrders} WO)</span>}
              </span>
              <span className="text-right text-muted-foreground">{r.workOrderPaid > 0 ? r.workOrderPaid.toLocaleString() : '—'}</span>
              <span className="text-right text-muted-foreground">{r.paydayPaid > 0 ? r.paydayPaid.toLocaleString() : '—'}</span>
              <span className="text-right text-primary">{(r.workOrderPaid + r.paydayPaid).toLocaleString()}</span>
            </div>
          ))
      )}
    </div>
  );
}