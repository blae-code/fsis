import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Truck, Wrench, Factory, ArrowLeftRight, Shield, FileText, Trash2, ArrowRight } from 'lucide-react';

const border = { borderColor: 'hsl(33, 18%, 18%)' };
const panel = { ...border, background: 'hsl(30, 10%, 8%)' };

const TYPE_META = {
  hauling: { icon: Truck, label: 'HAULING' },
  salvage_op: { icon: Wrench, label: 'SALVAGE OP' },
  fabrication: { icon: Factory, label: 'FABRICATION' },
  item_exchange: { icon: ArrowLeftRight, label: 'EXCHANGE' },
  escort: { icon: Shield, label: 'ESCORT' },
  other: { icon: FileText, label: 'OTHER' },
};

const STATUS_META = {
  open: { label: 'OPEN', cls: 'border-primary/40 text-primary', next: 'in_progress', nextLabel: 'START' },
  in_progress: { label: 'IN PROGRESS', cls: 'border-yellow-500/40 text-yellow-400', next: 'completed', nextLabel: 'COMPLETE' },
  completed: { label: 'COMPLETED', cls: 'border-green-500/40 text-green-400' },
  cancelled: { label: 'CANCELLED', cls: 'border-destructive/40 text-destructive' },
};

export default function ContractBoard() {
  const queryClient = useQueryClient();

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.contract.list('-created_date', 100),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.contract.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contracts'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.contract.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contracts'] }),
  });

  const active = contracts.filter((c) => ['open', 'in_progress'].includes(c.status));
  const closed = contracts.filter((c) => ['completed', 'cancelled'].includes(c.status));

  const renderContract = (c) => {
    const type = TYPE_META[c.contract_type] || TYPE_META.other;
    const status = STATUS_META[c.status] || STATUS_META.open;
    const TypeIcon = type.icon;
    return (
      <div key={c.id} className="p-3 rounded border space-y-2 font-mono" style={panel}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <TypeIcon className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-xs font-bold text-primary truncate">{c.title}</span>
            <Badge variant="outline" className={`text-[9px] h-4 shrink-0 ${status.cls}`}>{status.label}</Badge>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {status.next && (
              <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1" style={border}
                onClick={() => updateMutation.mutate({ id: c.id, data: { status: status.next } })}>
                <ArrowRight className="w-2.5 h-2.5" /> {status.nextLabel}
              </Button>
            )}
            {['open', 'in_progress'].includes(c.status) && (
              <Button variant="outline" size="sm" className="h-6 text-[9px]" style={border}
                onClick={() => updateMutation.mutate({ id: c.id, data: { status: 'cancelled' } })}>
                CANCEL
              </Button>
            )}
            <button onClick={() => deleteMutation.mutate(c.id)} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px]">
          <span><span className="text-muted-foreground">PAYOUT </span><span className="text-primary font-bold">{(c.payout_auec || 0).toLocaleString()} aUEC</span></span>
          {c.collateral_auec > 0 && <span><span className="text-muted-foreground">COLLATERAL </span><span className="text-foreground">{c.collateral_auec.toLocaleString()}</span></span>}
          {c.counterparty && <span><span className="text-muted-foreground">CLIENT </span><span className="text-foreground">{c.counterparty}</span></span>}
          {(c.origin || c.destination) && <span className="text-foreground">{c.origin || '?'} → {c.destination || '?'}</span>}
          {c.cargo && <span className="text-foreground">{c.cargo}</span>}
          {c.deadline && <span><span className="text-muted-foreground">DUE </span><span className="text-foreground">{c.deadline}</span></span>}
        </div>
        {c.notes && <p className="text-[10px] text-muted-foreground">{c.notes}</p>}
      </div>
    );
  };

  return (
    <div className="space-y-4 font-mono">
      <div className="space-y-2">
        <div className="text-[10px] text-muted-foreground tracking-[0.2em]">ACTIVE CONTRACTS ({active.length})</div>
        {active.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">No active contracts on the board.</p>
        ) : active.map(renderContract)}
      </div>
      {closed.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] text-muted-foreground tracking-[0.2em]">CLOSED ({closed.length})</div>
          {closed.map(renderContract)}
        </div>
      )}
    </div>
  );
}