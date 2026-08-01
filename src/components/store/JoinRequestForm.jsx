import React, { useState } from 'react';
import { requestStanding } from '@/functions/requestStanding';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Send } from 'lucide-react';

const box = { borderColor: '#3A2F20', background: '#0C0A07', color: '#EDE5D6' };
const EMPTY = { handle: '', skills: '', availability: '', timezone: '', note: '' };

/** The comrade's own words, put before the council. */
export default function JoinRequestForm() {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = useMutation({
    mutationFn: () => requestStanding(form),
    onSuccess: () => {
      setForm(EMPTY);
      qc.invalidateQueries({ queryKey: ['my_standing_request'] });
    },
  });

  return (
    <div className="space-y-2">
      <div className="grid sm:grid-cols-2 gap-2">
        <input value={form.handle} onChange={(e) => set('handle', e.target.value)} placeholder="Handle you work under *" className="h-9 border px-2 text-[10px]" style={box} />
        <input value={form.timezone} onChange={(e) => set('timezone', e.target.value)} placeholder="Your timezone (e.g. PST)" className="h-9 border px-2 text-[10px]" style={box} />
        <input value={form.skills} onChange={(e) => set('skills', e.target.value)} placeholder="Labour you can offer — scraping, hauling, escort…" className="h-9 border px-2 text-[10px] sm:col-span-2" style={box} />
        <input value={form.availability} onChange={(e) => set('availability', e.target.value)} placeholder="When you can stand a muster" className="h-9 border px-2 text-[10px] sm:col-span-2" style={box} />
        <textarea value={form.note} onChange={(e) => set('note', e.target.value)} rows={2} placeholder="Anything else the council should know" className="border px-2 py-1.5 text-[10px] sm:col-span-2" style={box} />
      </div>
      {submit.error && (
        <p className="text-[9px]" style={{ color: '#D08A6A' }}>{submit.error?.response?.data?.error || submit.error.message}</p>
      )}
      <button
        onClick={() => submit.mutate()}
        disabled={submit.isPending || !form.handle.trim()}
        className="h-9 px-4 border text-[9px] font-bold tracking-[0.14em] inline-flex items-center gap-2 disabled:opacity-40"
        style={{ borderColor: '#E0A22E', color: '#0C0A07', background: 'linear-gradient(135deg, #E0A22E, #C8893B)' }}
      >
        {submit.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} PUT IT BEFORE THE COUNCIL
      </button>
      <p className="text-[9px] leading-relaxed" style={{ color: '#6B6155' }}>
        No obligation follows from this. You are never assigned work — you take up what you choose from the board.
      </p>
    </div>
  );
}