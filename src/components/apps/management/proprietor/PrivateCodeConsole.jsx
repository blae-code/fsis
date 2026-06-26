import React from 'react';

export default function PrivateCodeConsole({ codes, onToggle, pending }) {
  const rows = codes.slice(0, 6);
  return (
    <section className="border p-3 space-y-2" style={{ borderColor: '#2A2118', background: '#100E0B' }}>
      <div className="text-[9px] tracking-[0.22em]" style={{ color: '#C8893B' }}>PRIVATE CODE CONTROL</div>
      {rows.length === 0 ? <p className="text-[10px]" style={{ color: '#7A6E60' }}>No private discount codes issued yet.</p> : rows.map((c) => <div key={c.id} className="border p-2 flex items-center justify-between gap-2" style={{ borderColor: '#3A2F20', background: '#0C0A07' }}><div><div className="text-[10px] font-bold" style={{ color: '#EDE5D6' }}>{c.code}</div><div className="text-[8px]" style={{ color: '#7A6E60' }}>{c.discount_percent || 0}% • {c.uses || 0} uses • {c.label || 'private issue'}</div></div><button disabled={pending} onClick={() => onToggle(c)} className="border px-2 py-1 text-[8px] font-bold disabled:opacity-40" style={{ borderColor: c.active ? '#8A8F45' : '#5C4424', color: c.active ? '#8A8F45' : '#C8893B' }}>{c.active ? 'ACTIVE' : 'PAUSED'}</button></div>)}
    </section>
  );
}