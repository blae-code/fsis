import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { getSessionSummary } from '@/functions/getSessionSummary';
import { Loader2, Radio } from 'lucide-react';
import { RUN_STATUS_META } from '@/components/runs/runMeta';
import RunStartForm from '@/components/apps/management/runs/RunStartForm';
import RunPresencePanel from '@/components/apps/management/runs/RunPresencePanel';
import RunCostsEditor from '@/components/apps/management/runs/RunCostsEditor';
import RunLossForm from '@/components/apps/management/runs/RunLossForm';
import RunYieldAttach from '@/components/apps/management/runs/RunYieldAttach';
import RunCloseForm from '@/components/apps/management/runs/RunCloseForm';
import RunSummary from '@/components/runs/RunSummary';

/** The live-run console: the run itself, as distinct from the notice that called it. */
export default function RunConsole() {
  const [selectedId, setSelectedId] = useState(null);

  const { data: me } = useQuery({ queryKey: ['user'], queryFn: () => base44.auth.me() });
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['run_sessions'],
    queryFn: () => base44.entities.operation_session.list('-started_at', 60),
    refetchInterval: 30000,
  });

  const summaryKey = ['run_summary', selectedId];
  const { data: summary } = useQuery({
    queryKey: summaryKey,
    queryFn: () => getSessionSummary({ session_id: selectedId }).then((r) => r.data),
    enabled: !!selectedId,
    refetchInterval: 15000, // the roster accrues against the clock — poll it
  });

  const selected = sessions.find((s) => s.id === selectedId);
  const underway = summary?.session?.status === 'underway';

  return (
    <div className="p-4 space-y-3 font-mono">
      <RunStartForm onStarted={(s) => setSelectedId(s.id)} />

      {isLoading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin" style={{ color: '#E0A22E' }} /></div>
      ) : sessions.length === 0 ? (
        <p className="text-[9px] py-4 text-center border" style={{ color: '#6B6155', borderColor: '#2E2519' }}>
          No runs on record yet. The first one you open will appear here.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {sessions.map((s) => {
            const meta = RUN_STATUS_META[s.status] || RUN_STATUS_META.underway;
            const active = s.id === selectedId;
            return (
              <button
                key={s.id}
                onClick={() => setSelectedId(active ? null : s.id)}
                className="px-2.5 py-1.5 border text-[8px] font-bold tracking-[0.1em] inline-flex items-center gap-1.5"
                style={{
                  borderColor: active ? '#E0A22E' : '#2E2519',
                  color: active ? '#E0A22E' : '#A89C8A',
                  background: active ? '#E0A22E14' : '#0C0A07',
                }}
              >
                {s.status === 'underway' && <Radio className="w-2.5 h-2.5 animate-pulse" style={{ color: '#8A8F45' }} />}
                {s.session_name}
                <span style={{ color: meta.color }}>· {meta.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {selectedId && !summary && (
        <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin" style={{ color: '#E0A22E' }} /></div>
      )}

      {summary && selected && (
        <div className="space-y-3 border p-3" style={{ borderColor: '#3A2F20', background: '#0A0806' }}>
          {underway && (
            <>
              <RunPresencePanel session={selected} roster={summary.roster} me={me} queryKey={summaryKey} />
              <RunYieldAttach sessionId={selectedId} queryKey={summaryKey} />
              <div className="grid lg:grid-cols-2 gap-2">
                <RunCostsEditor session={selected} queryKey={summaryKey} />
                <RunLossForm sessionId={selectedId} queryKey={summaryKey} />
              </div>
              <RunCloseForm
                sessionId={selectedId}
                suggestedGross={summary.yield?.suggested_gross_auec}
                basis={summary.yield?.basis}
                queryKey={summaryKey}
              />
              <div className="border-t pt-3" style={{ borderColor: '#241C12' }}>
                <div className="text-[7px] font-bold tracking-[0.2em] mb-2" style={{ color: '#6B6155' }}>
                  THE RUN SO FAR — WHAT EVERY HAND ON IT CAN ALSO READ
                </div>
                <RunSummary data={summary} council queryKey={summaryKey} />
              </div>
            </>
          )}
          {!underway && <RunSummary data={summary} council queryKey={summaryKey} />}
        </div>
      )}
    </div>
  );
}