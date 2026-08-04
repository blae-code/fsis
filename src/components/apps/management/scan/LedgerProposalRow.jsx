import React from 'react';

const CATS = ['salvage_sale', 'order_fulfillment', 'hauling', 'fuel', 'repairs', 'fees_fines', 'equipment', 'crew_pay', 'ship_rental', 'other'];
const CELL = { borderColor: '#2A2118', background: '#0B0906', color: '#EDE5D6' };

/** One money movement read off the screen, before it is written to the ledger. */
export default function LedgerProposalRow({ l, onChange, onDrop }) {
  const income = l.entry_type === 'income';
  return (
    <div className="flex items-center gap-1.5 py-1">
      <button
        onClick={() => onChange({ entry_type: income ? 'expense' : 'income' })}
        className="w-14 py-1 text-[8px] font-bold tracking-[0.1em] shrink-0"
        style={{ boxShadow: `inset 0 0 0 1px ${income ? '#8A8F45' : '#8A4430'}`, color: income ? '#8A8F45' : '#C05050' }}
      >
        {income ? 'IN' : 'OUT'}
      </button>
      <input
        value={l.description}
        onChange={(e) => onChange({ description: e.target.value })}
        className="flex-1 min-w-0 border px-1.5 py-1 text-[9px]"
        style={CELL}
      />
      <select value={l.category} onChange={(e) => onChange({ category: e.target.value })} className="border px-1 py-1 text-[8px]" style={CELL}>
        {CATS.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ').toUpperCase()}</option>)}
      </select>
      <input
        type="number"
        value={l.amount_auec}
        onChange={(e) => onChange({ amount_auec: Number(e.target.value) || 0 })}
        className="w-24 border px-1 py-1 text-[9px] text-right tabular-nums"
        style={{ ...CELL, color: income ? '#8A8F45' : '#C05050' }}
      />
      <button onClick={onDrop} className="text-[9px] shrink-0" style={{ color: '#5F564A' }}>✕</button>
    </div>
  );
}