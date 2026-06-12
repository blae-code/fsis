import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, Check, CheckCircle2, Trash2 } from 'lucide-react';

const border = { borderColor: 'hsl(33, 18%, 18%)' };
const panel = { ...border, background: 'hsl(30, 10%, 8%)' };

export function computePayout(order) {
  const gross = order.gross_auec || 0;
  const expensesTotal = (order.expenses || []).reduce((s, e) => s + (e.amount_auec || 0), 0);
  const net = gross - expensesTotal;
  const totalShares = (order.crew_shares || []).reduce((s, c) => s + (c.shares || 0), 0);
  const payouts = (order.crew_shares || []).map((c) => ({
    handle: c.handle,
    shares: c.shares,
    amount: totalShares > 0 ? (net * (c.shares || 0)) / totalShares : 0,
  }));
  return { gross, expensesTotal, net, totalShares, payouts };
}

export default function WorkOrderList() {
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState(null);

  const { data: orders = [] } = useQuery({
    queryKey: ['work_orders'],
    queryFn: () => base44.entities.work_order.list('-created_date', 50),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.work_order.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['work_orders'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.work_order.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['work_orders'] }),
  });

  const copyPayout = (order) => {
    const p = computePayout(order);
    const lines = [
      `FSIS FairShare Payout — ${order.order_name}`,
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      `Gross: ${p.gross.toLocaleString()} aUEC`,
      ...((order.expenses || []).map((e) => `Expense — ${e.label}: -${(e.amount_auec || 0).toLocaleString()} aUEC`)),
      `Net: ${p.net.toLocaleString()} aUEC`,
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      ...p.payouts.map((x) => `${x.handle} (${x.shares} sh): ${Math.round(x.amount).toLocaleString()} aUEC`),
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '"Every credit accounted for."',
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedId(order.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-2 font-mono">
      <div className="text-[10px] text-muted-foreground tracking-[0.2em]">WORK ORDERS ({orders.length})</div>
      {orders.length === 0 ? (
        <p className="text-xs text-muted-foreground py-6 text-center">No work orders yet.</p>
      ) : orders.map((order) => {
        const p = computePayout(order);
        const settled = order.status === 'settled';
        return (
          <div key={order.id} className="p-3 rounded border space-y-2" style={panel}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-primary truncate">{order.order_name}</span>
                <Badge variant="outline" className={`text-[9px] h-4 shrink-0 ${settled ? 'border-green-500/40 text-green-400' : 'border-primary/40 text-primary'}`}>
                  {settled ? 'SETTLED' : 'OPEN'}
                </Badge>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1" style={border} onClick={() => copyPayout(order)}>
                  {copiedId === order.id ? <Check className="w-2.5 h-2.5 text-primary" /> : <Copy className="w-2.5 h-2.5" />}
                  PAYOUT
                </Button>
                {!settled && (
                  <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1" style={border}
                    onClick={() => updateMutation.mutate({ id: order.id, data: { status: 'settled' } })}>
                    <CheckCircle2 className="w-2.5 h-2.5" /> SETTLE
                  </Button>
                )}
                <button onClick={() => deleteMutation.mutate(order.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div><span className="text-muted-foreground">GROSS </span><span className="text-foreground">{p.gross.toLocaleString()}</span></div>
              <div><span className="text-muted-foreground">EXPENSES </span><span className="text-destructive">-{p.expensesTotal.toLocaleString()}</span></div>
              <div><span className="text-muted-foreground">NET </span><span className="text-primary font-bold">{p.net.toLocaleString()}</span></div>
            </div>

            {p.payouts.length > 0 && (
              <div className="space-y-1 pt-1.5 border-t" style={border}>
                {p.payouts.map((x, i) => (
                  <div key={i} className="flex justify-between text-[10px] px-2 py-1 rounded" style={{ background: 'hsl(30, 10%, 12%)' }}>
                    <span className="text-foreground">{x.handle} <span className="text-muted-foreground">({x.shares} sh)</span></span>
                    <span className="text-primary font-semibold">{Math.round(x.amount).toLocaleString()} aUEC</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}