import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ConsoleFold from '@/components/console/ConsoleFold';
import MaterialPlanner from '@/components/apps/fabrication/MaterialPlanner';
import RecipeLibrary from '@/components/apps/fabrication/RecipeLibrary';
import FabQueueCard from './FabQueueCard';
import FabProjectForm from './FabProjectForm';

const STAGES = [
  { id: 'planning',  label: 'PLANNED',    glyph: '◇', note: 'Written down, nothing gathered' },
  { id: 'gathering', label: 'GATHERING',  glyph: '▤', note: 'Materials being brought in' },
  { id: 'crafting',  label: 'ON THE BENCH', glyph: '⚙', note: 'Being made now' },
  { id: 'complete',  label: 'FINISHED',   glyph: '✓', note: 'Off the bench' },
];
const BACK = { gathering: 'planning', crafting: 'gathering', complete: 'crafting' };
const RANK = { urgent: 0, elevated: 1, routine: 2 };

/** The manufacturing queue: every run on the bench, in the order it should be worked. */
export default function FabQueueConsole() {
  const qc = useQueryClient();

  const { data: projects = [] } = useQuery({
    queryKey: ['fab_projects'],
    queryFn: () => base44.entities.fab_project.list('-updated_date', 120),
    refetchInterval: 60000,
  });
  const { data: recipes = [] } = useQuery({
    queryKey: ['fab_recipes'],
    queryFn: () => base44.entities.crafting_recipe.list('item_name', 300),
  });

  const done = () => qc.invalidateQueries({ queryKey: ['fab_projects'] });
  const create = useMutation({ mutationFn: (d) => base44.entities.fab_project.create(d), onSuccess: done });
  const update = useMutation({ mutationFn: ({ id, patch }) => base44.entities.fab_project.update(id, patch), onSuccess: done });

  const byStage = useMemo(() => {
    const m = {};
    STAGES.forEach((s) => {
      m[s.id] = projects
        .filter((p) => (p.status || 'planning') === s.id)
        .sort((a, b) => (RANK[a.priority] ?? 2) - (RANK[b.priority] ?? 2));
    });
    return m;
  }, [projects]);

  const urgent = projects.filter((p) => p.priority === 'urgent' && p.status !== 'complete').length;
  const openSeats = projects.filter((p) => !p.assigned_handle && ['gathering', 'crafting'].includes(p.status)).length;

  return (
    <div className="space-y-4 font-mono">
      <div className="flex items-center gap-2 text-[9px] tracking-[0.22em]" style={{ color: '#E0A22E' }}>
        ⚙ MANUFACTURING QUEUE — {projects.filter((p) => p.status !== 'complete').length} RUNS OPEN
        {urgent > 0 && <span style={{ color: '#C05050' }}>· {urgent} URGENT</span>}
        {openSeats > 0 && <span style={{ color: '#8A7E6C' }}>· {openSeats} UNMANNED</span>}
      </div>

      <div className="grid gap-2 md:grid-cols-4">
        {STAGES.map((s) => (
          <div key={s.id} style={{ boxShadow: 'inset 0 0 0 1px #2E2519', background: '#090705' }}>
            <div className="flex items-baseline gap-1.5 px-2 py-1.5" style={{ background: 'linear-gradient(180deg,#171009,#0D0A07)' }}>
              <span className="text-[10px]" style={{ color: '#E0A22E' }}>{s.glyph}</span>
              <span className="text-[8px] font-bold tracking-[0.2em]" style={{ color: '#F0E7D6' }}>{s.label}</span>
              <span className="text-[7px] ml-auto tabular-nums" style={{ color: '#5F564A' }}>{byStage[s.id].length}</span>
            </div>
            <div className="p-1.5 space-y-1.5">
              {byStage[s.id].length === 0
                ? <p className="text-[7px] px-1" style={{ color: '#4A4136' }}>{s.note}</p>
                : byStage[s.id].map((p) => (
                  <FabQueueCard
                    key={p.id}
                    project={p}
                    onAdvance={(status) => update.mutate({ id: p.id, patch: { status } })}
                    onBack={() => update.mutate({ id: p.id, patch: { status: BACK[p.status] } })}
                    onUpdate={(patch) => update.mutate({ id: p.id, patch })}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>

      {(create.isError || update.isError) && (
        <p className="text-[8px]" style={{ color: '#C05050' }}>That change did not save. Nothing was written — try again.</p>
      )}

      <FabProjectForm recipes={recipes} onCreate={(d) => create.mutate(d)} pending={create.isPending} />

      <ConsoleFold label="MATERIAL PLANNER — WHAT THE QUEUE STILL NEEDS"><MaterialPlanner /></ConsoleFold>
      <ConsoleFold label="RECIPE LIBRARY — INPUTS, OUTPUTS AND BENCHES"><RecipeLibrary /></ConsoleFold>
    </div>
  );
}