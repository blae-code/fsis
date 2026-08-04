import React, { useState } from 'react';
import { ROLES, ROLE_META, ORDERS } from './fleetMeta';
import { HULL_NAMES, lookupHull, suggestCallsign } from './hullCatalogue';
import SuggestField from './SuggestField';
import FormRow, { FormBand } from './FormRow';

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

  const known = lookupHull(f.hull);
  const lead = assets.find((a) => a.id === (parent || defaultParent));
  const ready = Boolean(f.callsign.trim());

  const submit = () => {
    if (!ready) return;
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
    <div className="p-3 space-y-3">
      <FormBand glyph="⬡" title="THE HULL" note="Name the ship and the sheet fills itself — hold, trade and callsign are all suggested, and every one can be overwritten.">
        <FormRow label="HULL" hint={known ? `KNOWN · ${known.scu} SCU` : 'TYPE OR PICK'} span>
          <SuggestField value={f.hull} onChange={pickHull} options={HULL_NAMES} placeholder="e.g. Drake Vulture" />
        </FormRow>
        <FormRow label="CALLSIGN" hint="WHAT THE NET CALLS IT">
          <input placeholder="VULTURE-1" value={f.callsign} onChange={set('callsign')} className="h-7 border px-2 text-[9px] uppercase" style={field} />
        </FormRow>
        <FormRow label="HOLD" hint="SCU">
          <input type="number" min="0" value={f.capacity_scu} onChange={set('capacity_scu')} className="h-7 border px-2 text-[9px] tabular-nums" style={field} />
        </FormRow>
      </FormBand>

      <FormBand glyph="✶" title="THE SEAT" note="A hull nobody is in cannot be counted on — leave the seat open and the deck will say so.">
        <FormRow label="PILOT" hint={f.pilot_handle ? 'CREWED' : 'SEAT OPEN'}>
          <SuggestField value={f.pilot_handle} onChange={(v) => setF((p) => ({ ...p, pilot_handle: v }))} options={pilots} placeholder="comrade handle" />
        </FormRow>
        <FormRow label="HOME BERTH" hint="WHERE IT SITS">
          <SuggestField value={home} onChange={setHome} options={locations} placeholder="e.g. Port Tressler" />
        </FormRow>
      </FormBand>

      <FormBand glyph="⛭" title="THE ORDER" note="What it is for, who it answers to, and what it does without being told again.">
        <FormRow label="ROLE">
          <select value={f.role} onChange={set('role')} className="h-7 border px-2 text-[9px]" style={field}>
            {ROLES.map((r) => <option key={r} value={r}>{ROLE_META[r].label}</option>)}
          </select>
        </FormRow>
        <FormRow label="STANDING ORDER">
          <select value={f.standing_order} onChange={set('standing_order')} className="h-7 border px-2 text-[9px]" style={field}>
            {ORDERS.map((o) => <option key={o} value={o}>{o.toUpperCase()}</option>)}
          </select>
        </FormRow>
        <FormRow label="FLIES UNDER" hint={lead ? `WING OF ${lead.callsign}` : 'A FLEET IN ITS OWN RIGHT'} span>
          <select value={parent} onChange={(e) => setParent(e.target.value)} className="h-7 border px-2 text-[9px]" style={field}>
            <option value="">— STANDS ALONE —</option>
            {assets.map((a) => <option key={a.id} value={a.id}>UNDER {a.callsign}</option>)}
          </select>
        </FormRow>
      </FormBand>

      <div
        className="px-2 py-1.5 text-[7px] leading-relaxed"
        style={{ boxShadow: 'inset 0 0 0 1px #241C14', background: '#0B0906', color: '#8A7E6C' }}
      >
        {ready ? (
          <>
            <span style={{ color: '#E0A22E' }}>{f.callsign.toUpperCase()}</span>
            {' — '}{f.hull || 'hull unstated'}, {ROLE_META[f.role].label.toLowerCase()}, {Number(f.capacity_scu) || 0} SCU,
            {' '}{f.pilot_handle ? `flown by ${f.pilot_handle}` : 'seat open'},
            {' '}order {f.standing_order}, {lead ? `wing of ${lead.callsign}` : 'standing alone'}.
          </>
        ) : (
          'Give the hull a callsign and it can be commissioned — everything else can be set later from the tree.'
        )}
      </div>

      <button
        disabled={pending || !ready}
        onClick={submit}
        className="w-full py-2 text-[8px] font-bold tracking-[0.22em] disabled:opacity-40"
        style={{ boxShadow: 'inset 0 0 0 1px #8A6430', color: '#E0A22E', background: 'linear-gradient(180deg,#1B1309,#0D0A07)' }}
      >
        {pending ? 'COMMISSIONING…' : 'COMMISSION HULL'}
      </button>
    </div>
  );
}