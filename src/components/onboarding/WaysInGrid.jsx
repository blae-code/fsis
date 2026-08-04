import React from 'react';

const WAYS = [
  ['patron', 'PATRON — YOU BUY', 'Ordering has never required an account and never will. An account is worth having only for what it gives you back.'],
  ['contractor', 'CONTRACTOR — YOU GIVE LABOUR', 'You ask, a person reads it, and you are answered either way. Paid in full per task, with no rota and no claim on you between jobs.'],
  ['owner', 'OWNER — YOU SHARE THE RUNNING OF IT', 'Extended by invitation and never applied for. A route to ask for it would only be a route to lobby for it.'],
];

/** The three ways in, stated as genuinely different rather than three grades of the same thing. */
export default function WaysInGrid({ standing }) {
  return (
    <div className="grid sm:grid-cols-3 gap-2 font-mono">
      {WAYS.map(([key, title, body]) => {
        const here = key === standing;
        return (
          <div
            key={key}
            className="border p-3 space-y-1"
            style={{ borderColor: here ? '#8A6430' : '#2E2519', background: here ? '#141009' : '#0C0A07' }}
          >
            <div className="text-[9px] tracking-[0.16em]" style={{ color: here ? '#E0A22E' : '#8A7E6C' }}>{title}</div>
            <p className="text-[9px] leading-relaxed" style={{ color: '#8A7E6C' }}>{body}</p>
            {here && <div className="text-[8px] tracking-[0.2em]" style={{ color: '#8A8F45' }}>WHERE YOU STAND</div>}
          </div>
        );
      })}
    </div>
  );
}