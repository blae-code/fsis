import React, { useMemo } from 'react';
import { History } from 'lucide-react';
import { fmtAuec } from '@/components/apps/management/tasks/taskMeta';

/** The comrade's own record of labour performed and value returned to them. */
export default function WorkHistoryPanel({ tasks, operations, userId }) {
  const credited = useMemo(
    () => tasks.filter((t) => t.status === 'credited').sort((a, b) => new Date(b.reviewed_at || 0) - new Date(a.reviewed_at || 0)),
    [tasks],
  );
  const totalPaid = credited.reduce((s, t) => s + (Number(t.credited_auec) || 0), 0);
  const mustersAttended = (operations || []).filter(
    (o) => o.status === 'completed' && (o.rsvps || []).some((r) => r.user_id === userId && r.response === 'in'),
  ).length;

  return (
    <div className="border p-3 space-y-2" style={{ borderColor: '#2E2519', background: '#0B0906' }}>
      <div className="flex items-center gap-2 text-[9px] tracking-[0.22em]" style={{ color: '#8A8F45' }}>
        <History className="w-3.5 h-3.5" /> YOUR RECORD OF LABOUR
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { k: 'TASKS COMPLETED', v: credited.length, c: '#8A8F45' },
          { k: 'PAID TO YOU', v: fmtAuec(totalPaid), c: '#E0A22E' },
          { k: 'MUSTERS STOOD', v: mustersAttended, c: '#6FA0C8' },
        ].map((s) => (
          <div key={s.k} className="border p-2" style={{ borderColor: '#2E2519', background: '#0C0A07' }}>
            <div className="text-[7px] tracking-[0.18em]" style={{ color: '#6B6155' }}>{s.k}</div>
            <div className="text-sm font-bold" style={{ color: s.c }}>{s.v}</div>
          </div>
        ))}
      </div>
      {credited.length === 0 ? (
        <p className="text-[9px] py-3 text-center" style={{ color: '#6B6155' }}>
          No credited work yet — your record starts with the first task you finish.
        </p>
      ) : (
        <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
          {credited.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-2 border-b pb-1" style={{ borderColor: '#1E1913' }}>
              <div className="min-w-0">
                <div className="text-[9px] truncate" style={{ color: '#EDE5D6' }}>{t.title}</div>
                <div className="text-[8px]" style={{ color: '#6B6155' }}>
                  {t.reviewed_at ? new Date(t.reviewed_at).toLocaleDateString([], { dateStyle: 'medium' }) : '—'}
                  {t.review_notes ? ` · ${t.review_notes}` : ''}
                </div>
              </div>
              <span className="text-[9px] font-bold shrink-0" style={{ color: '#8A8F45' }}>{fmtAuec(t.credited_auec)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}