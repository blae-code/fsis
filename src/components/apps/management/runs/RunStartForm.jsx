import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { startOperationSession } from '@/functions/startOperationSession';
import { Loader2, Play } from 'lucide-react';

const box = { borderColor: '#3A2F20', background: '#0C0A07', color: '#EDE5D6' };
const OP_TYPES = ['salvage', 'hauling', 'escort', 'mining', 'recovery', 'other'];

/** Open a run — from a called muster, or from nothing at all. Ad-hoc runs are first-class. */
export default function RunStartForm({ onStarted }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [opType, setOpType] = useState('salvage');
  const [operationId, setOperationId] = useState('');

  const { data: musters = [] } = useQuery({
    queryKey: ['startable_musters'],
    queryFn: () => base44.entities.crew_operation.filter({ status: { $in: ['scheduled', 'mustering'] } }, '-starts_at', 30),
  });

  const start = useMutation({
    mutationFn: () => startOperationSession({
      ...(operationId ? { operation_id: operationId } : {}),
      ...(name.trim() ? { session_name: name.trim() } : {}),
      op_type: opType,
    }).then((r) => r.data),
    onSuccess: (d) => {
      setName('');
      setOperationId('');
      qc.invalidateQueries({ queryKey: ['run_sessions'] });
      onStarted?.(d.session);
    },
  });

  const err = start.error?.response?.data;

  return (
    <div className="border p-3 space-y-2" style={{ borderColor: '#5C4424', background: 'linear-gradient(180deg, #14100B, #0B0906)' }}>
      <div className="flex items-center gap-2 text-[9px] tracking-[0.22em]" style={{ color: '#E0A22E' }}>
        <Play className="w-3.5 h-3.5" /> OPEN A RUN
      </div>
      <p className="text-[9px] leading-relaxed" style={{ color: '#8A7E6C' }}>
        RSVP is intent; attendance is fact; and only fact pays people. Open the run when it actually
        begins — from a called muster or from nothing, since "I am going out now, who is on?" is a run
        before it is ever a notice.
      </p>
      <div className="grid sm:grid-cols-3 gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="What the run is called" className="h-9 border px-2 text-[10px]" style={box} />
        <select value={operationId} onChange={(e) => setOperationId(e.target.value)} className="h-9 border px-2 text-[10px]" style={box}>
          <option value="">NO MUSTER — AD-HOC RUN</option>
          {musters.map((op) => <option key={op.id} value={op.id}>{op.op_name}</option>)}
        </select>
        <select value={opType} onChange={(e) => setOpType(e.target.value)} className="h-9 border px-2 text-[10px]" style={box}>
          {OP_TYPES.map((t) => <option key={t} value={t}>{t.toUpperCase()}</option>)}
        </select>
      </div>
      {err?.error && (
        <p className="text-[9px] leading-relaxed" style={{ color: '#D08A6A' }}>
          {err.error}{err.session_id ? ' Open that run below instead.' : ''}
        </p>
      )}
      <button
        onClick={() => start.mutate()}
        disabled={start.isPending || (!name.trim() && !operationId)}
        className="h-9 px-4 border text-[9px] font-bold tracking-[0.14em] inline-flex items-center gap-2 disabled:opacity-40"
        style={{ borderColor: '#E0A22E', color: '#0C0A07', background: 'linear-gradient(135deg, #E0A22E, #C8893B)' }}
      >
        {start.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />} THE RUN IS ON
      </button>
    </div>
  );
}