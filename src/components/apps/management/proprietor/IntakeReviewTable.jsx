import React from 'react';

const TYPES = ['fps_gear', 'weapon', 'ship_component', 'vehicle_component', 'bulk_cargo'];
const SIZES = ['S1', 'S2', 'S3', 'S4', 'S5', 'M', 'L', 'XL', 'N/A'];

export default function IntakeReviewTable({ rows, setRows }) {
  const patch = (idx, key, value) => setRows(rows.map((r, i) => i === idx ? { ...r, [key]: value } : r));
  const remove = (idx) => setRows(rows.filter((_, i) => i !== idx));
  return (
    <div className="space-y-2">
      {rows.map((r, idx) => (
        <div key={`${r.item_name}-${idx}`} className="grid lg:grid-cols-[1.4fr_0.8fr_0.55fr_0.55fr_0.65fr_0.75fr_0.45fr_auto] gap-2 border p-2" style={{ borderColor: '#3A2F20', background: '#0C0A07' }}>
          <input value={r.item_name || ''} onChange={(e) => patch(idx, 'item_name', e.target.value)} className="bg-transparent border px-2 py-1 text-[10px]" style={{ borderColor: '#3A2F20', color: '#EDE5D6' }} />
          <select value={r.item_type || 'ship_component'} onChange={(e) => patch(idx, 'item_type', e.target.value)} className="bg-[#0C0A07] border px-2 py-1 text-[10px]" style={{ borderColor: '#3A2F20', color: '#D8CFC0' }}>{TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
          <select value={r.size_class || 'N/A'} onChange={(e) => patch(idx, 'size_class', e.target.value)} className="bg-[#0C0A07] border px-2 py-1 text-[10px]" style={{ borderColor: '#3A2F20', color: '#D8CFC0' }}>{SIZES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
          <input type="number" value={r.quantity || 1} onChange={(e) => patch(idx, 'quantity', Number(e.target.value))} className="bg-transparent border px-2 py-1 text-[10px]" style={{ borderColor: '#3A2F20', color: '#D8CFC0' }} />
          <input type="number" value={r.condition_pct || 100} onChange={(e) => patch(idx, 'condition_pct', Number(e.target.value))} className="bg-transparent border px-2 py-1 text-[10px]" style={{ borderColor: '#3A2F20', color: '#D8CFC0' }} />
          <input type="number" value={r.est_sell_auec || 0} onChange={(e) => patch(idx, 'est_sell_auec', Number(e.target.value))} className="bg-transparent border px-2 py-1 text-[10px]" style={{ borderColor: '#3A2F20', color: '#E0A22E' }} />
          <span className="border px-2 py-1 text-center text-[9px]" style={{ borderColor: r.duplicate_count ? '#8A6430' : '#3A2F20', color: r.duplicate_count ? '#E0A22E' : '#7A6E60' }}>{r.duplicate_count ? `DUP ${r.duplicate_count}` : 'NEW'}</span>
          <button onClick={() => remove(idx)} className="border px-2 py-1 text-[9px]" style={{ borderColor: '#5C4424', color: '#C05050' }}>DROP</button>
        </div>
      ))}
    </div>
  );
}