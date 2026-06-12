import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { computePayout } from '@/components/apps/fairshare/payout';
import { ChevronRight, CheckCircle2, Clock, Loader2 } from 'lucide-react';

// Payroll verification: recent work orders, their fair-share distributions,
// cross-checked against crew_pay ledger entries so payouts can be verified.
export default function PayrollTable() {
  const [expanded, setExpanded] = useState(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['work_orders'],
    queryFn: () => base44.entities.work_order.list('-created_date', 50),
  });

  const { data: payEntries = [] } = useQuery({
    queryKey: ['ledger_crew_pay'],
    queryFn: () => base44.entities.ledger_entry.filter({ category: 'crew_pay' }, '-created_date', 200),
  });

  const isPaid = (handle, payout) =>
    payEntries.some((e) => e.counterparty === handle && e.amount_auec === payout);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <p className="text-center py-12 text-xs font-mono text-muted-foreground">
        No work orders logged yet.
      </p>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-2">
        <SummaryChip label="WORK ORDERS" value={orders.length} />
        <SummaryChip label="SETTLED" value={orders.filter((o) => o.status === 'settled').length} color="hsl(140, 45%, 50%)" />
        <SummaryChip label="AWAITING PAYOUT" value={orders.filter((o) => o.status !== 'settled').length} color="hsl(45, 80%, 55%)" />
      </div>

      {/* Table header */}
      <div className="grid grid-cols-[16px_1fr_90px_90px_70px] gap-2 px-2 text-[9px] font-mono tracking-[0.15em] text-muted-foreground">
        <span />
        <span>ORDER</span>
        <span className="text-right">NET aUEC</span>
        <span className="text-right">CREW</span>
        <span className="text-right">STATUS</span>
      </div>

      {orders.map((order) => {
        const p = computePayout(order);
        const open = expanded === order.id;
        return (
          <div key={order.id} className="border" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 7%)' }}>
            <button
              onClick={() => setExpanded(open ? null : order.id)}
              className="w-full grid grid-cols-[16px_1fr_90px_90px_70px] gap-2 items-center px-2 py-2 text-left hover:bg-secondary/40 transition-colors"
            >
              <ChevronRight className={`w-3 h-3 text-muted-foreground transition-transform ${open ? 'rotate-90' : ''}`} />
              <div className="min-w-0">
                <p className="text-xs font-mono truncate text-foreground">{order.order_name}</p>
                {order.settled_date && (
                  <p className="text-[9px] font-mono text-muted-foreground">settled {order.settled_date}</p>
                )}
              </div>
              <span className="text-xs font-mono text-right text-primary">{p.net.toLocaleString()}</span>
              <span className="text-[10px] font-mono text-right text-muted-foreground">
                {(order.crew_shares || []).length} / {p.totalShares} sh
              </span>
              <span className="flex justify-end">
                {order.status === 'settled' ? (
                  <span className="inline-flex items-center gap-1 text-[9px] font-mono" style={{ color: 'hsl(140, 45%, 50%)' }}>
                    <CheckCircle2 className="w-3 h-3" /> SETTLED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[9px] font-mono" style={{ color: 'hsl(45, 80%, 55%)' }}>
                    <Clock className="w-3 h-3" /> OPEN
                  </span>
                )}
              </span>
            </button>

            {open && (
              <div className="border-t px-3 py-2 space-y-1" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 5%)' }}>
                <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                  <span>Gross {p.gross.toLocaleString()} − Expenses {p.expenseTotal.toLocaleString()}</span>
                  <span>= Net {p.net.toLocaleString()} aUEC</span>
                </div>
                {p.rows.map((r) => {
                  const paid = isPaid(r.handle, r.payout);
                  return (
                    <div key={r.handle} className="flex items-center gap-2 text-xs font-mono">
                      <span className="flex-1 truncate text-foreground">{r.handle}</span>
                      <span className="text-muted-foreground">{r.shares}x</span>
                      <span className="w-24 text-right text-primary">{r.payout.toLocaleString()}</span>
                      <span className="w-20 text-right">
                        {paid ? (
                          <span className="text-[9px]" style={{ color: 'hsl(140, 45%, 50%)' }}>✓ LEDGERED</span>
                        ) : (
                          <span className="text-[9px] text-muted-foreground">—</span>
                        )}
                      </span>
                    </div>
                  );
                })}
                {p.rows.length === 0 && (
                  <p className="text-[10px] font-mono text-muted-foreground">No crew assigned to this order.</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SummaryChip({ label, value, color }) {
  return (
    <div className="border px-3 py-2" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 7%)' }}>
      <p className="text-[9px] font-mono tracking-[0.15em] text-muted-foreground">{label}</p>
      <p className="text-lg font-mono font-bold" style={{ color: color || 'hsl(38, 72%, 52%)' }}>{value}</p>
    </div>
  );
}