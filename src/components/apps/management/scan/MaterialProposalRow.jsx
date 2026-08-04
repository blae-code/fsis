import React from 'react';

const CATS = ['salvage_output', 'raw_ore', 'refined_metal', 'component', 'fuel_gas', 'other'];
const CELL = { borderColor: '#2A2118', background: '#0B0906', color: '#EDE5D6' };

/** One material read off the screen, set against what the catalogue already says about it. */
export default function MaterialProposalRow({ m, onChange, onDrop }) {
  const state = !m.existing_id ? 'NEW' : m.delta === null ? 'NO PRICE' : m.delta === 0 ? 'AGREES' : m.delta > 0 ? `+${m.delta}` : `${m.delta}`;
  const tone = !m.existing_id ? '#8A8F45' : m.delta ? (m.delta > 0 ? '#8A8F45' : '#C05050') : '#4A4136';

  return (
    <div className="flex items-center gap-1.5 py-1">
      <input
        value={m.material_name}
        onChange={(e) => onChange({ material_name: e.target.value })}
        className="flex-1 min-w-0 border px-1.5 py-1 text-[9px]"
        style={CELL}
      />
      <input
        value={m.code}
        onChange={(e) => onChange({ code: e.target.value })}
        placeholder="CODE"
        className="w-14 border px-1 py-1 text-[8px] uppercase"
        style={CELL}
      />
      <select value={m.category} onChange={(e) => onChange({ category: e.target.value })} className="border px-1 py-1 text-[8px]" style={CELL}>
        {CATS.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ').toUpperCase()}</option>)}
      </select>
      <input
        type="number"
        value={m.ref_value_auec ?? ''}
        onChange={(e) => onChange({ ref_value_auec: e.target.value === '' ? null : Number(e.target.value) })}
        placeholder="aUEC"
        className="w-20 border px-1 py-1 text-[9px] text-right tabular-nums"
        style={CELL}
      />
      <span className="w-20 text-[8px] text-right tabular-nums shrink-0" style={{ color: tone }}>{state}</span>
      <button onClick={onDrop} className="text-[9px] shrink-0" style={{ color: '#5F564A' }}>✕</button>
    </div>
  );
}