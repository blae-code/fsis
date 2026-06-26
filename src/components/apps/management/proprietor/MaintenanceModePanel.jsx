import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export default function MaintenanceModePanel() {
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery({ queryKey: ['store_status'], queryFn: () => base44.entities.store_status.list('-updated_date', 5) });
  const status = rows.find((r) => r.setting_key === 'primary') || rows[0];
  const [message, setMessage] = useState('');
  useEffect(() => { setMessage(status?.public_message || 'Orders are temporarily paused while FSIS performs inventory and route checks.'); }, [status?.id]);
  const save = useMutation({ mutationFn: async (patch) => status?.id ? base44.entities.store_status.update(status.id, patch) : base44.entities.store_status.create({ setting_key: 'primary', ...patch }), onSuccess: () => { qc.invalidateQueries({ queryKey: ['store_status'] }); qc.invalidateQueries({ queryKey: ['store_status_public'] }); } });
  const paused = status?.maintenance_mode || status?.orders_paused;
  return (
    <section className="border p-3 space-y-3" style={{ borderColor: paused ? '#8A3A2E' : '#5C4424', background: '#120D08' }}>
      <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-[9px] tracking-[0.24em]" style={{ color: '#E0A22E' }}>MAINTENANCE MODE</p><p className="text-[9px]" style={{ color: '#8A7E6C' }}>Pause buyer orders while keeping the storefront visible.</p></div><button disabled={save.isPending} onClick={() => save.mutate({ maintenance_mode: !paused, orders_paused: !paused, public_message: message })} className="border px-3 py-2 text-[9px] disabled:opacity-40" style={{ borderColor: paused ? '#8A8F45' : '#C05050', color: paused ? '#8A8F45' : '#C05050' }}>{paused ? 'RESUME ORDERS' : 'PAUSE ORDERS'}</button></div>
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} className="w-full h-16 bg-transparent border p-2 text-[10px]" style={{ borderColor: '#3A2F20', color: '#D8CFC0' }} />
      <button disabled={save.isPending} onClick={() => save.mutate({ public_message: message, maintenance_mode: Boolean(paused), orders_paused: Boolean(paused) })} className="border px-3 py-2 text-[9px] disabled:opacity-40" style={{ borderColor: '#5C4424', color: '#D8CFC0' }}>SAVE PUBLIC MESSAGE</button>
    </section>
  );
}