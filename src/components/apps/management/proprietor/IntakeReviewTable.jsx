import React from 'react';

const TYPES = ['fps_gear', 'weapon', 'ship_component', 'vehicle_component', 'bulk_cargo'];
const SIZES = ['S1', 'S2', 'S3', 'S4', 'S5', 'M', 'L', 'XL', 'N/A'];
const GRADE_COLOR = { new: '#8A8F45', refurb: '#6F7F55', used: '#C8893B', worn: '#C05050' };

const round100 = (n) => Math.round(Number(n || 0) / 100) * 100;
const gradeFor = (pct) => pct >= 95 ? 'new' : pct >= 80 ? 'refurb' : pct >= 55 ? 'used' : 'worn';
const wearMultiplier = (pct) => pct >= 95 ? 1 : pct >= 80 ? 0.86 : pct >= 55 ? 0.64 : 0.38;

export default function IntakeReviewTable({ rows, setRows }) {
  const triageRow = (r) => {
    const pct = Math.max(0, Math.min(100, Number(r.condition_pct || 100)));
    const grade = gradeFor(pct);
    const baseValue = Number(r.base_est_sell_auec || r.est_sell_auec || 0);
    return { ...r, condition_pct: pct, condition_grade: grade, base_est_sell_auec: baseValue, est_sell_auec: round100(baseValue * wearMultiplier(pct)) };
  };
  const patch = (idx, key, value) => setRows(rows.map((r, i) => i === idx ? { ...r, [key]: value } : r));
  const patchEstimate = (idx, value) => setRows(rows.map((r, i) => i === idx ? { ...r, est_sell_auec: value, base_est_sell_auec: value } : r));
  const remove = (idx) => setRows(rows.filter((_, i) => i !== idx));
  const triage = (idx) => setRows(rows.map((r, i) => i === idx ? triageRow(r) : r));
  const triageAll = () => setRows(rows.map(triageRow));
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 border p-2" style={{ borderColor: '#3A2F20', background: '#0C0A07' }}>
        <p className="text-[9px]" style={{ color: '#8A7E6C' }}>Condition triage uses wear percentage to set grade and discount the estimate.</p>
        <button onClick={triageAll} className="border px-3 py-1.5 text-[9px] font-bold" style={{ borderColor: '#8A8F45', color: '#8A8F45' }}>TRIAGE ALL BY WEAR</button>
      </div>
      {rows.map((r, idx) => (
        <div key={`${r.item_name}-${idx}`} className="grid lg:grid-cols-[1.35fr_0.75fr_0.5fr_0.5fr_0.6fr_0.7fr_0.55fr_0.45fr_auto_auto] gap-2 border p-2" style={{ borderColor: '#3A2F20', background: '#0C0A07' }}>
          <input value={r.item_name || ''} onChange={(e) => patch(idx, 'item_name', e.target.value)} className="bg-transparent border px-2 py-1 text-[10px]" style={{ borderColor: '#3A2F20', color: '#EDE5D6' }} />
          <select value={r.item_type || 'ship_component'} onChange={(e) => patch(idx, 'item_type', e.target.value)} className="bg-[#0C0A07] border px-2 py-1 text-[10px]" style={{ borderColor: '#3A2F20', color: '#D8CFC0' }}>{TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</select>
          <select value={r.size_class || 'N/A'} onChange={(e) => patch(idx, 'size_class', e.target.value)} className="bg-[#0C0A07] border px-2 py-1 text-[10px]" style={{ borderColor: '#3A2F20', color: '#D8CFC0' }}>{SIZES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
          <input type="number" value={r.quantity || 1} onChange={(e) => patch(idx, 'quantity', Number(e.target.value))} className="bg-transparent border px-2 py-1 text-[10px]" style={{ borderColor: '#3A2F20', color: '#D8CFC0' }} />
          <input type="number" value={r.condition_pct || 100} onChange={(e) => patch(idx, 'condition_pct', Number(e.target.value))} className="bg-transparent border px-2 py-1 text-[10px]" style={{ borderColor: '#3A2F20', color: '#D8CFC0' }} />
          <input type="number" value={r.est_sell_auec || 0} onChange={(e) => patchEstimate(idx, Number(e.target.value))} className="bg-transparent border px-2 py-1 text-[10px]" style={{ borderColor: '#3A2F20', color: '#E0A22E' }} />
          <span className="border px-2 py-1 text-center text-[9px] font-bold uppercase" style={{ borderColor: GRADE_COLOR[r.condition_grade] || '#3A2F20', color: GRADE_COLOR[r.condition_grade] || '#7A6E60' }}>{r.condition_grade || 'ungraded'}</span>
          <span className="border px-2 py-1 text-center text-[9px]" style={{ borderColor: r.duplicate_count ? '#8A6430' : '#3A2F20', color: r.duplicate_count ? '#E0A22E' : '#7A6E60' }}>{r.duplicate_count ? `DUP ${r.duplicate_count}` : 'NEW'}</span>
          <button onClick={() => triage(idx)} className="border px-2 py-1 text-[9px]" style={{ borderColor: '#8A8F45', color: '#8A8F45' }}>TRIAGE</button>
          <button onClick={() => remove(idx)} className="border px-2 py-1 text-[9px]" style={{ borderColor: '#5C4424', color: '#C05050' }}>DROP</button>
        </div>
      ))}
    </div>
  );
}