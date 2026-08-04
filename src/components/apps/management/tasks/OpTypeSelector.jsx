import React from 'react';
import { Wand2 } from 'lucide-react';
import { OP_TYPES, OP_TYPE_DEFAULTS } from '@/lib/opTypeDefaults';

/**
 * Kind of run, and what that kind usually asks for. Stating the typical shape plainly beside the
 * selector means the council can see what was filled in for them rather than discovering it.
 */
export default function OpTypeSelector({ value, onChange }) {
  const typical = OP_TYPE_DEFAULTS[value] || OP_TYPE_DEFAULTS.other;
  return (
    <div className="sm:col-span-2 space-y-1">
      <div className="flex flex-wrap gap-1">
        {OP_TYPES.map((t) => {
          const on = t === value;
          return (
            <button
              key={t}
              onClick={() => onChange(t)}
              className="px-2 py-1 border text-[8px] font-bold tracking-[0.14em]"
              style={{
                borderColor: on ? '#E0A22E' : '#3A2F20',
                color: on ? '#0C0A07' : '#8A7E6C',
                background: on ? 'linear-gradient(135deg, #E0A22E, #C8893B)' : '#0C0A07',
              }}
            >
              {t.toUpperCase()}
            </button>
          );
        })}
      </div>
      <p className="text-[8px] leading-relaxed inline-flex items-start gap-1" style={{ color: '#6B6155' }}>
        <Wand2 className="w-2.5 h-2.5 mt-0.5 shrink-0" style={{ color: '#C8893B' }} />
        <span>
          TYPICAL: {typical.duration_hours}h
          {typical.muster_location ? ` · ${typical.muster_location}` : ''}
          {typical.ship ? ` · ${typical.ship}` : ''}
          {typical.crew_needed ? ` · ${typical.crew_needed} hands` : ''}
          {' — filled in below, and yours to change.'}
        </span>
      </p>
    </div>
  );
}