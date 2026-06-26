import React from 'react';

export default function OpsAuditMini({ logs }) {
  const rows = logs.slice(0, 7);
  return (
    <section className="border p-3 space-y-2" style={{ borderColor: '#2A2118', background: '#100E0B' }}>
      <div className="text-[9px] tracking-[0.22em]" style={{ color: '#C8893B' }}>RECENT OPS AUDIT</div>
      {rows.length === 0 ? <p className="text-[10px]" style={{ color: '#7A6E60' }}>No proprietor audit events recorded.</p> : rows.map((l) => <div key={l.id} className="border px-2 py-1" style={{ borderColor: '#3A2F20', background: '#0C0A07' }}><div className="text-[9px]" style={{ color: '#D8CFC0' }}>{l.action}</div><div className="text-[8px]" style={{ color: '#7A6E60' }}>{l.entity_name || l.entity_type} • {l.actor || 'system'}</div></div>)}
    </section>
  );
}