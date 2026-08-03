import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { standDownOperation } from '@/functions/standDownOperation';
import { Loader2, Ban } from 'lucide-react';

/**
 * Standing a run down, out loud — through the backend, never by flipping the status flag,
 * because a flag flipped in silence tells nobody who kept the evening free.
 */
export default function StandDownControl({ op }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');

  const stand = useMutation({
    mutationFn: () => standDownOperation({ operation_id: op.id, reason: reason.trim() }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crew_operations'] }),
  });

  if (['completed', 'stood_down'].includes(op.status)) return null;
  const err = stand.error?.response?.data?.error || stand.error?.message;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-2 py-1 border text-[7px] font-bold tracking-[0.12em]"
        style={{ borderColor: '#5C302A', color: '#D08A6A', background: '#140B08' }}
      >
        STAND IT DOWN…
      </button>
    );
  }

  return (
    <div className="w-full border p-2 space-y-1.5" style={{ borderColor: '#5C302A', background: '#120B08' }}>
      <p className="text-[8px] leading-relaxed" style={{ color: '#C8A05B' }}>
        Everyone who said they were in — or might be — is told directly, with your reason. They kept the
        time open, and silence would cost them an evening.
      </p>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={2}
        placeholder="Why the run is off. Required — 'stood down' with no reason is barely better than silence."
        className="w-full border px-2 py-1.5 text-[9px]"
        style={{ borderColor: '#3A2F20', background: '#0C0A07', color: '#EDE5D6' }}
      />
      {err && <p className="text-[8px]" style={{ color: '#D08A6A' }}>{err}</p>}
      <div className="flex gap-1.5">
        <button
          onClick={() => stand.mutate()}
          disabled={stand.isPending || !reason.trim()}
          className="h-7 px-3 border text-[7px] font-bold tracking-[0.14em] inline-flex items-center gap-1 disabled:opacity-40"
          style={{ borderColor: '#D08A6A', color: '#D08A6A', background: '#140B08' }}
        >
          {stand.isPending ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Ban className="w-2.5 h-2.5" />} STAND DOWN AND TELL EVERYONE
        </button>
        <button onClick={() => setOpen(false)} className="h-7 px-3 border text-[7px]" style={{ borderColor: '#2E2519', color: '#7A6E60' }}>
          KEEP THE RUN
        </button>
      </div>
    </div>
  );
}