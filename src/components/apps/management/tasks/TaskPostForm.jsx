import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ClipboardPlus, Loader2 } from 'lucide-react';
import CreditSuggestion from '@/components/apps/management/tasks/CreditSuggestion';

const box = { borderColor: '#3A2F20', background: '#0C0A07', color: '#EDE5D6' };
const CATEGORIES = ['salvage', 'hauling', 'escort', 'repair', 'intake', 'delivery', 'admin', 'other'];

const EMPTY = { title: '', brief: '', category: 'salvage', priority: 'routine', agreed_credit_auec: '', estimated_hours: '', hands_needed: '1', due_date: '', location: '' };

/** Post a task to the board. The sum is agreed up front so no comrade works on an open promise. */
export default function TaskPostForm({ actorEmail }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const post = useMutation({
    mutationFn: () => base44.entities.labour_task.create({
      title: form.title.trim(),
      brief: form.brief.trim(),
      category: form.category,
      priority: form.priority,
      agreed_credit_auec: Math.max(0, Number(form.agreed_credit_auec) || 0),
      ...(Number(form.estimated_hours) > 0 ? { estimated_hours: Number(form.estimated_hours) } : {}),
      hands_needed: Math.max(1, Number(form.hands_needed) || 1),
      due_date: form.due_date || undefined,
      location: form.location.trim(),
      status: 'posted',
      posted_by_email: actorEmail || '',
    }),
    onSuccess: () => { setForm(EMPTY); qc.invalidateQueries({ queryKey: ['labour_tasks'] }); },
  });

  return (
    <div className="border p-3 space-y-2" style={{ borderColor: '#5C4424', background: 'linear-gradient(180deg, #14100B, #0B0906)' }}>
      <div className="flex items-center gap-2 text-[9px] tracking-[0.22em]" style={{ color: '#E0A22E' }}>
        <ClipboardPlus className="w-3.5 h-3.5" /> POST A TASK TO THE BOARD
      </div>
      <p className="text-[9px] leading-relaxed" style={{ color: '#8A7E6C' }}>
        State the work and the sum plainly. Tasks are taken up freely, paid in full on completion, and kept
        wholly separate from the pay day pool.
      </p>
      <div className="grid sm:grid-cols-2 gap-2">
        <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Task title" className="h-9 border px-2 text-[10px] sm:col-span-2" style={box} />
        <textarea value={form.brief} onChange={(e) => set('brief', e.target.value)} placeholder="What the work involves" rows={2} className="border px-2 py-1.5 text-[10px] sm:col-span-2" style={box} />
        <select value={form.category} onChange={(e) => set('category', e.target.value)} className="h-9 border px-2 text-[10px]" style={box}>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c.toUpperCase()}</option>)}
        </select>
        <select value={form.priority} onChange={(e) => set('priority', e.target.value)} className="h-9 border px-2 text-[10px]" style={box}>
          <option value="routine">ROUTINE</option>
          <option value="elevated">ELEVATED</option>
          <option value="urgent">URGENT</option>
        </select>
        <input type="number" min="0" value={form.agreed_credit_auec} onChange={(e) => set('agreed_credit_auec', e.target.value)} placeholder="Agreed credit (aUEC)" className="h-9 border px-2 text-[10px]" style={box} />
        <input type="number" min="0" step="0.25" value={form.estimated_hours} onChange={(e) => set('estimated_hours', e.target.value)} placeholder="Hours reckoned (stated to the worker)" className="h-9 border px-2 text-[10px]" style={box} />
        <input type="number" min="1" value={form.hands_needed} onChange={(e) => set('hands_needed', e.target.value)} placeholder="Hands needed" className="h-9 border px-2 text-[10px]" style={box} />
        <input type="date" value={form.due_date} onChange={(e) => set('due_date', e.target.value)} className="h-9 border px-2 text-[10px]" style={box} />
        <input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Where the work happens" className="h-9 border px-2 text-[10px] sm:col-span-2" style={box} />
      </div>
      <CreditSuggestion category={form.category} estimatedHours={form.estimated_hours} onUse={(v) => set('agreed_credit_auec', String(v))} />
      {post.error && <p className="text-[9px]" style={{ color: '#D08A6A' }}>{post.error.message}</p>}
      <button
        onClick={() => post.mutate()}
        disabled={post.isPending || !form.title.trim()}
        className="h-9 px-4 border text-[9px] font-bold tracking-[0.14em] inline-flex items-center gap-2 disabled:opacity-40"
        style={{ borderColor: '#E0A22E', color: '#0C0A07', background: 'linear-gradient(135deg, #E0A22E, #C8893B)' }}
      >
        {post.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <ClipboardPlus className="w-3 h-3" />} POST TASK
      </button>
    </div>
  );
}