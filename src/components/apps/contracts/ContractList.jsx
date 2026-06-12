import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, ArrowRight, ShieldAlert } from 'lucide-react';

const border = { borderColor: 'hsl(33, 18%, 18%)' };
const panel = { ...border, background: 'hsl(30, 10%, 8%)' };

const STATUSES = ['open', 'accepted', 'in_progress', 'delivered', 'paid', 'failed', 'cancelled'];

const statusStyle = {
  open: 'border-primary/40 text-primary',
  accepted: 'border-yellow-500/40 text-yellow-400',
  in_progress: 'border-yellow-500/40 text-yellow-400',
  delivered: 'border-green-600/40 text-green-500',
  paid: 'border-green-600/40 text-green-500',
  failed: 'border-destructive/40 text-destructive',
  cancelled: 'border-destructive/40 text-destructive',
};

const typeLabel = {
  hauling: 'HAUL',
  commodity_sale: 'SALE',
  fabrication: 'FAB',
  salvage_op: 'SALVAGE',
  service: 'SERVICE',
};

export default function ContractList() {
  const queryClient = useQueryClient();

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.contract.list('-created_date', 100),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.contract.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contracts'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.contract.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contracts'] }),
  });

  if (contracts.length === 0) {
    return <p className="text-xs font-mono text-muted-foreground py-6 text-center">No contracts on the board</p>;
  }

  return (
    <div className="space-y-2 font-mono">
      {contracts.map((c) => (
        <div key={c.id} className="p-3 rounded border space-y-2" style={panel}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <Badge variant="outline" className="text-[9px] h-4" style={border}>{typeLabel[c.contract_type] || c.contract_type}</Badge>
              <span className="text-xs font-bold text-primary truncate">{c.title}</span>
              <Badge variant="outline" className={`text-[9px] h-4 ${statusStyle[c.status] || ''}`}>{c.status?.toUpperCase().replace('_', ' ')}</Badge>
            </div>
            <button onClick={() => deleteMutation.mutate(c.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground">
            {c.counterparty && <span>CLIENT: <span className="text-foreground">{c.counterparty}</span></span>}
            {(c.origin || c.destination) && (
              <span className="flex items-center gap-1">
                {c.origin || '—'} <ArrowRight className="w-3 h-3" /> {c.destination || '—'}
              </span>
            )}
            {c.cargo && <span>CARGO: <span className="text-foreground">{c.cargo}</span></span>}
            {c.deadline && <span>DUE: <span className="text-foreground">{c.deadline}</span></span>}
          </div>

          <div className="flex items-center justify-between gap-2 pt-1.5 border-t" style={border}>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="text-primary font-bold">{(c.payout_auec || 0).toLocaleString()} aUEC</span>
              {c.collateral_auec > 0 && (
                <span className="flex items-center gap-1 text-muted-foreground">
                  <ShieldAlert className="w-3 h-3" /> {c.collateral_auec.toLocaleString()} collateral
                </span>
              )}
            </div>
            <Select value={c.status} onValueChange={(status) => updateMutation.mutate({ id: c.id, status })}>
              <SelectTrigger className="h-6 w-32 text-[9px]" style={border}><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.toUpperCase().replace('_', ' ')}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      ))}
    </div>
  );
}