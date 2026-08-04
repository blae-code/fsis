import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import PipelineStage from './PipelineStage';

const num = (n) => Math.round(Number(n) || 0).toLocaleString();
const hoursUntil = (iso) => (new Date(iso).getTime() - Date.now()) / 3600000;

/**
 * The line, read left to right: ore and scrap into the hopper, refined stock out of it,
 * materials gathered, goods made. One glance says where the work has stalled — a queue
 * split across two consoles is a queue nobody can see the whole of.
 */
export default function ProductionPipeline({ onGo }) {
  const { data: jobs = [] } = useQuery({
    queryKey: ['pipeline_jobs'],
    queryFn: () => base44.entities.processing_job.list('-created_date', 200),
    refetchInterval: 60000,
  });
  const { data: projects = [] } = useQuery({
    queryKey: ['pipeline_projects'],
    queryFn: () => base44.entities.fab_project.list('-updated_date', 200),
    refetchInterval: 60000,
  });

  const stages = useMemo(() => {
    const running = jobs.filter((j) => j.status === 'running');
    const ready = jobs.filter((j) => j.status === 'ready' || (j.status === 'running' && hoursUntil(j.ready_at) <= 0));
    const cooking = running.filter((j) => hoursUntil(j.ready_at) > 0);
    const collected = jobs.filter((j) => j.status === 'collected');
    const stage = (id) => projects.filter((p) => (p.status || 'planning') === id);
    const planning = stage('planning');
    const gathering = stage('gathering');
    const crafting = stage('crafting');
    const complete = stage('complete');

    const nextOut = cooking
      .map((j) => hoursUntil(j.ready_at))
      .sort((a, b) => a - b)[0];
    const rawScu = cooking.reduce((s, j) => s + (Number(j.quantity_scu) || 0), 0);
    const readyValue = ready.reduce((s, j) => s + (Number(j.est_value_auec) || 0), 0);
    const collectedValue = collected.reduce((s, j) => s + (Number(j.est_value_auec) || 0), 0);
    const unitsOf = (list) => list.reduce((s, p) => s + (p.items || []).reduce((t, i) => t + (Number(i.quantity) || 0), 0), 0);
    const unmanned = [...gathering, ...crafting].filter((p) => !p.assigned_handle).length;

    return [
      {
        id: 'raw', target: 'refining', glyph: '⛏', label: 'IN THE HOPPER',
        count: cooking.length, meta: `${num(rawScu)} SCU COOKING`,
        note: nextOut != null ? `NEXT OUT IN ${Math.max(0, Math.round(nextOut * 10) / 10)} H` : 'NOTHING REFINING',
      },
      {
        id: 'ready', target: 'refining', glyph: '⧗', label: 'READY TO COLLECT',
        count: ready.length, meta: readyValue ? `${num(readyValue)} aUEC WAITING` : 'NO VALUE STATED',
        note: ready.length ? 'SOMEBODY HAS TO GO AND GET IT' : 'NOTHING SITTING OUT',
        hot: true,
      },
      {
        id: 'refined', target: 'refining', glyph: '◈', label: 'REFINED IN HAND',
        count: collected.length, meta: collectedValue ? `${num(collectedValue)} aUEC COLLECTED` : 'NO VALUE STATED',
        note: 'FEEDSTOCK AVAILABLE TO THE BENCH',
      },
      {
        id: 'planned', target: 'fab', glyph: '◇', label: 'RUNS PLANNED',
        count: planning.length, meta: `${unitsOf(planning)} UNITS WRITTEN DOWN`,
        note: planning.length ? 'NOTHING GATHERED YET' : 'NO RUNS QUEUED',
      },
      {
        id: 'gathering', target: 'fab', glyph: '▤', label: 'GATHERING',
        count: gathering.length, meta: `${unitsOf(gathering)} UNITS OF INPUTS`,
        note: gathering.length ? 'MATERIALS BEING BROUGHT IN' : 'NOTHING BEING GATHERED',
      },
      {
        id: 'bench', target: 'fab', glyph: '⚙', label: 'ON THE BENCH',
        count: crafting.length, meta: `${unitsOf(crafting)} UNITS BEING MADE`,
        note: unmanned ? `${unmanned} RUN${unmanned > 1 ? 'S' : ''} UNMANNED` : 'ALL MANNED',
        hot: unmanned > 0,
      },
      {
        id: 'finished', target: 'fab', glyph: '✓', label: 'FINISHED GOODS',
        count: complete.length, meta: `${unitsOf(complete)} UNITS MADE`,
        note: 'OFF THE BENCH AND SELLABLE',
      },
    ];
  }, [jobs, projects]);

  const stalled = stages.find((s) => s.hot && s.count > 0);

  return (
    <section className="font-mono" style={{ background: '#0B0906', boxShadow: 'inset 0 0 0 1px #2E2519' }}>
      <div className="h-[3px]" style={{ background: 'repeating-linear-gradient(45deg,#3F3018 0 5px,#120D08 5px 10px)' }} />

      <div className="flex items-center gap-2 px-3 py-2" style={{ background: 'linear-gradient(180deg,#1B1309,#0D0A07)', boxShadow: 'inset 0 -1px 0 #3A2F20' }}>
        <span className="text-[11px]" style={{ color: '#E0A22E', filter: 'drop-shadow(0 0 8px rgba(224,162,46,.5))' }}>⛓</span>
        <span className="text-[8px] font-bold tracking-[0.28em]" style={{ color: '#F0E7D6' }}>PRODUCTION LINE — RAW TO FINISHED</span>
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg,#3A2F20,transparent)' }} />
        <span className="text-[7px] tracking-[0.2em]" style={{ color: stalled ? '#E0A22E' : '#5F564A' }}>
          {stalled ? `HELD AT ${stalled.label}` : 'FLOWING'}
        </span>
      </div>

      <div className="p-2 space-y-1.5">
        <div className="grid gap-1 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          {stages.map((s, i) => (
            <PipelineStage key={s.id} stage={s} first={i === 0} onGo={() => onGo?.(s.target)} />
          ))}
        </div>
        <p className="text-[7px] leading-relaxed" style={{ color: '#6B6155' }}>
          Every station is a real count, not a guess. A stage lit amber is where the line is waiting on somebody —
          refined stock nobody has collected, or a bench with nobody at it. Tap a station to work it.
        </p>
      </div>

      <div className="h-[3px]" style={{ background: 'repeating-linear-gradient(45deg,#3F3018 0 5px,#120D08 5px 10px)' }} />
    </section>
  );
}