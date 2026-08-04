import React from 'react';

/** The flight path, stop by stop: what goes aboard, what comes off, what the hold carries out. */
export default function StopPlanRail({ plan, capacity }) {
  if (!plan.stops.length) {
    return <p className="text-[9px] p-3" style={{ color: '#5F564A' }}>Tick contracts on the left and the route will be laid out here — pickups and drop-offs sorted so no stop is flown twice.</p>;
  }
  return (
    <div className="p-2 space-y-1.5">
      {plan.stops.map((s, i) => {
        const over = capacity > 0 && s.load > capacity;
        return (
          <div key={`${s.label}-${i}`} className="flex gap-2">
            <div className="flex flex-col items-center pt-1 shrink-0">
              <span className="w-5 h-5 flex items-center justify-center text-[8px] tabular-nums" style={{ boxShadow: 'inset 0 0 0 1px #5C4424', color: '#E0A22E', background: '#0D0A07' }}>{i + 1}</span>
              {i < plan.stops.length - 1 && <span className="flex-1 w-px my-0.5" style={{ background: '#3A2F20' }} />}
            </div>
            <div className="flex-1 min-w-0 pb-1" style={{ boxShadow: 'inset 0 -1px 0 #1E1811' }}>
              <div className="flex items-baseline gap-2">
                <span className="text-[9px] font-bold tracking-[0.14em] truncate" style={{ color: '#F0E7D6' }}>{(s.label || '—').toUpperCase()}</span>
                <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg,#2E2519,transparent)' }} />
                <span className="text-[7px] tabular-nums shrink-0" style={{ color: over ? '#C05050' : '#5F564A' }}>
                  HOLD {s.load}{capacity > 0 ? `/${capacity}` : ''} SCU
                </span>
              </div>
              <div className="mt-0.5 space-y-0.5">
                {s.dropoffs.map((d) => (
                  <p key={`d${d.id}`} className="text-[8px] truncate" style={{ color: '#5F6B33' }}>
                    ▼ SET DOWN · {d.name} · {d.scu} SCU · {d.reward.toLocaleString()} aUEC
                  </p>
                ))}
                {s.pickups.map((p) => (
                  <p key={`p${p.id}`} className="text-[8px] truncate" style={{ color: '#8A6430' }}>
                    ▲ LIFT · {p.name} · {p.scu} SCU · for {(p.to || '—').toUpperCase()}
                  </p>
                ))}
              </div>
            </div>
          </div>
        );
      })}
      {plan.warnings.map((w, i) => (
        <p key={i} className="text-[8px] px-1" style={{ color: '#C05050' }}>{w}</p>
      ))}
    </div>
  );
}