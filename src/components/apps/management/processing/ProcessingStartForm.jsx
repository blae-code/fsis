import React, { useState } from 'react';
import { Loader2, Timer } from 'lucide-react';

const box = { borderColor: '#3A2F20', background: '#0C0A07', color: '#EDE5D6' };
const EMPTY = { label: '', location: '', material: '', quantity_scu: '', hours: '', est_value_auec: '', notes: '' };

/** Set a hopper going, and a countdown somebody will be told about. */
export default function ProcessingStartForm({ onStart, pending, error }) {
  const [form, setForm] = useState(EMPTY);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const hours = Number(form.hours);
  const valid = form.label.trim() && hours > 0 && hours <= 72;

  const submit = () => {
    onStart({
      label: form.label.trim(),
      location: form.location.trim(),
      material: form.material.trim(),
      quantity_scu: Number(form.quantity_scu) || 0,
      hours,
      est_value_auec: Number(form.est_value_auec) || 0,
      notes: form.notes.trim(),
    }, () => setForm(EMPTY));
  };

  return (
    <div className="border p-3 space-y-2 font-mono" style={{ borderColor: '#5C4424', background: 'linear-gradient(180deg, #14100B, #0B0906)' }}>
      <div className="flex items-center gap-2 text-[9px] tracking-[0.22em]" style={{ color: '#E0A22E' }}>
        <Timer className="w-3.5 h-3.5" /> SET A HOPPER GOING
      </div>
      <p className="text-[8px] leading-relaxed" style={{ color: '#6B6155' }}>
        Whoever sets it going is watching it by default, and is told the moment it is out. Material left
        standing is material at risk, borne by the hand who went out and won it.
      </p>

      <input value={form.label} onChange={set('label')} placeholder="What is being processed — e.g. Refine 320 SCU raw quantanium" className="w-full h-9 border px-2 text-[10px]" style={box} />
      <div className="grid sm:grid-cols-2 gap-2">
        <input value={form.location} onChange={set('location')} placeholder="Where — somebody has to go and collect it" className="h-9 border px-2 text-[10px]" style={box} />
        <input value={form.material} onChange={set('material')} placeholder="Material in the hopper" className="h-9 border px-2 text-[10px]" style={box} />
        <input type="number" min="0" value={form.quantity_scu} onChange={set('quantity_scu')} placeholder="Quantity (SCU)" className="h-9 border px-2 text-[10px]" style={box} />
        <input type="number" min="0" max="72" step="0.25" value={form.hours} onChange={set('hours')} placeholder="Hours it takes (max 72)" className="h-9 border px-2 text-[10px]" style={box} />
        <input type="number" min="0" value={form.est_value_auec} onChange={set('est_value_auec')} placeholder="Expected out (aUEC)" className="h-9 border px-2 text-[10px]" style={box} />
        <input value={form.notes} onChange={set('notes')} placeholder="Notes" className="h-9 border px-2 text-[10px]" style={box} />
      </div>

      {error && <p className="text-[9px]" style={{ color: '#D08A6A' }}>{error}</p>}

      <button
        onClick={submit}
        disabled={pending || !valid}
        className="h-8 px-3 border text-[8px] font-bold tracking-[0.14em] inline-flex items-center gap-1.5 disabled:opacity-40"
        style={{ borderColor: '#E0A22E', color: '#0C0A07', background: 'linear-gradient(135deg, #E0A22E, #C8893B)' }}
      >
        {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : null} START THE CLOCK
      </button>
    </div>
  );
}