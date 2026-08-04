import React, { useState } from 'react';
import { ORDERS, STATUSES, STATUS_META } from './fleetMeta';

const CONTROL = { borderColor: '#3A2F20', background: '#0B0906', color: '#EDE5D6' };
const BTN = { boxShadow: 'inset 0 0 0 1px #8A6430', color: '#E0A22E', background: 'linear-gradient(180deg,#1B1309,#0D0A07)' };

/**
 * One order given to many hulls at once. Nothing is written until a field is chosen
 * and the order signed off, so a stray click cannot stand the whole fleet down.
 */
export default function FleetBulkBar({ count, pilots = [], operations = [], onApply, onClear, onRetire, pending }) {
  const [status, setStatus] = useState('');
  const [order, setOrder] = useState('');
  const [pilot, setPilot] = useState('');
  const [opId, setOpId] = useState('');

  const patch = {};
  if (status) patch.status = status;
  if (order) patch.standing_order = order;
  if (pilot) patch.pilot_handle = pilot === '__clear__' ? '' : pilot;
  if (opId) {
    const op = operations.find((o) => o.id === opId);
    patch.assigned_operation_id = opId === '__clear__' ? '' : opId;
    patch.assigned_operation_name = opId === '__clear__' ? '' : (op?.op_name || '');
  }
  const ready = Object.keys(patch).length > 0;

  const apply = () => {
    onApply(patch);
    setStatus(''); setOrder(''); setPilot(''); setOpId('');
  };

  return (
    <div className="p-2 space-y-1.5" style={{ background: 'linear-gradient(180deg,#1B1309,#0D0A07)', boxShadow: 'inset 0 0 0 1px #5C4424' }}>
      <div className="flex items-center gap-2">
        <span className="text-[8px] font-bold tracking-[0.24em]" style={{ color: '#E0A22E' }}>◆ {count} HULL{count > 1 ? 'S' : ''} SELECTED</span>
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg,#3A2F20,transparent)' }} />
        <button onClick={onClear} className="text-[7px] tracking-[0.18em]" style={{ color: '#8A7E6C' }}>CLEAR SELECTION</button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-1.5">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-7 border px-1.5 text-[8px]" style={CONTROL}>
          <option value="">— leave status —</option>
          {STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
        </select>
        <select value={order} onChange={(e) => setOrder(e.target.value)} className="h-7 border px-1.5 text-[8px]" style={CONTROL}>
          <option value="">— leave standing order —</option>
          {ORDERS.map((o) => <option key={o} value={o}>{o.toUpperCase()}</option>)}
        </select>
        <select value={pilot} onChange={(e) => setPilot(e.target.value)} className="h-7 border px-1.5 text-[8px]" style={CONTROL}>
          <option value="">— leave seats —</option>
          <option value="__clear__">EMPTY THE SEATS</option>
          {pilots.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
        <select value={opId} onChange={(e) => setOpId(e.target.value)} className="h-7 border px-1.5 text-[8px]" style={CONTROL}>
          <option value="">— leave commitments —</option>
          <option value="__clear__">RELEASE FROM MUSTER</option>
          {operations.map((o) => <option key={o.id} value={o.id}>{o.op_name}</option>)}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          disabled={!ready || pending}
          onClick={apply}
          className="px-3 py-1.5 text-[8px] font-bold tracking-[0.2em] disabled:opacity-40"
          style={BTN}
        >
          {pending ? 'SIGNING ORDER…' : `APPLY TO ${count}`}
        </button>
        <button
          disabled={pending}
          onClick={onRetire}
          className="px-3 py-1.5 text-[8px] font-bold tracking-[0.2em] disabled:opacity-40"
          style={{ boxShadow: 'inset 0 0 0 1px #5C302A', color: '#C05050', background: '#0D0A07' }}
        >
          RETIRE {count}
        </button>
        {!ready && <span className="text-[7px]" style={{ color: '#5F564A' }}>Choose at least one field to change.</span>}
      </div>
    </div>
  );
}