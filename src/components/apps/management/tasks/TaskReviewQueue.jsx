import React, { useState } from 'react';
import { reviewTask } from '@/functions/reviewTask';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Gavel, Loader2, ExternalLink } from 'lucide-react';
import { fmtAuec } from '@/components/apps/management/tasks/taskMeta';

const box = { borderColor: '#3A2F20', background: '#0C0A07', color: '#EDE5D6' };

/** Filed work awaiting the council's judgement. Credit pays the agreed sum in full. */
export default function TaskReviewQueue({ tasks = [] }) {
  const qc = useQueryClient();
  const [drafts, setDrafts] = useState({});
  const review = useMutation({
    mutationFn: (payload) => reviewTask(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['labour_tasks'] }),
  });
  const setDraft = (id, patch) => setDrafts((d) => ({ ...d, [id]: { ...d[id], ...patch } }));

  return (
    <div className="border p-3 space-y-2" style={{ borderColor: '#5C4424', background: '#0B0906' }}>
      <div className="flex items-center gap-2 text-[9px] tracking-[0.22em]" style={{ color: '#C8893B' }}>
        <Gavel className="w-3.5 h-3.5" /> WORK FILED FOR REVIEW
        {tasks.length > 0 && (
          <span className="px-1.5 py-0.5 text-[8px] font-bold" style={{ background: '#3A2810', color: '#E0A22E', border: '1px solid #8A6430' }}>{tasks.length}</span>
        )}
      </div>
      {review.error && <p className="text-[9px]" style={{ color: '#D08A6A' }}>{review.error?.response?.data?.error || review.error.message}</p>}
      {tasks.length === 0 ? (
        <p className="text-[9px] py-6 text-center" style={{ color: '#6B6155' }}>No work awaiting review — the board is square.</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => {
            const d = drafts[t.id] || {};
            return (
              <div key={t.id} className="border p-2 space-y-2" style={{ borderColor: '#2E2519', background: '#0C0A07' }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[11px] truncate" style={{ color: '#EDE5D6' }}>{t.title}</div>
                    <div className="text-[8px]" style={{ color: '#6B6155' }}>
                      {t.assigned_handle || t.assigned_email} · filed {t.submitted_at ? new Date(t.submitted_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : '—'}
                    </div>
                  </div>
                  <span className="text-[9px] shrink-0" style={{ color: '#8A8F45' }}>{fmtAuec(t.agreed_credit_auec)}</span>
                </div>
                {t.proof_notes && <p className="text-[9px] leading-snug border-l pl-2" style={{ color: '#A89C8A', borderColor: '#3A2F20' }}>{t.proof_notes}</p>}
                {t.proof_file_url && (
                  <a href={t.proof_file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[8px]" style={{ color: '#6FA0C8' }}>
                    <ExternalLink className="w-2.5 h-2.5" /> VIEW FILED PROOF
                  </a>
                )}
                <div className="grid sm:grid-cols-2 gap-2">
                  <input type="number" min="0" value={d.credited_auec ?? t.agreed_credit_auec ?? 0} onChange={(e) => setDraft(t.id, { credited_auec: e.target.value })} className="h-8 border px-2 text-[10px]" style={box} />
                  <input value={d.review_notes || ''} onChange={(e) => setDraft(t.id, { review_notes: e.target.value })} placeholder="Notes to the worker" className="h-8 border px-2 text-[10px]" style={box} />
                </div>
                <div className="flex gap-1">
                  <button
                    disabled={review.isPending}
                    onClick={() => review.mutate({ task_id: t.id, decision: 'credit', credited_auec: Number(d.credited_auec ?? t.agreed_credit_auec ?? 0), review_notes: d.review_notes || '' })}
                    className="px-3 py-1.5 border text-[8px] font-bold tracking-[0.12em] inline-flex items-center gap-1 disabled:opacity-40"
                    style={{ borderColor: '#8A8F4555', color: '#8A8F45', background: '#0E1009' }}
                  >
                    {review.isPending ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : null} CREDIT IN FULL
                  </button>
                  <button
                    disabled={review.isPending || !(d.review_notes || '').trim()}
                    onClick={() => review.mutate({ task_id: t.id, decision: 'return', review_notes: d.review_notes || '' })}
                    className="px-3 py-1.5 border text-[8px] font-bold tracking-[0.12em] disabled:opacity-40"
                    style={{ borderColor: '#5C302A', color: '#D08A6A', background: '#140B08' }}
                  >
                    SEND BACK
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}