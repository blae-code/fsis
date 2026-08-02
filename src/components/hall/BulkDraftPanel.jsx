import React, { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bulkDraftHallLots } from '@/functions/bulkDraftHallLots';
import { Loader2, Rows3, AlertTriangle } from 'lucide-react';
import { parseBulkLines } from '@/components/hall/bulkParse';
import ListingAgreementGate from '@/components/hall/ListingAgreementGate';
import { fmtAuec } from '@/components/hall/hallMeta';

/**
 * A hold full of gear written up in one go — as drafts, never live.
 *
 * The batch is shown back as a table before it is sent and again as a result afterwards, because
 * bulk entry is exactly where a mistyped reserve gets past somebody: the attention that goes into
 * one careful listing does not survive being asked for forty times.
 */
export default function BulkDraftPanel() {
  const qc = useQueryClient();
  const [text, setText] = useState('');
  const rows = useMemo(() => parseBulkLines(text), [text]);

  const draft = useMutation({
    mutationFn: () => bulkDraftHallLots({ lots: rows }),
    onSuccess: () => {
      setText('');
      qc.invalidateQueries({ queryKey: ['hall'] });
    },
  });

  const err = draft.error?.response?.data;
  const result = draft.data?.data;

  return (
    <div className="border p-3 space-y-2" style={{ borderColor: '#3A2F20', background: 'linear-gradient(180deg, #100D09, #0B0906)' }}>
      <div className="flex items-center gap-2 text-[9px] tracking-[0.22em]" style={{ color: '#C8A05B' }}>
        <Rows3 className="w-3.5 h-3.5" /> WRITE UP A HOLD
      </div>
      <p className="text-[9px] leading-relaxed" style={{ color: '#8A7E6C' }}>
        One lot per line, up to fifty:{' '}
        <span style={{ color: '#C8A05B' }}>title | type | qty | grade | opens at | reserve</span>. Only
        the title is needed. Everything lands as a draft and nothing goes live until you have read it
        back.
      </p>

      {err?.instrument_id ? (
        <ListingAgreementGate instrumentId={err.instrument_id} reason={err.error} onSigned={() => draft.reset()} />
      ) : (
        err?.error && <p className="text-[9px]" style={{ color: '#D08A6A' }}>{err.error}</p>
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder={'Size 2 Quantum Drive | component | 1 | used | 12000 | 20000\nBallistic Cannon | weapon | 2 | worn | 4000'}
        className="w-full border px-2 py-1.5 text-[10px]"
        style={{ borderColor: '#3A2F20', background: '#0C0A07', color: '#EDE5D6' }}
      />

      {rows.length > 0 && (
        <div className="border divide-y max-h-52 overflow-auto" style={{ borderColor: '#2E2519' }}>
          {rows.map((row, i) => (
            <div key={i} className="flex items-center justify-between gap-2 px-2 py-1" style={{ borderColor: '#1C1610' }}>
              <span className="text-[9px] truncate" style={{ color: row.title ? '#EDE5D6' : '#C05050' }}>
                {i + 1}. {row.title || 'no title on this line'}
              </span>
              <span className="text-[8px] shrink-0" style={{ color: '#7A6E60' }}>
                ×{row.quantity} · {(row.condition_grade || '—').toUpperCase()} · opens {fmtAuec(row.start_auec)}
              </span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => draft.mutate()}
        disabled={draft.isPending || rows.length === 0}
        className="h-9 px-4 border text-[9px] font-bold tracking-[0.14em] inline-flex items-center gap-2 disabled:opacity-40"
        style={{ borderColor: '#4A3A22', color: '#E0A22E', background: '#14100A' }}
      >
        {draft.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Rows3 className="w-3 h-3" />}
        WRITE UP {rows.length || ''} AS DRAFTS
      </button>

      {result && (
        <div className="border p-2 space-y-1.5" style={{ borderColor: '#4A3A22', background: '#0F0C08' }}>
          <p className="text-[9px] leading-relaxed" style={{ color: '#C8A05B' }}>{result.note}</p>
          {(result.rejected || []).length > 0 && (
            <div className="space-y-1">
              {result.rejected.map((r) => (
                <div key={r.line} className="flex items-start gap-1.5 text-[9px]" style={{ color: '#D08A6A' }}>
                  <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                  <span>LINE {r.line}{r.title ? ` · ${r.title}` : ''} — {r.reason}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}