import React, { useState } from 'react';
import { ROLES, ROLE_META, ORDERS } from './fleetMeta';
import { HULL_NAMES, lookupHull, suggestCallsign } from './hullCatalogue';
import SuggestField from './SuggestField';

const field = { borderColor: '#3A2F20', background: '#0B0906', color: '#EDE5D6' };
const blank = { callsign: '', hull: '', role: 'salvage', capacity_scu: 0, pilot_handle: '', standing_order: 'standby' };

/** Commission a hull into the order of battle, under a lead or standing on its own. */
export default function FleetAssetForm({ assets, defaultParent, onCreate, pending, pilots = [], locations = [] }) {
  const [f, setF] = useState(blank);
  const [home, setHome] = useState('');
  const [parent, setParent] = useState('');
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  /** Naming the hull settles most of the form: what it holds, what it is for, what it answers to. */
  const pickHull = (hull) => {
    const known = lookupHull(hull);
    setF((p) => ({
      ...p,
      hull,
      capacity_scu: known ? known.scu : p.capacity_scu,
      role: known ? known.role : p.role,
      callsign: p.callsign || (known ? suggestCallsign(known.hull, assets.map((a) => a.callsign)) : ''),
    }));
  };

  const submit = () => {
    if (!f.callsign.trim()) return;
    onCreate({
      ...f,
      callsign: f.callsign.toUpperCase(),
      capacity_scu: Number(f.capacity_scu) || 0,
      home_location: home,
      parent_id: parent || defaultParent || '',
    });
    setF(blank);
    setHome('');
  };

  return (
    <div className="p-2 space-y-1.5">
      <div className="grid grid-cols-2 gap-1.5">
        <SuggestField value={f.hull} onChange={pickHull} options={HULL_NAMES} placeholder="HULL — TYPE OR PICK" className="col-span-2" />
        <input placeholder="CALLSIGN" value={f.callsign} onChange={set('callsign')} className="h-7 border px-2 text-[9px]" style={field} />
        <SuggestField value={f.pilot_handle} onChange={(v) => setF((p) => ({ ...p, pilot_handle: v }))} options={pilots} placeholder="PILOT — SEAT OPEN" />
        <select value={f.role} onChange={set('role')} className="h-7 border px-2 text-[9px]" style={field}>
          {ROLES.map((r) => <option key={r} value={r}>{ROLE_META[r].label}</option>)}
        </select>
        <select value={parent} onChange={(e) => setParent(e.target.value)} className="h-7 border px-2 text-[9px]" style={field}>
          <option value="">— STANDS ALONE —</option>
          {assets.map((a) => <option key={a.id} value={a.id}>UNDER {a.callsign}</option>)}
        </select>
        <input type="number" placeholder="SCU" value={f.capacity_scu} onChange={set('capacity_scu')} className="h-7 border px-2 text-[9px]" style={field} />
        <SuggestField value={home} onChange={setHome} options={locations} placeholder="HOME BERTH" />
        <select value={f.standing_order} onChange={set('standing_order')} className="h-7 border px-2 text-[9px] col-span-2" style={field}>
          {ORDERS.map((o) => <option key={o} value={o}>ORDER · {o.toUpperCase()}</option>)}
        </select>
      </div>
      <button
        disabled={pending || !f.callsign.trim()}
        onClick={submit}
        className="w-full py-1.5 text-[8px] font-bold tracking-[0.22em] disabled:opacity-40"
        style={{ boxShadow: 'inset 0 0 0 1px #8A6430', color: '#E0A22E', background: 'linear-gradient(180deg,#1B1309,#0D0A07)' }}
      >
        COMMISSION HULL
      </button>
    </div>
  );
}