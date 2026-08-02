import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarPlus, Users, Loader2 } from 'lucide-react';
import { fmtAuec } from '@/components/apps/management/tasks/taskMeta';
import OperationTemplatePanel from '@/components/apps/management/tasks/OperationTemplatePanel';
import SaveOperationAsTemplate from '@/components/apps/management/tasks/SaveOperationAsTemplate';

const box = { borderColor: '#3A2F20', background: '#0C0A07', color: '#EDE5D6' };
const EMPTY = { op_name: '', brief: '', op_type: 'salvage', starts_at: '', duration_hours: 2, muster_location: '', ship: '', crew_needed: 2, roles_wanted: '', pay_basis: 'shares', flat_credit_auec: '' };
const STATUSES = ['scheduled', 'mustering', 'underway', 'completed', 'stood_down'];

/** Council scheduling of musters, and the answers that come back from the crew. */
export default function OperationScheduleConsole({ actorEmail }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const { data: ops = [], isLoading } = useQuery({
    queryKey: ['crew_operations'],
    queryFn: () => base44.entities.crew_operation.list('-starts_at', 100),
    refetchInterval: 30000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['crew_operations'] });
  const post = useMutation({
    mutationFn: () => base44.entities.crew_operation.create({
      op_name: form.op_name.trim(),
      brief: form.brief.trim(),
      op_type: form.op_type,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : undefined,
      duration_hours: Number(form.duration_hours) || 0,
      muster_location: form.muster_location.trim(),
      ship: form.ship.trim(),
      crew_needed: Number(form.crew_needed) || 0,
      roles_wanted: form.roles_wanted.trim(),
      pay_basis: form.pay_basis,
      flat_credit_auec: Math.max(0, Number(form.flat_credit_auec) || 0),
      status: 'scheduled',
      posted_by_email: actorEmail || '',
    }),
    onSuccess: () => { setForm(EMPTY); invalidate(); },
  });
  const patch = useMutation({ mutationFn: ({ id, data }) => base44.entities.crew_operation.update(id, data), onSuccess: invalidate });

  return (
    <div className="space-y-3">
      <div className="border p-3 space-y-2" style={{ borderColor: '#5C4424', background: 'linear-gradient(180deg, #14100B, #0B0906)' }}>
        <div className="flex items-center gap-2 text-[9px] tracking-[0.22em]" style={{ color: '#E0A22E' }}>
          <CalendarPlus className="w-3.5 h-3.5" /> CALL A MUSTER
        </div>
        <p className="text-[9px] leading-relaxed" style={{ color: '#8A7E6C' }}>
          State the time, the hull and the hands needed. Comrades answer freely — attendance is volunteered,
          never assigned. Share-based ops feed the pay day pool; direct-paid ops settle in full on the day.
        </p>
        <div className="grid sm:grid-cols-2 gap-2">
          <input value={form.op_name} onChange={(e) => set('op_name', e.target.value)} placeholder="Operation name" className="h-9 border px-2 text-[10px] sm:col-span-2" style={box} />
          <textarea value={form.brief} onChange={(e) => set('brief', e.target.value)} rows={2} placeholder="Brief — what it involves, what to bring" className="border px-2 py-1.5 text-[10px] sm:col-span-2" style={box} />
          <input type="datetime-local" value={form.starts_at} onChange={(e) => set('starts_at', e.target.value)} className="h-9 border px-2 text-[10px]" style={box} />
          <input type="number" min="0" step="0.5" value={form.duration_hours} onChange={(e) => set('duration_hours', e.target.value)} placeholder="Hours" className="h-9 border px-2 text-[10px]" style={box} />
          <input value={form.muster_location} onChange={(e) => set('muster_location', e.target.value)} placeholder="Muster location" className="h-9 border px-2 text-[10px]" style={box} />
          <input value={form.ship} onChange={(e) => set('ship', e.target.value)} placeholder="Primary hull" className="h-9 border px-2 text-[10px]" style={box} />
          <input type="number" min="0" value={form.crew_needed} onChange={(e) => set('crew_needed', e.target.value)} placeholder="Hands needed" className="h-9 border px-2 text-[10px]" style={box} />
          <input value={form.roles_wanted} onChange={(e) => set('roles_wanted', e.target.value)} placeholder="Roles wanted" className="h-9 border px-2 text-[10px]" style={box} />
          <select value={form.pay_basis} onChange={(e) => set('pay_basis', e.target.value)} className="h-9 border px-2 text-[10px]" style={box}>
            <option value="shares">PAID IN SHARES</option>
            <option value="flat_credit">PAID DIRECTLY</option>
          </select>
          <input type="number" min="0" value={form.flat_credit_auec} onChange={(e) => set('flat_credit_auec', e.target.value)} placeholder="Direct sum per hand (aUEC)" className="h-9 border px-2 text-[10px]" style={box} />
        </div>
        {post.error && <p className="text-[9px]" style={{ color: '#D08A6A' }}>{post.error.message}</p>}
        <button
          onClick={() => post.mutate()}
          disabled={post.isPending || !form.op_name.trim()}
          className="h-9 px-4 border text-[9px] font-bold tracking-[0.14em] inline-flex items-center gap-2 disabled:opacity-40"
          style={{ borderColor: '#E0A22E', color: '#0C0A07', background: 'linear-gradient(135deg, #E0A22E, #C8893B)' }}
        >
          {post.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CalendarPlus className="w-3 h-3" />} CALL MUSTER
        </button>
      </div>

      <OperationTemplatePanel draft={form} actorEmail={actorEmail} />

      {isLoading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin" style={{ color: '#E0A22E' }} /></div>
      ) : ops.length === 0 ? (
        <p className="text-[9px] py-4 text-center border" style={{ color: '#6B6155', borderColor: '#2E2519' }}>No operations scheduled.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-2">
          {ops.map((op) => {
            const rsvps = op.rsvps || [];
            const inCount = rsvps.filter((r) => r.response === 'in').length;
            return (
              <div key={op.id} className="border p-2 space-y-1.5" style={{ borderColor: '#2E2519', background: '#0C0A07' }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[11px] truncate" style={{ color: '#EDE5D6' }}>{op.op_name}</div>
                    <div className="text-[8px]" style={{ color: '#6B6155' }}>
                      {op.starts_at ? new Date(op.starts_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'unscheduled'}
                      {op.muster_location ? ` · ${op.muster_location}` : ''}
                    </div>
                  </div>
                  <span className="text-[8px] shrink-0 flex items-center gap-1" style={{ color: inCount >= (op.crew_needed || 0) ? '#8A8F45' : '#C8893B' }}>
                    <Users className="w-2.5 h-2.5" /> {inCount}/{op.crew_needed || 0}
                  </span>
                </div>
                <div className="text-[8px]" style={{ color: op.pay_basis === 'shares' ? '#8A8F45' : '#C8893B' }}>
                  {op.pay_basis === 'shares' ? 'SHARES' : `DIRECT ${fmtAuec(op.flat_credit_auec)}/HAND`}
                </div>
                {rsvps.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {rsvps.map((r) => (
                      <span key={r.user_id} className="px-1.5 py-0.5 border text-[7px]" style={{ borderColor: '#2E2519', color: r.response === 'in' ? '#8A8F45' : r.response === 'maybe' ? '#C8893B' : '#6B6155' }}>
                        {r.handle} · {(r.response || '').toUpperCase()}{r.standing === 'contractor' ? ' (CONTRACTOR)' : ''}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex flex-wrap gap-1">
                  {STATUSES.filter((s) => s !== op.status).map((s) => (
                    <button
                      key={s}
                      disabled={patch.isPending}
                      onClick={() => patch.mutate({ id: op.id, data: { status: s } })}
                      className="px-2 py-1 border text-[7px] font-bold tracking-[0.12em] disabled:opacity-40"
                      style={{ borderColor: '#3A2F20', color: '#C8A05B', background: '#120D08' }}
                    >
                      {s.replace('_', ' ').toUpperCase()}
                    </button>
                  ))}
                </div>
                <SaveOperationAsTemplate op={op} actorEmail={actorEmail} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}