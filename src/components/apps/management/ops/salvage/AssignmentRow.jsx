import React from 'react';
import { ASPECTS, STATUSES, aspectMeta, statusMeta } from './salvageOrchestration';

const CONTROL = { borderColor: '#3A2F20', background: '#0B0906', color: '#EDE5D6' };

/** One trade on one contract, worked by one hull — changed in place, no sheet to open. */
export default function AssignmentRow({ row, hulls, onUpdate, onDrop, conflicted }) {
  const a = aspectMeta(row.aspect);
  const s = statusMeta(row.status);
  return (
    <div className="flex flex-wrap items-center gap-1.5 px-2 py-1" style={{ boxShadow: 'inset 0 -1px 0 #1A150F', background: conflicted ? 'linear-gradient(90deg,#1A0C0A,#0B0906)' : 'transparent' }}>
      <span className="text-[10px] w-4 shrink-0" style={{ color: '#E0A22E' }}>{a.glyph}</span>
      <select value={row.aspect} onChange={(e) => onUpdate({ aspect: e.target.value })} className="h-6 border px-1 text-[8px]" style={CONTROL}>
        {ASPECTS.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
      </select>
      <select
        value={row.hull_id || ''}
        onChange={(e) => {
          const h = hulls.find((x) => x.id === e.target.value);
          onUpdate({ hull_id: h?.id || '', hull_callsign: h?.callsign || '', pilot_handle: h?.pilot_handle || '' });
        }}
        className="h-6 border px-1 text-[8px]"
        style={CONTROL}
      >
        <option value="">— no hull —</option>
        {hulls.map((h) => <option key={h.id} value={h.id}>{h.callsign}</option>)}
      </select>
      <input
        defaultValue={row.target || ''}
        onBlur={(e) => e.target.value !== (row.target || '') && onUpdate({ target: e.target.value })}
        placeholder="wreck / terminal"
        className="h-6 border px-1 text-[8px] w-28"
        style={CONTROL}
      />
      <select value={row.status} onChange={(e) => onUpdate({ status: e.target.value })} className="h-6 border px-1 text-[8px]" style={{ ...CONTROL, color: s.color }}>
        {STATUSES.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
      </select>
      <span className="text-[7px] tracking-[0.14em]" style={{ color: row.pilot_handle ? '#8A7E6C' : '#C05050' }}>
        {row.pilot_handle ? row.pilot_handle.toUpperCase() : 'SEAT OPEN'}
      </span>
      <button onClick={onDrop} className="ml-auto text-[7px] tracking-[0.18em]" style={{ color: '#6B6155' }}>DROP</button>
    </div>
  );
}