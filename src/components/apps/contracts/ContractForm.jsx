import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileSignature } from 'lucide-react';

const border = { borderColor: 'hsl(33, 18%, 18%)' };
const panel = { ...border, background: 'hsl(30, 10%, 8%)' };

const TYPES = [
  { value: 'hauling', label: 'Hauling' },
  { value: 'commodity_sale', label: 'Commodity Sale' },
  { value: 'fabrication', label: 'Fabrication' },
  { value: 'salvage_op', label: 'Salvage Op' },
  { value: 'service', label: 'Service' },
];

const empty = { title: '', contract_type: 'hauling', counterparty: '', origin: '', destination: '', cargo: '', payout_auec: '', collateral_auec: '', deadline: '' };

export default function ContractForm() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(empty);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const createMutation = useMutation({
    mutationFn: () => base44.entities.contract.create({
      ...form,
      payout_auec: parseFloat(form.payout_auec) || 0,
      collateral_auec: parseFloat(form.collateral_auec) || 0,
      deadline: form.deadline || null,
      status: 'open',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      setForm(empty);
    },
  });

  return (
    <div className="p-3 rounded border space-y-2 font-mono" style={panel}>
      <div className="text-[10px] text-muted-foreground tracking-[0.2em] flex items-center gap-1.5">
        <FileSignature className="w-3 h-3 text-primary" /> POST CONTRACT
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        <Input placeholder="Contract title" value={form.title} onChange={(e) => set('title', e.target.value)} className="h-8 text-xs" style={border} />
        <Select value={form.contract_type} onValueChange={(v) => set('contract_type', v)}>
          <SelectTrigger className="h-8 text-xs" style={border}><SelectValue /></SelectTrigger>
          <SelectContent>
            {TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input placeholder="Counterparty (client / org)" value={form.counterparty} onChange={(e) => set('counterparty', e.target.value)} className="h-8 text-xs" style={border} />
        <Input placeholder="Cargo / deliverable, e.g. 96 SCU RMC" value={form.cargo} onChange={(e) => set('cargo', e.target.value)} className="h-8 text-xs" style={border} />
        <Input placeholder="Origin" value={form.origin} onChange={(e) => set('origin', e.target.value)} className="h-8 text-xs" style={border} />
        <Input placeholder="Destination" value={form.destination} onChange={(e) => set('destination', e.target.value)} className="h-8 text-xs" style={border} />
        <Input type="number" min="0" placeholder="Payout (aUEC)" value={form.payout_auec} onChange={(e) => set('payout_auec', e.target.value)} className="h-8 text-xs" style={border} />
        <Input type="number" min="0" placeholder="Collateral (aUEC)" value={form.collateral_auec} onChange={(e) => set('collateral_auec', e.target.value)} className="h-8 text-xs" style={border} />
        <Input type="date" value={form.deadline} onChange={(e) => set('deadline', e.target.value)} className="h-8 text-xs" style={border} title="Deadline" />
      </div>
      <Button size="sm" className="h-7 text-[10px]" disabled={!form.title || createMutation.isPending} onClick={() => createMutation.mutate()}>
        POST CONTRACT
      </Button>
    </div>
  );
}