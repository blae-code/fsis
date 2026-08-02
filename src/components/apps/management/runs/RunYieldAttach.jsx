import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { attachToSession } from '@/functions/attachToSession';
import { Loader2, Link2 } from 'lucide-react';

const box = { borderColor: '#3A2F20', background: '#0C0A07', color: '#EDE5D6' };

const TYPES = [
  { value: 'cargo_lot', label: 'CARGO LOTS', name: (r) => r.commodity_name || r.lot_code || r.id },
  { value: 'loot_item', label: 'LOOT ITEMS', name: (r) => r.item_name || r.name || r.id },
  { value: 'salvage_scan', label: 'SCANS', name: (r) => r.cluster_name || r.scan_label || r.location || r.id },
];

/** Tie what the run produced to the run that produced it — so a muster is judged on fact, not on how it felt. */
export default function RunYieldAttach({ sessionId, queryKey }) {
  const qc = useQueryClient();
  const [type, setType] = useState('cargo_lot');
  const [picked, setPicked] = useState([]);
  const meta = TYPES.find((t) => t.value === type);

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['attachable', type],
    queryFn: () => base44.entities[type].list('-created_date', 50),
  });
  const unattached = records.filter((r) => !r.operation_session_id);

  const attach = useMutation({
    mutationFn: () => attachToSession({ session_id: sessionId, record_type: type, record_ids: picked }),
    onSuccess: () => {
      setPicked([]);
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: ['attachable', type] });
    },
  });

  const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <div className="border p-2 space-y-2" style={{ borderColor: '#2E2519', background: '#0C0A07' }}>
      <div className="flex items-center justify-between gap-2">
        <div className="text-[7px] font-bold tracking-[0.2em]" style={{ color: '#6B6155' }}>ATTACH YIELD TO THE RUN</div>
        <select value={type} onChange={(e) => { setType(e.target.value); setPicked([]); }} className="h-7 border px-2 text-[8px]" style={box}>
          {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-3"><Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: '#E0A22E' }} /></div>
      ) : unattached.length === 0 ? (
        <p className="text-[8px]" style={{ color: '#6B6155' }}>Nothing recent of this kind is floating free of a run.</p>
      ) : (
        <div className="border divide-y max-h-40 overflow-auto" style={{ borderColor: '#241C12' }}>
          {unattached.map((r) => (
            <label key={r.id} className="flex items-center gap-2 px-2 py-1 cursor-pointer" style={{ borderColor: '#1C1610' }}>
              <input type="checkbox" checked={picked.includes(r.id)} onChange={() => toggle(r.id)} />
              <span className="text-[8px] truncate" style={{ color: '#C6BCAB' }}>{meta.name(r)}</span>
              <span className="text-[7px] ml-auto shrink-0" style={{ color: '#6B6155' }}>
                {r.created_date ? new Date(r.created_date).toLocaleDateString() : ''}
              </span>
            </label>
          ))}
        </div>
      )}
      {attach.error && <p className="text-[8px]" style={{ color: '#D08A6A' }}>{attach.error?.response?.data?.error || attach.error.message}</p>}
      <button
        onClick={() => attach.mutate()}
        disabled={attach.isPending || picked.length === 0}
        className="h-7 px-3 border text-[7px] font-bold tracking-[0.14em] inline-flex items-center gap-1 disabled:opacity-40"
        style={{ borderColor: '#3A2F20', color: '#C8A05B', background: '#120D08' }}
      >
        {attach.isPending ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Link2 className="w-2.5 h-2.5" />} ATTACH {picked.length || ''} TO THE RUN
      </button>
    </div>
  );
}