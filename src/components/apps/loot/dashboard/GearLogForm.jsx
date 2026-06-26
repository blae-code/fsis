import React, { useState } from 'react';
import { ITEM_TYPES, SIZE_CLASSES, conditionGrade } from '@/components/apps/loot/dashboard/lootGearUtils';

const input = 'h-8 bg-transparent border px-2 text-[10px] font-mono outline-none';
const style = { borderColor: '#3A2F20', color: '#D8CFC0', background: '#0E0C09' };

export default function GearLogForm({ onCreate, pending }) {
  const [form, setForm] = useState({ item_name: '', item_type: 'ship_component', condition_pct: 80, est_sell_auec: '', manufacturer: '', size_class: 'N/A', quantity: 1 });
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = () => {
    onCreate({ ...form, condition_pct: Number(form.condition_pct), condition_grade: conditionGrade(form.condition_pct), est_sell_auec: Number(form.est_sell_auec || 0), quantity: Number(form.quantity || 1), status: 'raw' });
    setForm({ item_name: '', item_type: 'ship_component', condition_pct: 80, est_sell_auec: '', manufacturer: '', size_class: 'N/A', quantity: 1 });
  };
  return (
    <div className="border p-3 space-y-3" style={{ borderColor: '#5C4424', background: '#100E0B' }}>
      <div className="text-[9px] font-mono tracking-[0.22em]" style={{ color: '#E0A22E' }}>LOG LOOTED GEAR</div>
      <div className="grid grid-cols-2 lg:grid-cols-7 gap-2">
        <input className={`${input} col-span-2`} style={style} placeholder="Item name" value={form.item_name} onChange={(e) => set('item_name', e.target.value)} />
        <select className={input} style={style} value={form.item_type} onChange={(e) => set('item_type', e.target.value)}>{ITEM_TYPES.map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select>
        <select className={input} style={style} value={form.size_class} onChange={(e) => set('size_class', e.target.value)}>{SIZE_CLASSES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
        <input className={input} style={style} type="number" min="0" max="100" placeholder="Condition %" value={form.condition_pct} onChange={(e) => set('condition_pct', e.target.value)} />
        <input className={input} style={style} type="number" min="1" placeholder="Qty" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} />
        <input className={input} style={style} type="number" min="0" placeholder="Market value" value={form.est_sell_auec} onChange={(e) => set('est_sell_auec', e.target.value)} />
        <input className={input} style={style} placeholder="Manufacturer" value={form.manufacturer} onChange={(e) => set('manufacturer', e.target.value)} />
      </div>
      <button disabled={!form.item_name || pending} onClick={submit} className="px-3 py-2 text-[10px] font-mono font-bold border disabled:opacity-40" style={{ borderColor: '#8A6430', color: '#15100A', background: '#E0A22E' }}>ADD TO GEAR DASHBOARD</button>
    </div>
  );
}