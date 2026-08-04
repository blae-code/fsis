import React from 'react';
import { ROLES, ROLE_META, ORDERS, STATUSES, STATUS_META, descendantIds } from './fleetMeta';
import { HULL_NAMES, lookupHull } from './hullCatalogue';
import SuggestField from './SuggestField';

const field = { borderColor: '#3A2F20', background: '#0B0906', color: '#EDE5D6' };
const Row = ({ label, children }) => (
  <label className="flex items-center gap-2">
    <span className="w-[74px] shrink-0 text-[7px] tracking-[0.2em]" style={{ color: '#544A3D' }}>{label}</span>
    {children}
  </label>
);

/** The hull under the cursor: what it is, who flies it, what it holds and where it answers. */
export default function FleetAssetDetail({ node, assets, operations, onUpdate, onDelete, pilots = [], locations = [] }) {
  if (!node) {
    return <p className="p-3 text-[9px]" style={{ color: '#5F564A' }}>Pick a hull from the order of battle to read and re-order it.</p>;
  }
  const role = ROLE_META[node.role] || ROLE_META.salvage;
  const st = STATUS_META[node.status] || STATUS_META.docked;
  const banned = new Set([node.id, ...descendantIds(node)]);
  const set = (k) => (e) => onUpdate(node.id, { [k]: e.target.value });
  const r = node.rollup || {};

  return (
    <div className="p-2.5 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-[15px]" style={{ color: role.color, filter: `drop-shadow(0 0 8px ${role.color}66)` }}>{role.glyph}</span>
        <div className="min-w-0">
          <div className="text-[11px] font-bold tracking-[0.16em] truncate" style={{ color: '#F0E7D6' }}>{node.callsign}</div>
          <div className="text-[8px] truncate" style={{ color: '#6B6155' }}>{node.hull || 'hull unrecorded'}</div>
        </div>
        <span className="ml-auto text-[7px] tracking-[0.2em] px-1.5 py-0.5" style={{ color: st.color, boxShadow: `inset 0 0 0 1px ${st.color}55` }}>{st.label}</span>
      </div>

      <div className="grid grid-cols-3 gap-1 text-center">
        {[['HULLS', r.hulls || 1], ['SCU', r.scu || node.capacity_scu || 0], ['CREWED', `${r.crewed || (node.pilot_handle ? 1 : 0)}/${r.hulls || 1}`]].map(([k, v]) => (
          <div key={k} className="py-1" style={{ boxShadow: 'inset 0 0 0 1px #241C14' }}>
            <div className="text-[6px] tracking-[0.2em]" style={{ color: '#544A3D' }}>{k}</div>
            <div className="text-[11px] font-bold tabular-nums" style={{ color: '#E0A22E' }}>{v}</div>
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <Row label="HULL">
          <SuggestField
            key={`hull-${node.id}`}
            value={node.hull || ''}
            onChange={(v) => {
              const known = lookupHull(v);
              onUpdate(node.id, known ? { hull: v, capacity_scu: known.scu } : { hull: v });
            }}
            options={HULL_NAMES}
            placeholder="hull unrecorded"
            className="flex-1"
            commitOnBlur
          />
        </Row>
        <Row label="ROLE">
          <select value={node.role || 'salvage'} onChange={set('role')} className="flex-1 h-7 border px-2 text-[9px]" style={field}>
            {ROLES.map((x) => <option key={x} value={x}>{ROLE_META[x].label}</option>)}
          </select>
        </Row>
        <Row label="ORDER">
          <select value={node.standing_order || 'standby'} onChange={set('standing_order')} className="flex-1 h-7 border px-2 text-[9px]" style={field}>
            {ORDERS.map((o) => <option key={o} value={o}>{o.toUpperCase()}</option>)}
          </select>
        </Row>
        <Row label="STATUS">
          <select value={node.status || 'docked'} onChange={set('status')} className="flex-1 h-7 border px-2 text-[9px]" style={field}>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
          </select>
        </Row>
        <Row label="ANSWERS TO">
          <select value={node.parent_id || ''} onChange={set('parent_id')} className="flex-1 h-7 border px-2 text-[9px]" style={field}>
            <option value="">— STANDS ALONE —</option>
            {assets.filter((a) => !banned.has(a.id)).map((a) => <option key={a.id} value={a.id}>{a.callsign}</option>)}
          </select>
        </Row>
        <Row label="PILOT">
          <SuggestField
            key={`pilot-${node.id}`}
            value={node.pilot_handle || ''}
            onChange={(v) => onUpdate(node.id, { pilot_handle: v })}
            options={pilots}
            placeholder="seat open"
            className="flex-1"
            commitOnBlur
          />
        </Row>
        <Row label="HOLD SCU">
          <input type="number" defaultValue={node.capacity_scu || 0} onBlur={(e) => onUpdate(node.id, { capacity_scu: Number(e.target.value) || 0 })} className="flex-1 h-7 border px-2 text-[9px]" style={field} />
        </Row>
        <Row label="BERTH">
          <SuggestField
            key={`berth-${node.id}`}
            value={node.home_location || ''}
            onChange={(v) => onUpdate(node.id, { home_location: v })}
            options={locations}
            placeholder="no home berth"
            className="flex-1"
            commitOnBlur
          />
        </Row>
        <Row label="MUSTER">
          <select
            value={node.assigned_operation_id || ''}
            onChange={(e) => {
              const op = operations.find((o) => o.id === e.target.value);
              onUpdate(node.id, { assigned_operation_id: e.target.value, assigned_operation_name: op?.op_name || '' });
            }}
            className="flex-1 h-7 border px-2 text-[9px]"
            style={field}
          >
            <option value="">— UNCOMMITTED —</option>
            {operations.map((o) => <option key={o.id} value={o.id}>{o.op_name}</option>)}
          </select>
        </Row>
      </div>

      <button
        onClick={() => onDelete(node)}
        className="w-full py-1.5 text-[8px] font-bold tracking-[0.22em]"
        style={{ boxShadow: 'inset 0 0 0 1px #5C302A', color: '#C05050' }}
      >
        DECOMMISSION HULL
      </button>
    </div>
  );
}