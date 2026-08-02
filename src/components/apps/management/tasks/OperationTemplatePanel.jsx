import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Repeat, Loader2, Save } from 'lucide-react';
import OperationTemplateRow from '@/components/apps/management/tasks/OperationTemplateRow';
import { WEEKDAYS, operationFromTemplate } from '@/lib/operationTemplates';

const box = { borderColor: '#3A2F20', background: '#0C0A07', color: '#EDE5D6' };

/**
 * Standing runs: the weekly muster written once and called again.
 *
 * The terms live in one place, so a comrade comparing this week's board to last week's can tell
 * whether the work changed or only somebody's memory of it did.
 */
export default function OperationTemplatePanel({ draft, actorEmail }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [weekday, setWeekday] = useState(6);
  const [time, setTime] = useState('20:00');

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['operation_templates'],
    queryFn: () => base44.entities.operation_template.list('-created_date', 60),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['operation_templates'] });

  const save = useMutation({
    mutationFn: () => base44.entities.operation_template.create({
      template_name: name.trim(),
      op_name: (draft.op_name || name).trim(),
      brief: (draft.brief || '').trim(),
      op_type: draft.op_type,
      duration_hours: Number(draft.duration_hours) || 0,
      muster_location: (draft.muster_location || '').trim(),
      ship: (draft.ship || '').trim(),
      crew_needed: Number(draft.crew_needed) || 0,
      roles_wanted: (draft.roles_wanted || '').trim(),
      pay_basis: draft.pay_basis,
      flat_credit_auec: Math.max(0, Number(draft.flat_credit_auec) || 0),
      weekday: Number(weekday),
      time_of_day: time,
      active: true,
      created_by_email: actorEmail || '',
    }),
    onSuccess: () => { setName(''); invalidate(); },
  });

  const call = useMutation({
    mutationFn: async (tpl) => {
      await base44.entities.crew_operation.create(operationFromTemplate(tpl, actorEmail));
      await base44.entities.operation_template.update(tpl.id, {
        times_called: (Number(tpl.times_called) || 0) + 1,
        last_called_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: ['crew_operations'] });
      qc.invalidateQueries({ queryKey: ['work_board_operations'] });
    },
  });

  const toggle = useMutation({
    mutationFn: (tpl) => base44.entities.operation_template.update(tpl.id, { active: tpl.active === false }),
    onSuccess: invalidate,
  });

  const error = save.error || call.error || toggle.error;

  return (
    <div className="border p-3 space-y-2" style={{ borderColor: '#3A2F20', background: 'linear-gradient(180deg, #100D09, #0B0906)' }}>
      <div className="flex items-center gap-2 text-[9px] tracking-[0.22em]" style={{ color: '#C8A05B' }}>
        <Repeat className="w-3.5 h-3.5" /> STANDING RUNS
      </div>
      <p className="text-[9px] leading-relaxed" style={{ color: '#8A7E6C' }}>
        Fill in the muster above, then keep it here as a standing run. One tap puts it on the calendar at its next
        occurrence — the same hull, the same hands, the same pay, week after week.
      </p>

      <div className="grid sm:grid-cols-4 gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name this standing run" className="h-9 border px-2 text-[10px] sm:col-span-2" style={box} />
        <select value={weekday} onChange={(e) => setWeekday(e.target.value)} className="h-9 border px-2 text-[10px]" style={box}>
          {WEEKDAYS.map((d, i) => <option key={d} value={i}>EVERY {d}</option>)}
        </select>
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-9 border px-2 text-[10px]" style={box} />
      </div>

      {error && <p className="text-[9px]" style={{ color: '#D08A6A' }}>{error.message}</p>}

      <button
        onClick={() => save.mutate()}
        disabled={save.isPending || !name.trim() || !(draft.op_name || '').trim()}
        className="h-9 px-4 border text-[9px] font-bold tracking-[0.14em] inline-flex items-center gap-2 disabled:opacity-40"
        style={{ borderColor: '#4A3A22', color: '#E0A22E', background: '#14100A' }}
      >
        {save.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} KEEP AS A STANDING RUN
      </button>

      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin" style={{ color: '#E0A22E' }} /></div>
      ) : templates.length === 0 ? (
        <p className="text-[9px] py-3 text-center border" style={{ color: '#6B6155', borderColor: '#241C12' }}>
          No standing runs written yet.
        </p>
      ) : (
        <div className="grid md:grid-cols-2 gap-2">
          {templates.map((tpl) => (
            <OperationTemplateRow
              key={tpl.id}
              tpl={tpl}
              pending={call.isPending || toggle.isPending}
              onCall={(t) => call.mutate(t)}
              onToggle={(t) => toggle.mutate(t)}
            />
          ))}
        </div>
      )}
    </div>
  );
}