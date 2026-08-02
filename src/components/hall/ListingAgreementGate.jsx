import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listMyInstruments } from '@/functions/listMyInstruments';
import { signInstrument } from '@/functions/signInstrument';
import { Loader2, ScrollText, PenLine } from 'lucide-react';

/**
 * The terms, in full, before a lot goes up under them.
 *
 * A lot listed under an agreement nobody can point to is a lot with no terms — and the commission is
 * one of those terms. So the wording is shown whole here rather than summarised or linked away: a
 * comrade signs what they have read, and can read it again afterwards under WHAT I HAVE SIGNED.
 */
export default function ListingAgreementGate({ instrumentId, reason, onSigned }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['my_instruments'],
    queryFn: () => listMyInstruments({}).then((r) => r.data),
  });

  const asked = (data?.asked || []).find((a) => a.instrument_id === instrumentId);

  const sign = useMutation({
    mutationFn: () => signInstrument({ instrument_id: instrumentId, accepted_version: asked?.version }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my_instruments'] });
      onSigned?.();
    },
  });

  const err = sign.error?.response?.data?.error || sign.error?.message;

  return (
    <div className="border p-3 space-y-2" style={{ borderColor: '#4A3A22', background: '#14100A' }}>
      <div className="flex items-center gap-2 text-[9px] font-bold tracking-[0.2em]" style={{ color: '#E0A22E' }}>
        <ScrollText className="w-3.5 h-3.5" /> {asked?.title || 'THE LISTING AGREEMENT'}
        {asked?.version ? <span style={{ color: '#8A7E6C' }}>· V{asked.version}</span> : null}
      </div>

      <p className="text-[9px] leading-relaxed" style={{ color: '#C8A05B' }}>
        {asked?.what_is_needed || reason || 'These terms must be agreed before you can list.'}
      </p>

      {asked?.summary_of_changes && (
        <p className="text-[9px] leading-relaxed border px-2 py-1.5" style={{ borderColor: '#3A2F20', color: '#8A7E6C' }}>
          WHAT CHANGED — {asked.summary_of_changes}
        </p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin" style={{ color: '#E0A22E' }} /></div>
      ) : (
        <div
          className="border p-2 max-h-64 overflow-auto space-y-2"
          style={{ borderColor: '#2E2519', background: '#0A0806' }}
        >
          {(asked?.body || '').split('\n\n').filter(Boolean).map((para, i) => (
            <p key={i} className="text-[9px] leading-relaxed" style={{ color: '#C6BCAB' }}>{para}</p>
          ))}
          {!asked?.body && <p className="text-[9px]" style={{ color: '#6B6155' }}>The wording could not be read just now.</p>}
        </div>
      )}

      <p className="text-[8px] leading-relaxed" style={{ color: '#6B6155' }}>
        FSIS is bound by these terms too, and the wording you agree to is kept exactly as it stands
        today. You may withdraw from it at any time.
      </p>

      {err && <p className="text-[9px]" style={{ color: '#D08A6A' }}>{err}</p>}

      <button
        onClick={() => sign.mutate()}
        disabled={sign.isPending || !asked}
        className="h-9 px-4 border text-[9px] font-bold tracking-[0.14em] inline-flex items-center gap-2 disabled:opacity-40"
        style={{ borderColor: '#E0A22E', color: '#0C0A07', background: 'linear-gradient(135deg, #E0A22E, #C8893B)' }}
      >
        {sign.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <PenLine className="w-3 h-3" />} PUT MY NAME TO THIS
      </button>
    </div>
  );
}