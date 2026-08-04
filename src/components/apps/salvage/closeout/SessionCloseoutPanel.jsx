import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, Flag, AlertCircle } from 'lucide-react';
import SessionCloseoutCard from '@/components/apps/salvage/closeout/SessionCloseoutCard';
import { closeoutSummary, ACTIVE_STATUSES, CODES, FIELD } from '@/components/apps/salvage/closeout/sessionCloseout';

const AMBER = '#E0A22E';
const DIM = '#7A6E60';
const PANEL = { background: '#111009', borderColor: '#2A2118' };

/** Call a run finished and get its account of itself in the same breath. */
export default function SessionCloseoutPanel({ bestPrices = {} }) {
  const qc = useQueryClient();
  const [finished, setFinished] = useState(null);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['salvage_sessions_closeout'],
    queryFn: () => base44.entities.salvage_session.list('-updated_date', 100),
  });

  const close = useMutation({
    // The estimate is written onto the run as it is closed, so the figure shown at closeout is the
    // one every later report reads back — a value that drifts with the market afterwards would make
    // the summary a different document every time it was opened.
    mutationFn: ({ session, summary }) => base44.entities.salvage_session.update(session.id, {
      status: 'sold',
      estimated_value: summary.total,
    }),
    onSuccess: (_r, { session, summary }) => {
      setFinished({ session, summary });
      qc.invalidateQueries({ queryKey: ['salvage_sessions_closeout'] });
      qc.invalidateQueries({ queryKey: ['salvage_sessions'] });
      qc.invalidateQueries({ queryKey: ['salvage_sessions_inventory'] });
    },
  });

  const active = useMemo(() => sessions.filter((s) => ACTIVE_STATUSES.includes(s.status)), [sessions]);

  if (isLoading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin" style={{ color: AMBER }} /></div>;
  }

  return (
    <div className="p-4 space-y-3 font-mono">
      <div className="flex items-center gap-2 text-[9px] tracking-[0.22em] font-bold" style={{ color: AMBER }}>
        <Flag className="w-3.5 h-3.5" /> RUN CLOSEOUT — {active.length} RUN{active.length === 1 ? '' : 'S'} STILL OPEN
      </div>

      {close.error && (
        <p className="border p-2 text-[9px]" style={{ borderColor: '#5C302A', color: '#D08A6A', background: '#140B08' }}>
          {close.error.message}
        </p>
      )}

      {finished && <SessionCloseoutCard session={finished.session} summary={finished.summary} />}

      {active.length === 0 ? (
        <div className="border p-6 text-center" style={PANEL}>
          <AlertCircle className="w-5 h-5 mx-auto mb-2" style={{ color: DIM }} />
          <p className="text-[10px]" style={{ color: DIM }}>No open salvage runs to close out.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {active.map((s) => {
            const summary = closeoutSummary(s, bestPrices);
            return (
              <div key={s.id} className="border flex items-center gap-3 px-2.5 py-2" style={PANEL}>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] truncate" style={{ color: '#D8CFC0' }}>{s.session_name}</div>
                  <div className="text-[9px]" style={{ color: DIM }}>
                    {s.ship || 'Unknown ship'} · {(s.status || '').toUpperCase()}{s.location ? ` · ${s.location}` : ''}
                  </div>
                </div>
                <div className="flex gap-3 shrink-0">
                  {CODES.map((code) => (
                    <div key={code} className="text-right">
                      <div className="text-[8px]" style={{ color: '#3A3028' }}>{code}</div>
                      <div className="text-[11px] font-bold" style={{ color: (s[FIELD[code]] || 0) > 0 ? AMBER : '#3A3028' }}>
                        {(s[FIELD[code]] || 0).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-right shrink-0 w-24">
                  <div className="text-[8px]" style={{ color: '#3A3028' }}>EST. VALUE</div>
                  <div className="text-[11px] font-bold" style={{ color: '#6FA08F' }}>
                    {summary.total > 0 ? `${summary.total.toLocaleString()}` : '—'}
                  </div>
                </div>
                <button
                  onClick={() => close.mutate({ session: s, summary })}
                  disabled={close.isPending}
                  className="h-8 px-3 border text-[9px] font-bold tracking-[0.14em] shrink-0 inline-flex items-center gap-1.5 disabled:opacity-40"
                  style={{ borderColor: AMBER, color: '#0C0A07', background: 'linear-gradient(135deg,#E0A22E,#C8893B)' }}
                >
                  {close.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Flag className="w-3 h-3" />} MARK FINISHED
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}