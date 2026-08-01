import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Loader2 } from 'lucide-react';
import CreditSuggestion from '@/components/apps/management/tasks/CreditSuggestion';

const box = { borderColor: '#3A2F20', background: '#0C0A07', color: '#EDE5D6' };
const CATEGORIES = ['salvage', 'hauling', 'escort', 'repair', 'intake', 'delivery', 'admin', 'other'];
const CADENCES = ['none', 'daily', 'weekly', 'fortnightly', 'monthly'];

const EMPTY = {
  template_name: '', title: '', brief: '', category: 'salvage', priority: 'routine',
  agreed_credit_auec: '', estimated_hours: '', hands_needed: '1', location: '', due_in_days: '7', cadence: 'none',
};

/** Write the terms once. A brief retyped from memory each week is how the terms quietly drift. */
export default function StandingBriefForm({ actorEmail }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = useMutation({
    mutationFn: () => base44.entities.task_template.create({
      template_name: form.template_name.trim(),
      title: form.title.trim() || form.template_name.trim(),
      brief: form.brief.trim(),
      category: form.category,
      priority: form.priority,
      agreed_credit_auec: Math.max(0, Number(form.agreed_credit_auec) || 0),
      ...(Number(form.estimated_hours) > 0 ? { estimated_hours: Number(form.estimated_hours) } : {}),
      hands_needed: Math.max(1, Number(form.hands_needed) || 1),
      location: form.location.trim(),
      due_in_days: Math.max(1, Number(form.due_in_days) || 7),
      cadence: form.cadence,
      active: true,
      created_by_email: actorEmail || '',
    }),
    onSuccess: () => { setForm(EMPTY); qc.invalidateQueries({ queryKey: ['task_templates'] }); },
  });

  return (
    <div className="border p-3 space-y-2" style={{ borderColor: '#3A2F20', background: '#0B0906' }}>
      <div className="flex items-center gap-2 text-[9px] tracking-[0.22em]" style={{ color: '#C8A05B' }}>
        <BookOpen className="w-3.5 h-3.5" /> WRITE A STANDING BRIEF
      </div>
      <p className="text-[9px] leading-relaxed" style={{ color: '#8A7E6C' }}>
        Terms held in one place where they can be read and argued with. A brief carries a span, not a deadline —
        each posting takes its dates from the day it goes up, and starts with nobody on it.
      </p>
      <div className="grid sm:grid-cols-2 gap-2">
        <input value={form.template_name} onChange={(e) => set('template_name', e.target.value)} placeholder="What the council calls this brief" className="h-9 border px-2 text-[10px]" style={box} />
        <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Title each posting carries" className="h-9 border px-2 text-[10px]" style={box} />
        <textarea value={form.brief} onChange={(e) => set('brief', e.target.value)} rows={2} placeholder="What the work involves" className="border px-2 py-1.5 text-[10px] sm:col-span-2" style={box} />
        <select value={form.category} onChange={(e) => set('category', e.target.value)} className="h-9 border px-2 text-[10px]" style={box}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c.toUpperCase()}</option>)}
        </select>
        <select value={form.priority} onChange={(e) => set('priority', e.target.value)} className="h-9 border px-2 text-[10px]" style={box}>
          <option value="routine">ROUTINE</option>
          <option value="elevated">ELEVATED</option>
          <option value="urgent">URGENT</option>
        </select>
        <input type="number" min="0" value={form.agreed_credit_auec} onChange={(e) => set('agreed_credit_auec', e.target.value)} placeholder="Credit per posting (aUEC)" className="h-9 border px-2 text-[10px]" style={box} />
        <input type="number" min="0" step="0.25" value={form.estimated_hours} onChange={(e) => set('estimated_hours', e.target.value)} placeholder="Hours reckoned" className="h-9 border px-2 text-[10px]" style={box} />
        <input type="number" min="1" value={form.hands_needed} onChange={(e) => set('hands_needed', e.target.value)} placeholder="Hands needed" className="h-9 border px-2 text-[10px]" style={box} />
        <input type="number" min="1" value={form.due_in_days} onChange={(e) => set('due_in_days', e.target.value)} placeholder="Days each posting runs" className="h-9 border px-2 text-[10px]" style={box} />
        <select value={form.cadence} onChange={(e) => set('cadence', e.target.value)} className="h-9 border px-2 text-[10px]" style={box}>
          {CADENCES.map((c) => <option key={c} value={c}>{c === 'none' ? 'POSTED BY HAND' : c.toUpperCase()}</option>)}
        </select>
        <input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Where the work happens" className="h-9 border px-2 text-[10px]" style={box} />
      </div>

      <CreditSuggestion category={form.category} estimatedHours={form.estimated_hours} onUse={(v) => set('agreed_credit_auec', String(v))} />

      {save.error && <p className="text-[9px]" style={{ color: '#D08A6A' }}>{save.error.message}</p>}
      <button
        onClick={() => save.mutate()}
        disabled={save.isPending || !form.template_name.trim()}
        className="h-9 px-4 border text-[9px] font-bold tracking-[0.14em] inline-flex items-center gap-2 disabled:opacity-40"
        style={{ borderColor: '#3A2F20', color: '#C8A05B', background: '#120D08' }}
      >
        {save.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <BookOpen className="w-3 h-3" />} SAVE THE BRIEF
      </button>
    </div>
  );
}