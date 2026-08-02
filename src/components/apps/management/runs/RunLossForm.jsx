import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { recordSessionLoss } from '@/functions/recordSessionLoss';
import { Loader2, ShieldAlert } from 'lucide-react';

const box = { borderColor: '#3A2F20', background: '#0C0A07', color: '#EDE5D6' };

/** A hull destroyed, cargo lost, a claim timer running. Recorded to make the comrade whole, never held against them. */
export default function RunLossForm({ sessionId, queryKey }) {
  const qc = useQueryClient();
  const [kind, setKind] = useState('hull');
  const [label, setLabel] = useState('');
  const [handle, setHandle] = useState('');
  const [value, setValue] = useState('');
  const [claimUntil, setClaimUntil] = useState('');

  const record = useMutation({
    mutationFn: () => recordSessionLoss({
      session_id: sessionId, kind, label: label.trim(), handle: handle.trim(),
      ...(value !== '' ? { estimated_auec: Number(value) } : {}),
      claim_until: claimUntil ? new Date(claimUntil).toISOString() : '',
    }),
    onSuccess: () => {
      setLabel(''); setHandle(''); setValue(''); setClaimUntil('');
      qc.invalidateQueries({ queryKey });
    },
  });

  return (
    <div className="border p-2 space-y-2" style={{ borderColor: '#2E2519', background: '#0C0A07' }}>
      <div className="text-[7px] font-bold tracking-[0.2em]" style={{ color: '#6B6155' }}>RECORD A LOSS — KEPT APART FROM COSTS, NEVER TAKEN FROM THE SPLIT</div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
        <select value={kind} onChange={(e) => setKind(e.target.value)} className="h-8 border px-2 text-[9px]" style={box}>
          {['hull', 'cargo', 'other'].map((k) => <option key={k} value={k}>{k.toUpperCase()}</option>)}
        </select>
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="What was lost" className="h-8 border px-2 text-[9px]" style={box} />
        <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="Borne by (handle)" className="h-8 border px-2 text-[9px]" style={box} />
        <input type="number" min="0" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Value (aUEC)" className="h-8 border px-2 text-[9px]" style={box} />
        <input type="datetime-local" value={claimUntil} onChange={(e) => setClaimUntil(e.target.value)} title="When the insurance claim expires" className="h-8 border px-2 text-[9px]" style={box} />
      </div>
      {record.error && <p className="text-[8px]" style={{ color: '#D08A6A' }}>{record.error?.response?.data?.error || record.error.message}</p>}
      <button
        onClick={() => record.mutate()}
        disabled={record.isPending || !label.trim()}
        className="h-7 px-3 border text-[7px] font-bold tracking-[0.14em] inline-flex items-center gap-1 disabled:opacity-40"
        style={{ borderColor: '#5C302A', color: '#D08A6A', background: '#140B08' }}
      >
        {record.isPending ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <ShieldAlert className="w-2.5 h-2.5" />} RECORD THE LOSS
      </button>
    </div>
  );
}