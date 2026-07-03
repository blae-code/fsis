import React, { useState } from 'react';

const input = { borderColor: '#5C4424', background: '#0B0906', color: '#EDE5D6' };

function LocationRow({ location, onUpdate, pending }) {
  const [editing, setEditing] = useState(false);
  const [used, setUsed] = useState(location.current_scu || 0);
  const [cap, setCap] = useState(location.capacity_scu || 0);
  const pct = (location.capacity_scu || 0) > 0 ? Math.round(((location.current_scu || 0) / location.capacity_scu) * 100) : 0;
  const pctColor = pct >= 90 ? '#C05050' : pct >= 70 ? '#C8893B' : '#8A8F45';
  const save = () => { onUpdate(location.id, { current_scu: Number(used) || 0, capacity_scu: Number(cap) || 0 }); setEditing(false); };
  return (
    <div className="border px-2 py-1 space-y-1" style={{ borderColor: '#2A2118' }}>
      <div className="flex items-center justify-between gap-2 text-[10px]" style={{ color: '#C8BDAA' }}>
        <span className="truncate">{location.code} — {location.name}</span>
        {editing ? (
          <span className="flex items-center gap-1 shrink-0">
            <input type="number" min="0" value={used} onChange={(e) => setUsed(e.target.value)} className="h-6 w-16 border px-1 text-[10px]" style={input} aria-label="Used SCU" />
            <span style={{ color: '#7A6E60' }}>/</span>
            <input type="number" min="0" value={cap} onChange={(e) => setCap(e.target.value)} className="h-6 w-16 border px-1 text-[10px]" style={input} aria-label="Capacity SCU" />
            <button disabled={pending} onClick={save} className="border px-2 py-0.5 text-[9px] font-bold" style={{ borderColor: '#8A6430', color: '#E0A22E' }}>SAVE</button>
            <button onClick={() => setEditing(false)} className="px-1 text-[9px]" style={{ color: '#7A6E60' }}>✕</button>
          </span>
        ) : (
          <span className="flex items-center gap-2 shrink-0">
            <span style={{ color: pctColor }}>{pct}%</span>
            <span>{location.current_scu || 0}/{location.capacity_scu || 0} SCU</span>
            <button onClick={() => { setUsed(location.current_scu || 0); setCap(location.capacity_scu || 0); setEditing(true); }} className="border px-1.5 py-0.5 text-[9px]" style={{ borderColor: '#3A2F20', color: '#C8893B' }}>EDIT</button>
          </span>
        )}
      </div>
    </div>
  );
}

export default function WarehouseLocationPanel({ locations = [], onCreate, onUpdate, pending }) {
  const [form, setForm] = useState({ code: '', name: '', capacity_scu: 0, location_type: 'bay' });
  const submit = () => { if (!form.code || !form.name) return; onCreate({ ...form, capacity_scu: Number(form.capacity_scu) || 0 }); setForm({ code: '', name: '', capacity_scu: 0, location_type: 'bay' }); };
  return (
    <div className="border p-4 font-mono space-y-3" style={{ borderColor: '#3A2F20', background: '#0A0806' }}>
      <div>
        <p className="text-[10px] tracking-[0.2em]" style={{ color: '#8A8F45' }}>WAREHOUSE MAP</p>
        <h3 className="text-sm font-bold" style={{ color: '#F2EADC' }}>Warehouse locations & capacity</h3>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input placeholder="CODE" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="h-8 px-2 text-xs border" style={input} />
        <input placeholder="NAME" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-8 px-2 text-xs border" style={input} />
        <select value={form.location_type} onChange={(e) => setForm({ ...form, location_type: e.target.value })} className="h-8 px-2 text-xs border" style={input}>
          <option value="bay">Bay</option>
          <option value="rack">Rack</option>
          <option value="staging_area">Staging</option>
          <option value="ship_hold">Ship Hold</option>
        </select>
        <input type="number" placeholder="SCU CAP" value={form.capacity_scu} onChange={(e) => setForm({ ...form, capacity_scu: e.target.value })} className="h-8 px-2 text-xs border" style={input} />
      </div>
      <button disabled={pending} onClick={submit} className="w-full border py-2 text-[10px] tracking-[0.18em]" style={{ borderColor: '#8A6430', color: '#E0A22E' }}>ADD LOCATION</button>
      <div className="space-y-1 max-h-44 overflow-auto">
        {locations.map((l) => <LocationRow key={l.id} location={l} onUpdate={onUpdate} pending={pending} />)}
      </div>
      <p className="text-[8px]" style={{ color: '#7A6E60' }}>Edit used/capacity SCU per location — utilization feeds the Loot Tracker summary dashboard.</p>
    </div>
  );
}