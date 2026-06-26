import React from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

const color = { error: '#C05050', warning: '#E0A22E', info: '#8A8F45' };

export default function DebugLogPanel() {
  const qc = useQueryClient();
  const { data: logs = [] } = useQuery({ queryKey: ['debug_logs'], queryFn: () => base44.entities.debug_log.list('-created_date', 80) });
  const resolve = useMutation({ mutationFn: (log) => base44.entities.debug_log.update(log.id, { resolved: true, resolved_at: new Date().toISOString() }), onSuccess: () => qc.invalidateQueries({ queryKey: ['debug_logs'] }) });
  const open = logs.filter((l) => !l.resolved);
  const copy = () => navigator.clipboard?.writeText(JSON.stringify(logs.slice(0, 25), null, 2));
  return (
    <section className="border p-3 space-y-3" style={{ borderColor: '#5C4424', background: '#120D08' }}>
      <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-[9px] tracking-[0.24em]" style={{ color: '#E0A22E' }}>IN-APP DEBUG LOG</p><p className="text-[9px]" style={{ color: '#8A7E6C' }}>{open.length} unresolved diagnostics · latest {logs.length} captured</p></div><button onClick={copy} className="border px-3 py-2 text-[9px]" style={{ borderColor: '#5C4424', color: '#D8CFC0' }}>COPY DIAGNOSTICS</button></div>
      <div className="grid xl:grid-cols-2 gap-2 max-h-72 overflow-auto">
        {logs.length ? logs.map((log) => <div key={log.id} className="border p-3" style={{ borderColor: log.resolved ? '#2A2118' : color[log.severity] || '#5C4424', background: '#0A0806' }}><div className="flex justify-between gap-2"><b className="text-[9px]" style={{ color: color[log.severity] || '#D8CFC0' }}>{log.severity || 'error'} · {log.source || 'unknown'}</b><span className="text-[8px]" style={{ color: '#7A6E60' }}>{log.route}</span></div><p className="text-[9px] mt-2" style={{ color: '#CFC4B4' }}>{log.message}</p>{log.stack && <details className="mt-2"><summary className="text-[8px] cursor-pointer" style={{ color: '#7A6E60' }}>Stack trace</summary><pre className="text-[8px] whitespace-pre-wrap mt-1" style={{ color: '#8A7E6C' }}>{log.stack.slice(0, 900)}</pre></details>} {!log.resolved && <button disabled={resolve.isPending} onClick={() => resolve.mutate(log)} className="border px-2 py-1 mt-2 text-[8px]" style={{ borderColor: '#8A8F45', color: '#8A8F45' }}>MARK RESOLVED</button>}</div>) : <p className="text-[10px]" style={{ color: '#8A8F45' }}>No diagnostics captured yet.</p>}
      </div>
    </section>
  );
}