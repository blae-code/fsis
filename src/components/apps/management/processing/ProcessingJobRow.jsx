import React, { useEffect, useState } from 'react';

const STATUS = {
  running:   { label: 'IN THE HOPPER', color: '#E0A22E' },
  ready:     { label: 'OUT AND WAITING', color: '#8A8F45' },
  collected: { label: 'COLLECTED', color: '#6B6155' },
  abandoned: { label: 'WRITTEN OFF', color: '#C05050' },
};

function remaining(readyAt) {
  const ms = new Date(readyAt).getTime() - Date.now();
  if (!Number.isFinite(ms)) return { text: '—', over: false };
  const over = ms <= 0;
  const abs = Math.abs(ms);
  const h = Math.floor(abs / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);
  const s = Math.floor((abs % 60000) / 1000);
  const text = h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m ${String(s).padStart(2, '0')}s`;
  return { text: over ? `OUT ${text} AGO` : text, over, urgent: !over && abs < 1800000 };
}

/** One hopper, with a countdown that actually moves. */
export default function ProcessingJobRow({ job, onCollect, onAbandon, pending }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (['collected', 'abandoned'].includes(job.status)) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [job.status]);

  const meta = STATUS[job.status] || STATUS.running;
  const closed = ['collected', 'abandoned'].includes(job.status);
  const clock = remaining(job.ready_at);
  void tick;

  return (
    <div
      className="border p-2.5 space-y-1.5 font-mono"
      style={{ borderColor: closed ? '#241C12' : clock.over ? '#5C6A2A' : '#5C4424', background: '#0B0906' }}
    >
      <div className="flex items-center gap-2 flex-wrap text-[9px]">
        <span style={{ color: '#EDE5D6' }}>{job.label}</span>
        {job.location && <span style={{ color: '#8A7E6C' }}>· {job.location}</span>}
        <span className="ml-auto font-bold tracking-[0.12em]" style={{ color: meta.color }}>{meta.label}</span>
      </div>

      {!closed && (
        <div
          className={`text-[20px] font-bold tabular-nums ${clock.urgent ? 'animate-pulse' : ''}`}
          style={{ color: clock.over ? '#8A8F45' : clock.urgent ? '#C8893B' : '#E0A22E' }}
        >
          {clock.text}
        </div>
      )}

      <div className="text-[8px] leading-relaxed" style={{ color: '#6B6155' }}>
        {[
          job.material && `${job.material}${job.quantity_scu ? ` — ${job.quantity_scu} SCU` : ''}`,
          job.est_value_auec > 0 && `${Number(job.est_value_auec).toLocaleString()} aUEC expected out`,
          job.ready_at && `Ready ${new Date(job.ready_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}`,
          `${(job.watcher_user_ids || []).length} watching`,
        ].filter(Boolean).join(' · ')}
      </div>
      {job.notes && <div className="text-[8px]" style={{ color: '#7A6E60' }}>{job.notes}</div>}

      {closed ? (
        <div className="text-[8px]" style={{ color: '#6B6155' }}>
          {job.status === 'collected'
            ? `Collected${job.collected_by_handle ? ` by ${job.collected_by_handle}` : ''}${job.collected_at ? ` on ${new Date(job.collected_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}` : ''}.`
            : 'Written off rather than left running forever.'}
        </div>
      ) : (
        <div className="flex gap-1.5 pt-0.5">
          <button
            onClick={() => onCollect(job)}
            disabled={pending}
            className="h-7 px-2.5 border text-[8px] font-bold tracking-[0.12em] disabled:opacity-40"
            style={{ borderColor: '#5C6A2A', color: '#8A8F45', background: '#0D130D' }}
          >
            SOMEBODY WENT AND GOT IT
          </button>
          <button
            onClick={() => onAbandon(job)}
            disabled={pending}
            className="h-7 px-2.5 border text-[8px] font-bold tracking-[0.12em] disabled:opacity-40"
            style={{ borderColor: '#5A2A2A', color: '#C05050', background: '#140B08' }}
          >
            WRITE IT OFF
          </button>
        </div>
      )}
    </div>
  );
}