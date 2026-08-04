import React from 'react';
import { ChevronDown, ChevronRight, UserX } from 'lucide-react';
import { ROLE_META, STATUS_META } from './fleetMeta';

/** One hull in the order of battle — indented under its lead, read at a glance. */
export default function FleetNodeRow({ node, depth, open, onToggle, onSelect, selected, checked, onCheck }) {
  const role = ROLE_META[node.role] || ROLE_META.salvage;
  const st = STATUS_META[node.status] || STATUS_META.docked;
  const kids = node.children.length;
  const r = node.rollup || { hulls: 1, scu: node.capacity_scu || 0 };

  return (
    <div className="flex items-stretch" style={{ paddingLeft: depth * 12 }}>
      {depth > 0 && <div className="w-2 shrink-0 self-stretch" style={{ borderLeft: '1px solid #241C14' }} />}
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheck(node, e.target.checked)}
        title="Select for a bulk order"
        className="shrink-0 self-center mr-1 w-2.5 h-2.5 accent-amber-500"
      />
      <button
        onClick={() => onSelect(node)}
        className="group flex-1 min-w-0 flex items-center gap-2 pl-1.5 pr-2 py-1 text-left"
        style={{
          background: selected ? 'linear-gradient(90deg,rgba(224,162,46,.10),transparent 70%)' : 'transparent',
          boxShadow: `inset 0 0 0 1px ${selected ? '#5C4424' : 'transparent'}`,
        }}
      >
        <span
          onClick={(e) => { if (kids) { e.stopPropagation(); onToggle(node.id); } }}
          className="w-3 shrink-0 flex items-center justify-center"
          style={{ color: '#5F564A' }}
        >
          {kids ? (open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />) : <span className="text-[7px]">·</span>}
        </span>

        <span className="text-[11px] leading-none shrink-0" style={{ color: role.color, filter: `drop-shadow(0 0 6px ${role.color}55)` }}>{role.glyph}</span>

        <span className="text-[9px] font-bold tracking-[0.12em] truncate" style={{ color: '#F0E7D6' }}>{node.callsign}</span>
        <span className="text-[8px] truncate hidden xl:inline" style={{ color: '#6B6155' }}>{node.hull}</span>

        {!node.pilot_handle && <UserX className="w-2.5 h-2.5 shrink-0" style={{ color: '#C05050' }} />}

        <span className="ml-auto flex items-center gap-1.5 shrink-0">
          {kids > 0 && (
            <span className="text-[7px] tabular-nums px-1" style={{ color: '#8A7E6C', boxShadow: 'inset 0 0 0 1px #241C14' }}>
              {r.hulls} · {r.scu} SCU
            </span>
          )}
          <span className="text-[7px] tracking-[0.14em]" style={{ color: '#4A4136' }}>{(node.standing_order || 'standby').toUpperCase()}</span>
          <span className="w-1.5 h-1.5" style={{ background: st.color, boxShadow: `0 0 6px ${st.color}88` }} />
        </span>
      </button>
    </div>
  );
}