import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { markSessionPresence } from '@/functions/markSessionPresence';
import { getSessionSummary } from '@/functions/getSessionSummary';
import { Loader2, Radio, X } from 'lucide-react';
import { RUN_STATUS_META } from '@/components/runs/runMeta';
import BoardSection from '@/components/work/BoardSection';
import BoardEmpty from '@/components/work/BoardEmpty';
import RunSummary from '@/components/runs/RunSummary';

/**
 * Runs this comrade stood — each one readable in full, because a comrade who gave four hours to a run
 * is owed the same account of it as the person who called it.
 */
export default function MyRunsPanel({ userId }) {
  const qc = useQueryClient();
  const [openId, setOpenId] = useState(null);

  // Row-level security scopes this to runs the caller actually stood (plus council).
  const { data: sessions = [] } = useQuery({
    queryKey: ['my_runs'],
    queryFn: () => base44.entities.operation_session.list('-started_at', 30),
    refetchInterval: 30000,
  });

  const summaryKey = ['my_run_summary', openId];
  const { data: summary } = useQuery({
    queryKey: summaryKey,
    queryFn: () => getSessionSummary({ session_id: openId }).then((r) => r.data),
    enabled: !!openId,
    refetchInterval: 20000,
  });

  const presence = useMutation({
    mutationFn: (p) => markSessionPresence(p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my_runs'] });
      qc.invalidateQueries({ queryKey: summaryKey });
    },
  });

  if (sessions.length === 0) return null;

  return (
    <BoardSection eyebrow="RUNS YOU STOOD" accent="#8A8F45" count={sessions.length}>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-2">
        {sessions.map((s) => {
          const meta = RUN_STATUS_META[s.status] || RUN_STATUS_META.underway;
          const myOpenStint = (s.attendance || []).some((st) => st.user_id === userId && !st.left_at);
          return (
            <div key={s.id} className="border p-2 space-y-1.5" style={{ borderColor: '#2E2519', background: '#0C0A07' }}>
              <div className="flex items-start justify-between gap-2">
                <div className="text-[10px] truncate" style={{ color: '#EDE5D6' }}>{s.session_name}</div>
                <span className="text-[7px] font-bold tracking-[0.12em] shrink-0 inline-flex items-center gap-1" style={{ color: meta.color }}>
                  {s.status === 'underway' && <Radio className="w-2.5 h-2.5 animate-pulse" />} {meta.label}
                </span>
              </div>
              <div className="text-[8px]" style={{ color: '#6B6155' }}>
                {s.started_at ? new Date(s.started_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : ''}
              </div>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setOpenId(s.id)}
                  className="h-7 px-2 border text-[7px] font-bold tracking-[0.12em]"
                  style={{ borderColor: '#3A2F20', color: '#C8A05B', background: '#120D08' }}
                >
                  READ THE RUN
                </button>
                {s.status === 'underway' && (
                  <button
                    disabled={presence.isPending}
                    onClick={() => presence.mutate({ session_id: s.id, action: myOpenStint ? 'leave' : 'join' })}
                    className="h-7 px-2 border text-[7px] font-bold tracking-[0.12em] disabled:opacity-40"
                    style={{ borderColor: myOpenStint ? '#5C302A' : '#2E3A20', color: myOpenStint ? '#D08A6A' : '#8A8F45', background: '#0A0806' }}
                  >
                    {presence.isPending ? '…' : myOpenStint ? 'STEP OFF' : 'I AM BACK ON'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {presence.error && (
        <p className="text-[9px] mt-2" style={{ color: '#D08A6A' }}>
          {presence.error?.response?.data?.error || presence.error.message}
        </p>
      )}

      {openId && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-auto" style={{ background: 'rgba(4,3,2,0.86)' }}>
          <div className="w-full max-w-2xl border my-4" style={{ borderColor: '#3A2F20', background: '#0A0806' }}>
            <div className="flex items-center justify-between gap-2 px-3 py-2 border-b" style={{ borderColor: '#241C12' }}>
              <div className="text-[9px] tracking-[0.22em]" style={{ color: '#8A8F45' }}>THE RUN, READ WHOLE</div>
              <button onClick={() => setOpenId(null)} className="h-7 w-7 border inline-flex items-center justify-center" style={{ borderColor: '#2E2519', color: '#8A7E6C' }}>
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="p-3 font-mono">
              {!summary ? (
                <div className="flex justify-center py-8"><Loader2 className="w-4 h-4 animate-spin" style={{ color: '#E0A22E' }} /></div>
              ) : (
                <RunSummary data={summary} council={false} queryKey={summaryKey} />
              )}
            </div>
          </div>
        </div>
      )}
    </BoardSection>
  );
}