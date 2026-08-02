import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Repeat, Loader2, Save } from 'lucide-react';

const box = { borderColor: '#3A2F20', background: '#0C0A07', color: '#EDE5D6' };

/**
 * Keeps a muster already on the calendar as a standing run.
 *
 * A run that worked should not have to be retyped from memory next week — its terms are lifted
 * straight off the operation as it was actually called, including the places it asked for.
 */
export default function SaveOperationAsTemplate({ op, actorEmail }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(op.op_name || '');

  const starts = op.starts_at ? new Date(op.starts_at) : null;
  const weekday = starts ? starts.getDay() : 6;
  const time = starts
    ? `${String(starts.getHours()).padStart(2, '0')}:${String(starts.getMinutes()).padStart(2, '0')}`
    : '20:00';

  const save = useMutation({
    mutationFn: () => base44.entities.operation_template.create({
      template_name: name.trim(),
      op_name: op.op_name,
      brief: op.brief || '',
      op_type: op.op_type,
      duration_hours: Number(op.duration_hours) || 0,
      muster_location: op.muster_location || '',
      ship: op.ship || '',
      crew_needed: Number(op.crew_needed) || 0,
      roles_wanted: op.roles_wanted || '',
      role_slots: op.role_slots || [],
      pay_basis: op.pay_basis,
      flat_credit_auec: Math.max(0, Number(op.flat_credit_auec) || 0),
      weekday,
      time_of_day: time,
      active: true,
      created_by_email: actorEmail || '',
    }),
    onSuccess: () => {
      setOpen(false);
      qc.invalidateQueries({ queryKey: ['operation_templates'] });
    },
  });

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="h-7 px-2 border text-[7px] font-bold tracking-[0.12em] inline-flex items-center gap-1"
        style={{ borderColor: '#4A3A22', color: '#C8A05B', background: '#14100A' }}
      >
        <Repeat className="w-2.5 h-2.5" /> KEEP AS STANDING RUN
      </button>
    );
  }

  return (
    <div className="space-y-1 border p-1.5" style={{ borderColor: '#4A3A22', background: '#14100A' }}>
      <p className="text-[8px]" style={{ color: '#8A7E6C' }}>
        Kept as EVERY {['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][weekday]} {time}.
      </p>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name this standing run"
        className="h-8 w-full border px-2 text-[9px]"
        style={box}
      />
      {save.error && <p className="text-[8px]" style={{ color: '#D08A6A' }}>{save.error.message}</p>}
      <div className="flex gap-1">
        <button
          disabled={save.isPending || !name.trim()}
          onClick={() => save.mutate()}
          className="h-7 flex-1 border text-[7px] font-bold tracking-[0.12em] inline-flex items-center justify-center gap-1 disabled:opacity-40"
          style={{ borderColor: '#E0A22E', color: '#0C0A07', background: 'linear-gradient(135deg, #E0A22E, #C8893B)' }}
        >
          {save.isPending ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Save className="w-2.5 h-2.5" />} KEEP
        </button>
        <button
          onClick={() => setOpen(false)}
          className="h-7 px-2 border text-[7px] font-bold tracking-[0.12em]"
          style={{ borderColor: '#3A2F20', color: '#8A7E6C', background: '#120D08' }}
        >
          CANCEL
        </button>
      </div>
    </div>
  );
}