import React from 'react';

export default function FreightMissionList({ missions = [], selected = [], setSelected }) {
  return <div className="space-y-1 max-h-52 overflow-auto">{missions.map((m)=><label key={m.id} className="border p-2 text-[10px] flex gap-2" style={{ borderColor: selected.includes(m.id) ? '#E0A22E' : '#2A2118', color: '#C8BDAA' }}><input type="checkbox" checked={selected.includes(m.id)} disabled={!selected.includes(m.id) && selected.length >= 10} onChange={(e)=>setSelected(e.target.checked ? [...selected, m.id].slice(0,10) : selected.filter((id)=>id!==m.id))}/><span className="flex-1">{m.mission_name} • {m.origin} → {m.destination}</span><span>{m.cargo_scu || 0} SCU</span></label>)}</div>;
}