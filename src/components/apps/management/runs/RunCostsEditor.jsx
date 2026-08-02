import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Plus, X } from 'lucide-react';
import { fmtAuec } from '@/components/runs/runMeta';

const box = { borderColor: '#3A2F20', background: '#0C0A07', color: '#EDE5D6' };
const CATEGORIES = ['fuel', 'ammo', 'rearm', 'repair', 'insurance', 'other'];

/** Costs of the run, edited on the session record before closing. Stated openly so hands can see what was taken and why. */
export default function RunCostsEditor({ session, queryKey }) {
  const qc = useQueryClient();
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState('fuel');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');

  const save = useMutation({
    mutationFn: (costs) => base44.entities.operation_session.update(session.id, { costs }),
    onSuccess: () => {
      setLabel(''); setAmount(''); setPaidBy('');
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: ['run_sessions'] });
    },
  });

  const costs = session.costs || [];
  const add = () => save.mutate([...costs, {
    label: label.trim(), category, amount_auec: Math.max(0, Number(amount) || 0), paid_by_handle: paidBy.trim(),
  }]);
  const remove = (i) => save.mutate(costs.filter((_, idx) => idx !== i));

  return (
    <div className="border p-2 space-y-2" style={{ borderColor: '#2E2519', background: '#0C0A07' }}>
      <div className="text-[7px] font-bold tracking-[0.2em]" style={{ color: '#6B6155' }}>COSTS — DEDUCTED FROM THE GROSS BEFORE THE SPLIT</div>
      {costs.map((c, i) => (
        <div key={i} className="flex items-center gap-2 text-[8px]" style={{ color: '#A89C8A' }}>
          <span className="truncate">{(c.category || 'other').toUpperCase()} — {c.label}{c.paid_by_handle ? ` (carried by ${c.paid_by_handle})` : ''}</span>
          <span className="ml-auto shrink-0" style={{ color: '#C8893B' }}>{fmtAuec(c.amount_auec)}</span>
          <button onClick={() => remove(i)} disabled={save.isPending} className="shrink-0" style={{ color: '#6B6155' }}><X className="w-3 h-3" /></button>
        </div>
      ))}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="What it was" className="h-8 border px-2 text-[9px]" style={box} />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-8 border px-2 text-[9px]" style={box}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c.toUpperCase()}</option>)}
        </select>
        <input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="aUEC" className="h-8 border px-2 text-[9px]" style={box} />
        <input value={paidBy} onChange={(e) => setPaidBy(e.target.value)} placeholder="Carried by (handle)" className="h-8 border px-2 text-[9px]" style={box} />
      </div>
      {save.error && <p className="text-[8px]" style={{ color: '#D08A6A' }}>{save.error.message}</p>}
      <button
        onClick={add}
        disabled={save.isPending || !label.trim() || !(Number(amount) > 0)}
        className="h-7 px-3 border text-[7px] font-bold tracking-[0.14em] inline-flex items-center gap-1 disabled:opacity-40"
        style={{ borderColor: '#3A2F20', color: '#C8A05B', background: '#120D08' }}
      >
        {save.isPending ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Plus className="w-2.5 h-2.5" />} ADD COST
      </button>
    </div>
  );
}