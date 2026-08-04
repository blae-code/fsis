import React from 'react';

const PRIORITY = { routine: '#8A7E6C', elevated: '#E0A22E', urgent: '#C05050' };
const NEXT = { planning: 'gathering', gathering: 'crafting', crafting: 'complete' };
const NEXT_LABEL = { planning: 'MATERIALS →', gathering: 'START CRAFT →', crafting: 'MARK DONE →' };

/** One run on the bench: what it makes, who holds it, and the one move that advances it. */
export default function FabQueueCard({ project, onAdvance, onBack, onUpdate }) {
  const items = project.items || [];
  const units = items.reduce((s, i) => s + (Number(i.quantity) || 0), 0);
  return (
    <div className="p-2 space-y-1" style={{ boxShadow: 'inset 0 0 0 1px #241C14', background: '#0A0806' }}>
      <div className="flex items-baseline gap-1.5">
        <span className="text-[9px] truncate" style={{ color: '#F0E7D6' }}>{project.project_name}</span>
        <span className="text-[7px] ml-auto tracking-[0.14em]" style={{ color: PRIORITY[project.priority] || '#8A7E6C' }}>
          {(project.priority || 'routine').toUpperCase()}
        </span>
      </div>

      {items.length === 0
        ? <p className="text-[7px]" style={{ color: '#5F564A' }}>No recipes queued on this run yet.</p>
        : items.map((i, n) => (
          <p key={n} className="text-[7px] truncate" style={{ color: '#8A7E6C' }}>▸ {i.quantity || 1} × {i.item_name}</p>
        ))}

      <div className="flex items-center gap-1.5 text-[7px] tracking-[0.12em]" style={{ color: '#4A4136' }}>
        <span>{units} UNITS</span>
        {project.bench_location && <span className="truncate">· {project.bench_location.toUpperCase()}</span>}
        {project.due_date && <span>· BY {project.due_date}</span>}
      </div>

      <input
        defaultValue={project.assigned_handle || ''}
        onBlur={(e) => e.target.value !== (project.assigned_handle || '') && onUpdate({ assigned_handle: e.target.value })}
        placeholder="nobody has taken this up"
        className="w-full h-6 border px-1 text-[8px]"
        style={{ borderColor: '#2E2519', background: '#0B0906', color: project.assigned_handle ? '#EDE5D6' : '#6B6155' }}
      />

      <div className="flex items-center gap-1.5">
        {project.status !== 'planning' && (
          <button onClick={onBack} className="text-[7px] tracking-[0.16em]" style={{ color: '#6B6155' }}>← BACK</button>
        )}
        {NEXT[project.status] && (
          <button
            onClick={() => onAdvance(NEXT[project.status])}
            className="ml-auto px-1.5 py-0.5 text-[7px] font-bold tracking-[0.16em]"
            style={{ boxShadow: 'inset 0 0 0 1px #8A6430', color: '#E0A22E' }}
          >
            {NEXT_LABEL[project.status]}
          </button>
        )}
      </div>
    </div>
  );
}