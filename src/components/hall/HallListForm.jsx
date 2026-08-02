import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { listHallLot } from '@/functions/listHallLot';
import { Loader2, Gavel } from 'lucide-react';
import ListingAgreementGate from '@/components/hall/ListingAgreementGate';

const box = { borderColor: '#3A2F20', background: '#0C0A07', color: '#EDE5D6' };
const EMPTY = {
  title: '', description: '', item_type: 'component', condition_grade: 'used', condition_pct: '',
  quantity: 1, manufacturer: '', size_class: '', start_auec: '', reserve_auec: '', hours: 48,
  request_appraisal: false,
};

/** A comrade puts a lot up: what it is, what bidding opens at, and the figure they will not go below. */
export default function HallListForm({ onListed }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const list = useMutation({
    mutationFn: () => listHallLot({
      title: form.title.trim(),
      description: form.description.trim(),
      item_type: form.item_type,
      condition_grade: form.condition_grade,
      condition_pct: Number(form.condition_pct) || 0,
      quantity: Number(form.quantity) || 1,
      manufacturer: form.manufacturer.trim(),
      size_class: form.size_class.trim(),
      start_auec: Number(form.start_auec) || 0,
      reserve_auec: Number(form.reserve_auec) || 0,
      hours: Number(form.hours) || 48,
      request_appraisal: form.request_appraisal,
    }),
    onSuccess: () => {
      setForm(EMPTY);
      qc.invalidateQueries({ queryKey: ['hall'] });
      onListed?.();
    },
  });

  const err = list.error?.response?.data;
  const needsSignature = err?.instrument_id;

  return (
    <div className="border p-3 space-y-2" style={{ borderColor: '#5C4424', background: 'linear-gradient(180deg, #14100B, #0B0906)' }}>
      <div className="flex items-center gap-2 text-[9px] tracking-[0.22em]" style={{ color: '#E0A22E' }}>
        <Gavel className="w-3.5 h-3.5" /> PUT A LOT UP
      </div>
      <p className="text-[9px] leading-relaxed" style={{ color: '#8A7E6C' }}>
        Say plainly what it is and what state it is in — a grade a buyer can trust is worth more to
        you than an optimistic one. Your reserve is yours alone: it is never shown to bidders, and the
        hall will not tell them when it has been met either.
      </p>

      {needsSignature ? (
        <ListingAgreementGate
          instrumentId={needsSignature}
          reason={err?.error}
          onSigned={() => list.reset()}
        />
      ) : (
        err?.error && <p className="text-[9px]" style={{ color: '#D08A6A' }}>{err.error}</p>
      )}

      <div className="grid sm:grid-cols-2 gap-2">
        <input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="What are you selling?" className="h-9 border px-2 text-[10px] sm:col-span-2" style={box} />
        <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} placeholder="Anything a bidder should know — damage, missing parts, where it came from" className="border px-2 py-1.5 text-[10px] sm:col-span-2" style={box} />
        <select value={form.item_type} onChange={(e) => set('item_type', e.target.value)} className="h-9 border px-2 text-[10px]" style={box}>
          {['component', 'weapon', 'armour', 'ship_part', 'commodity', 'other'].map((t) => (
            <option key={t} value={t}>{t.replace('_', ' ').toUpperCase()}</option>
          ))}
        </select>
        <select value={form.condition_grade} onChange={(e) => set('condition_grade', e.target.value)} className="h-9 border px-2 text-[10px]" style={box}>
          {['new', 'refurbished', 'used', 'worn'].map((c) => <option key={c} value={c}>{c.toUpperCase()}</option>)}
        </select>
        <input type="number" min="0" max="100" value={form.condition_pct} onChange={(e) => set('condition_pct', e.target.value)} placeholder="Condition %" className="h-9 border px-2 text-[10px]" style={box} />
        <input type="number" min="1" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} placeholder="Quantity" className="h-9 border px-2 text-[10px]" style={box} />
        <input value={form.manufacturer} onChange={(e) => set('manufacturer', e.target.value)} placeholder="Manufacturer" className="h-9 border px-2 text-[10px]" style={box} />
        <input value={form.size_class} onChange={(e) => set('size_class', e.target.value)} placeholder="Size / class" className="h-9 border px-2 text-[10px]" style={box} />
        <input type="number" min="0" value={form.start_auec} onChange={(e) => set('start_auec', e.target.value)} placeholder="Bidding opens at (aUEC)" className="h-9 border px-2 text-[10px]" style={box} />
        <input type="number" min="0" value={form.reserve_auec} onChange={(e) => set('reserve_auec', e.target.value)} placeholder="Your reserve — never shown (aUEC)" className="h-9 border px-2 text-[10px]" style={box} />
        <input type="number" min="1" value={form.hours} onChange={(e) => set('hours', e.target.value)} placeholder="Hours on the floor" className="h-9 border px-2 text-[10px]" style={box} />
      </div>

      <label className="flex items-start gap-2 text-[9px] leading-relaxed" style={{ color: '#8A7E6C' }}>
        <input type="checkbox" checked={form.request_appraisal} onChange={(e) => set('request_appraisal', e.target.checked)} className="mt-0.5" />
        Hold it for the council to look at the grade before it opens. Held, not refused — a grade
        buyers trust is what makes your next lot sell.
      </label>

      <button
        onClick={() => list.mutate()}
        disabled={list.isPending || !form.title.trim()}
        className="h-9 px-4 border text-[9px] font-bold tracking-[0.14em] inline-flex items-center gap-2 disabled:opacity-40"
        style={{ borderColor: '#E0A22E', color: '#0C0A07', background: 'linear-gradient(135deg, #E0A22E, #C8893B)' }}
      >
        {list.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Gavel className="w-3 h-3" />} PUT IT ON THE FLOOR
      </button>
    </div>
  );
}