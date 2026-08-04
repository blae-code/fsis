import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import { applyPatchReset } from '@/functions/applyPatchReset';
import { RotateCcw, Loader2, AlertTriangle } from 'lucide-react';

const AMBER = '#E0A22E';
const DIM = '#7A6E60';
const BOX = { borderColor: '#3A2F20', background: '#0C0A07' };

/**
 * Patch reset: after maintenance, clear the hoppers and set aside every figure the patch invalidated.
 * Previewed first, and never silent — everybody affected is told why their run or lot was written off.
 */
export default function PatchResetConsole() {
  const qc = useQueryClient();
  const [patchName, setPatchName] = useState('');
  const [reason, setReason] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);

  const run = useMutation({
    mutationFn: (dryRun) => applyPatchReset({ patch_name: patchName.trim(), reason: reason.trim(), dry_run: dryRun }),
    onSuccess: ({ data }) => {
      if (data?.dry_run) { setPreview(data); setResult(null); return; }
      setResult(data);
      setPreview(null);
      setConfirming(false);
      qc.invalidateQueries({ queryKey: ['processing_jobs'] });
    },
  });
  const err = run.error?.response?.data?.error || run.error?.message;

  return (
    <section className="border p-3 space-y-2 font-mono" style={{ borderColor: '#5A3A22', background: 'linear-gradient(180deg, #150F09, #0B0906)' }}>
      <div className="flex items-center gap-2 text-[9px] tracking-[0.22em]" style={{ color: AMBER }}>
        <RotateCcw className="w-3.5 h-3.5" /> PATCH RESET — CLEAR HOPPERS AND STALE FIGURES
      </div>
      <p className="text-[9px] leading-relaxed max-w-3xl" style={{ color: '#8A7E6C' }}>
        A patch empties the refineries and moves prices under the hall. Running hoppers are written off,
        open lots voided and live buyback offers set aside, with every comrade affected told plainly why.
        Trades already settled are never touched — those happened, in the world as it was.
      </p>

      <div className="grid sm:grid-cols-2 gap-2">
        <input
          value={patchName}
          onChange={(e) => { setPatchName(e.target.value); setPreview(null); setConfirming(false); }}
          placeholder="Patch name, e.g. Alpha 4.2"
          className="h-9 border px-2 text-[10px]" style={{ ...BOX, color: '#EDE5D6' }}
        />
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason recorded to everybody told (optional)"
          className="h-9 border px-2 text-[10px]" style={{ ...BOX, color: '#EDE5D6' }}
        />
      </div>

      {err && <p className="text-[9px]" style={{ color: '#D08A6A' }}>{err}</p>}

      {preview && (
        <div className="border p-2 space-y-1" style={BOX}>
          <div className="text-[8px] tracking-[0.2em]" style={{ color: '#8A8F45' }}>PREVIEW — NOTHING CHANGED YET</div>
          <div className="text-[9px]" style={{ color: '#D8CFC0' }}>
            {preview.would_clear_hoppers} hopper(s) cleared · {preview.would_void_lots} lot(s) voided · {preview.would_expire_offers} offer(s) set aside
          </div>
        </div>
      )}

      {result && (
        <div className="border p-2 space-y-1" style={{ ...BOX, borderColor: '#3C5A3C' }}>
          <div className="text-[8px] tracking-[0.2em]" style={{ color: '#7BA05B' }}>RESET APPLIED — {result.patch_name}</div>
          <div className="text-[9px]" style={{ color: '#D8CFC0' }}>
            {result.hoppers_cleared} hopper(s) cleared · {result.lots_voided} lot(s) voided · {result.offers_expired} offer(s) set aside · {result.comrades_told} comrade(s) told
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          disabled={!patchName.trim() || run.isPending}
          onClick={() => run.mutate(true)}
          className="h-9 px-3 border text-[8px] font-bold disabled:opacity-40"
          style={{ borderColor: '#3A2F20', color: '#C8A05B', background: '#120D08' }}
        >
          PREVIEW
        </button>
        {!confirming ? (
          <button
            disabled={!patchName.trim() || run.isPending}
            onClick={() => setConfirming(true)}
            className="h-9 px-3 border text-[8px] font-bold disabled:opacity-40"
            style={{ borderColor: '#8A6430', color: AMBER, background: '#120D08' }}
          >
            APPLY RESET
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[8px]" style={{ color: '#D08A6A' }}>
              <AlertTriangle className="w-3 h-3" /> THIS CANNOT BE UNDONE
            </span>
            <button
              disabled={run.isPending}
              onClick={() => run.mutate(false)}
              className="h-9 px-3 border text-[8px] font-bold flex items-center gap-1.5"
              style={{ borderColor: '#8A3030', color: '#E08A6A', background: '#170C08' }}
            >
              {run.isPending && <Loader2 className="w-3 h-3 animate-spin" />} CONFIRM RESET
            </button>
            <button onClick={() => setConfirming(false)} className="h-9 px-2 text-[8px]" style={{ color: DIM }}>CANCEL</button>
          </div>
        )}
      </div>
    </section>
  );
}