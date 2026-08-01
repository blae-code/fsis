import React from 'react';
import { Users } from 'lucide-react';

/** Who else has their hands on this work, and who has filed their own account of it. */
export default function CrewStrip({ task, userId }) {
  const hands = (task.crew || []).filter((h) => h && h.user_id && !h.released_at);
  const needed = Math.max(1, Number(task.hands_needed) || 1);
  if (hands.length === 0 && needed <= 1) return null;

  return (
    <div className="border-t pt-1.5 space-y-1" style={{ borderColor: '#2E2519' }}>
      <div className="text-[8px] tracking-[0.14em] inline-flex items-center gap-1" style={{ color: '#6FA0C8' }}>
        <Users className="w-2.5 h-2.5" /> {hands.length}/{needed} HANDS ON
      </div>
      <div className="flex flex-wrap gap-1">
        {hands.map((h) => (
          <span
            key={h.user_id}
            className="px-1.5 py-0.5 border text-[7px] tracking-[0.1em]"
            style={{
              borderColor: h.submitted_at ? '#8A8F4555' : '#3A2F20',
              color: h.submitted_at ? '#8A8F45' : '#8A7E6C',
              background: h.submitted_at ? '#8A8F4510' : '#120D08',
            }}
          >
            {(h.user_id === userId ? 'YOU' : h.handle || 'COMRADE').toUpperCase()}
            {h.submitted_at ? ' · FILED' : ''}
          </span>
        ))}
      </div>
      {hands.length < needed && (
        <p className="text-[8px]" style={{ color: '#8A7E6C' }}>
          Still short of hands — the work stays on the board until the crew is full.
        </p>
      )}
    </div>
  );
}