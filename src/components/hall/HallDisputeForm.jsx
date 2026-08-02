import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { raiseHallDispute } from '@/functions/raiseHallDispute';
import { Loader2, ShieldAlert } from 'lucide-react';

const box = { borderColor: '#3A2F20', background: '#0C0A07', color: '#EDE5D6' };

const KINDS = [
  { value: 'non_delivery', label: 'THE ITEM NEVER CAME' },
  { value: 'not_as_described', label: 'NOT AS DESCRIBED' },
  { value: 'vanished', label: 'THE OTHER PARTY VANISHED' },
  { value: 'payment_not_received', label: 'PAYMENT NEVER ARRIVED' },
  { value: 'other', label: 'SOMETHING ELSE' },
];

/**
 * A comrade says something went wrong with a trade.
 *
 * Honest about what it can do: the hall cannot reverse a payment or recover an item — settlement
 * happens in-game. What filing does is put it on record, get the other party heard, and have an
 * Owner rule, with both trade records carrying the outcome.
 */
export default function HallDisputeForm({ lotId, onFiled }) {
  const [kind, setKind] = useState('non_delivery');
  const [account, setAccount] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const qc = useQueryClient();

  const file = useMutation({
    mutationFn: () => raiseHallDispute({ lot_id: lotId, kind, account: account.trim(), evidence_url: evidenceUrl.trim() }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hall_lot', lotId] });
      qc.invalidateQueries({ queryKey: ['hall'] });
      onFiled?.();
    },
  });

  const errText = file.error?.response?.data?.error || file.error?.message;

  if (file.data?.ok) {
    return (
      <div className="border p-2 space-y-1" style={{ borderColor: '#4A3A22', background: '#14100A' }}>
        <div className="text-[8px] font-bold tracking-[0.18em]" style={{ color: '#E0A22E' }}>DISPUTE RAISED</div>
        <p className="text-[9px] leading-relaxed" style={{ color: '#C8A05B' }}>{file.data.note}</p>
      </div>
    );
  }

  return (
    <div className="border p-2 space-y-2" style={{ borderColor: '#5C302A', background: '#120B08' }}>
      <div className="flex items-center gap-1.5 text-[8px] font-bold tracking-[0.18em]" style={{ color: '#D08A6A' }}>
        <ShieldAlert className="w-3 h-3" /> RAISE A DISPUTE ON THIS TRADE
      </div>
      <p className="text-[9px] leading-relaxed" style={{ color: '#8A7E6C' }}>
        The other party will read your account and be asked for theirs before an Owner rules. The hall
        cannot reverse a payment or recover an item — settlement happens in-game — but the ruling goes
        on both trade records, and that is worth having.
      </p>
      <select value={kind} onChange={(e) => setKind(e.target.value)} className="h-9 w-full border px-2 text-[10px]" style={box}>
        {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
      </select>
      <textarea
        value={account}
        onChange={(e) => setAccount(e.target.value)}
        rows={3}
        placeholder="What happened, in your own words. An Owner will read it, and so will the other party."
        className="w-full border px-2 py-1.5 text-[10px]"
        style={box}
      />
      <input
        value={evidenceUrl}
        onChange={(e) => setEvidenceUrl(e.target.value)}
        placeholder="Link to a screenshot or log, if you have one (optional)"
        className="h-9 w-full border px-2 text-[10px]"
        style={box}
      />
      {errText && <p className="text-[9px] leading-relaxed" style={{ color: '#D08A6A' }}>{errText}</p>}
      <button
        onClick={() => file.mutate()}
        disabled={file.isPending || !account.trim()}
        className="h-8 px-3 border text-[8px] font-bold tracking-[0.14em] inline-flex items-center gap-1.5 disabled:opacity-40"
        style={{ borderColor: '#D08A6A', color: '#D08A6A', background: '#140B08' }}
      >
        {file.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldAlert className="w-3 h-3" />} PUT IT ON RECORD
      </button>
    </div>
  );
}