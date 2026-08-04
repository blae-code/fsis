import React from 'react';
import { AlertTriangle, Clock, Inbox } from 'lucide-react';

const TONE = { critical: '#C05050', warning: '#C8893B', notice: '#6FA0C8' };

/** What is waiting — kept honest about which side it waits on. */
export default function OutstandingList({ items }) {
  return (
    <div className="border p-3 space-y-2" style={{ borderColor: '#3A2F20', background: '#0C0A07' }}>
      <div className="flex items-center justify-between">
        <span className="text-[9px] tracking-[0.24em]" style={{ color: '#E0A22E' }}>OUTSTANDING</span>
        <span className="text-[9px] tabular-nums" style={{ color: '#8A7E6C' }}>{items.length}</span>
      </div>

      {items.length === 0 ? (
        <p className="text-[9px] py-3 text-center inline-flex items-center gap-1.5 justify-center w-full" style={{ color: '#6B6155' }}>
          <Inbox className="w-3 h-3" /> Nothing outstanding on either side.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((it) => {
            const colour = TONE[it.tone] || '#8A7E6C';
            const Icon = it.on === 'council' ? Clock : AlertTriangle;
            return (
              <li key={it.key} className="border px-2 py-1.5 flex items-start gap-2" style={{ borderColor: '#2E2519', background: '#0A0806' }}>
                <Icon className="w-3 h-3 mt-0.5 shrink-0" style={{ color: colour }} />
                <div className="min-w-0">
                  <div className="text-[9px] font-bold tracking-[0.12em]" style={{ color: colour }}>{it.label}</div>
                  {it.detail && <p className="text-[8px] leading-relaxed mt-0.5" style={{ color: '#8A7E6C' }}>{it.detail}</p>}
                  <span className="text-[7px] tracking-[0.2em]" style={{ color: '#54493B' }}>
                    {it.on === 'council' ? 'WITH THE COUNCIL' : 'WITH YOU'}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}