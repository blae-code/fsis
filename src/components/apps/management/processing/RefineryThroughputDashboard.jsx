import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import BatchTurnaroundRow from './BatchTurnaroundRow';
import { throughputModel } from './refineryThroughput';

const num = (n) => Math.round(Number(n) || 0).toLocaleString();
const hrs = (h) => (h > 0 ? `${Math.round(h * 10) / 10} H` : '—');
const WINDOWS = [7, 30, 90];

function Well({ k, v, s, c = '#EDE5D6' }) {
  return (
    <div className="p-2" style={{ background: '#0B0906' }}>
      <p className="text-[7px] tracking-[0.2em]" style={{ color: '#5F564A' }}>{k}</p>
      <p className="text-[17px] tabular-nums leading-tight" style={{ color: c }}>{v}</p>
      <p className="text-[7px] tracking-[0.12em]" style={{ color: '#4A4136' }}>{s}</p>
    </div>
  );
}

/** The refining floor at a glance: mass through it, how much of it is in use, and when each batch is due. */
export default function RefineryThroughputDashboard() {
  const [windowDays, setWindowDays] = useState(30);
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['pipeline_jobs'],
    queryFn: () => base44.entities.processing_job.list('-created_date', 300),
    refetchInterval: 60000,
  });

  const m = useMemo(() => throughputModel(jobs, { windowDays }), [jobs, windowDays]);
  const longest = m.queue.reduce((max, b) => Math.max(max, b.hours), 0);
  const nextOut = m.queue.find((q) => !q.ready);

  if (isLoading) return <p className="text-[8px] font-mono" style={{ color: '#5F564A' }}>Reading the hoppers…</p>;

  return (
    <div className="space-y-3 font-mono">
      <div className="flex items-center gap-1.5">
        <span className="text-[7px] font-bold tracking-[0.2em]" style={{ color: '#8A7E6C' }}>LOOKING BACK</span>
        {WINDOWS.map((w) => (
          <button
            key={w}
            onClick={() => setWindowDays(w)}
            className="px-2 py-0.5 text-[7px] tracking-[0.16em]"
            style={{
              boxShadow: `inset 0 0 0 1px ${w === windowDays ? '#8A6430' : '#241C14'}`,
              color: w === windowDays ? '#E0A22E' : '#6B6155',
              background: w === windowDays ? 'linear-gradient(180deg,#1B1309,#0D0A07)' : 'transparent',
            }}
          >
            {w} DAYS
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-px" style={{ background: '#241C14' }}>
        <Well k="MASS THROUGH" v={`${num(m.throughputScu)} SCU`} s={`${m.batchesDone} BATCHES COLLECTED`} c="#E0A22E" />
        <Well k="VALUE OUT" v={num(m.throughputValue)} s={`aUEC OVER ${m.windowDays} DAYS`} c="#8A8F45" />
        <Well k="ON THE FLOOR NOW" v={`${m.inFloor}`} s={`${num(m.capacityScu)} SCU COMMITTED`} c={m.inFloor ? '#EDE5D6' : '#3A332A'} />
        <Well
          k="AVERAGE TURNAROUND"
          v={hrs(m.avgTurnaround)}
          s={m.worstTurnaround ? `WORST ${hrs(m.worstTurnaround)}` : 'NOTHING COLLECTED YET'}
          c="#B8AC9A"
        />
      </div>

      <div className="grid gap-px md:grid-cols-3" style={{ background: '#241C14' }}>
        <Well k="COOKING" v={`${m.cookingCount}`} s={nextOut ? `NEXT OUT IN ${hrs(nextOut.hours)}` : 'NOTHING REFINING'} c={m.cookingCount ? '#EDE5D6' : '#3A332A'} />
        <Well k="OUT AND UNCOLLECTED" v={`${m.outCount}`} s={m.outCount ? 'SOMEBODY HAS TO GO AND GET IT' : 'FLOOR CLEAR'} c={m.outCount ? '#E0A22E' : '#3A332A'} />
        <Well k="COLLECTION LAG" v={hrs(m.avgLag)} s="AVERAGE SIT BEFORE FETCHING" c={m.avgLag > 6 ? '#C05050' : '#B8AC9A'} />
      </div>

      <p className="text-[7px] leading-relaxed" style={{ color: '#6B6155' }}>
        Turnaround is measured from filling the hopper to the moment somebody actually collected it — not to when the
        game said it was done. A batch that came out at 03:00 and sat until noon took until noon, and the collection lag
        above is where that time goes.
        {m.dueSoon > 0 && ` ${m.dueSoon} batch${m.dueSoon > 1 ? 'es' : ''} due out within two hours.`}
        {m.abandonedCount > 0 && ` ${m.abandonedCount} written off.`}
      </p>

      {m.byLocation.length > 0 && (
        <div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-[7px] font-bold tracking-[0.24em]" style={{ color: '#EDE5D6' }}>CAPACITY IN USE BY REFINERY</span>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg,#3A2F20,transparent)' }} />
          </div>
          <div className="divide-y" style={{ borderColor: '#1A150F' }}>
            {m.byLocation.map((l) => (
              <div key={l.loc} className="flex items-baseline gap-2 px-1 py-1">
                <span className="text-[8px] flex-1 truncate" style={{ color: '#B8AC9A' }}>{l.loc}</span>
                <span className="text-[7px] tabular-nums w-24 text-right" style={{ color: '#8A7E6C' }}>{num(l.scu)} SCU</span>
                <span className="text-[7px] tabular-nums w-20 text-right" style={{ color: '#8A7E6C' }}>{l.cooking} COOKING</span>
                <span className="text-[7px] tabular-nums w-24 text-right" style={{ color: l.out ? '#E0A22E' : '#4A4136' }}>{l.out} WAITING</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-[7px] font-bold tracking-[0.24em]" style={{ color: '#EDE5D6' }}>EXPECTED TURNAROUND — BATCHES ON THE FLOOR</span>
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg,#3A2F20,transparent)' }} />
          <span className="text-[7px] tabular-nums" style={{ color: '#5F564A' }}>{m.queue.length} BATCHES</span>
        </div>
        {m.queue.length === 0 ? (
          <p className="text-[8px]" style={{ color: '#5F564A' }}>No hopper is running. Start one from the reckoning stage and it will appear here.</p>
        ) : (
          <div className="divide-y" style={{ borderColor: '#1A150F' }}>
            {m.queue.map((b) => <BatchTurnaroundRow key={b.id} b={b} longest={longest} />)}
          </div>
        )}
      </div>
    </div>
  );
}