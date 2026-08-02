import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { closeOperationSession } from '@/functions/closeOperationSession';
import { Loader2, FlagOff } from 'lucide-react';
import { fmtAuec } from '@/components/runs/runMeta';

const box = { borderColor: '#3A2F20', background: '#0C0A07', color: '#EDE5D6' };

/**
 * Closeout. Irreversible — shares are written, contractors settled, everyone told — so it asks twice.
 * The suggested gross is a reading of what was attached; the council states what it actually sold for.
 */
export default function RunCloseForm({ sessionId, suggestedGross, basis, queryKey }) {
  const qc = useQueryClient();
  const [gross, setGross] = useState('');
  const [debrief, setDebrief] = useState('');
  const [confirming, setConfirming] = useState(false);

  const close = useMutation({
    mutationFn: () => closeOperationSession({
      session_id: sessionId,
      ...(gross !== '' ? { gross_auec: Number(gross) } : {}),
      debrief: debrief.trim(),
    }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: ['run_sessions'] });
    },
  });

  return (
    <div className="border p-2 space-y-2" style={{ borderColor: '#4A3A22', background: '#14100A' }}>
      <div className="text-[7px] font-bold tracking-[0.2em]" style={{ color: '#E0A22E' }}>CLOSE THE RUN — SHARES ARE WRITTEN AND CANNOT BE UNWRITTEN</div>
      <div className="grid sm:grid-cols-2 gap-2">
        <div className="space-y-1">
          <input type="number" min="0" value={gross} onChange={(e) => setGross(e.target.value)} placeholder={`Gross the run actually made (suggested: ${fmtAuec(suggestedGross)})`} className="h-9 w-full border px-2 text-[10px]" style={box} />
          {basis && <p className="text-[7px] leading-relaxed" style={{ color: '#8A7E6C' }}>{basis}</p>}
        </div>
        <textarea value={debrief} onChange={(e) => setDebrief(e.target.value)} rows={2} placeholder="Debrief — what was learned, so the next run is better" className="border px-2 py-1.5 text-[10px]" style={box} />
      </div>
      {close.error && <p className="text-[9px]" style={{ color: '#D08A6A' }}>{close.error?.response?.data?.error || close.error.message}</p>}
      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="h-8 px-3 border text-[8px] font-bold tracking-[0.14em] inline-flex items-center gap-1.5"
          style={{ borderColor: '#4A3A22', color: '#E0A22E', background: '#120D08' }}
        >
          <FlagOff className="w-3 h-3" /> CLOSE AND SETTLE THE RUN…
        </button>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[9px]" style={{ color: '#C8A05B' }}>
            This settles the run for good: time becomes shares, contractors are settled, everyone is told.
          </span>
          <button
            onClick={() => close.mutate()}
            disabled={close.isPending}
            className="h-8 px-3 border text-[8px] font-bold tracking-[0.14em] inline-flex items-center gap-1.5 disabled:opacity-40"
            style={{ borderColor: '#E0A22E', color: '#0C0A07', background: 'linear-gradient(135deg, #E0A22E, #C8893B)' }}
          >
            {close.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <FlagOff className="w-3 h-3" />} YES — SETTLE IT
          </button>
          <button onClick={() => setConfirming(false)} className="h-8 px-3 border text-[8px]" style={{ borderColor: '#2E2519', color: '#7A6E60' }}>
            NOT YET
          </button>
        </div>
      )}
    </div>
  );
}