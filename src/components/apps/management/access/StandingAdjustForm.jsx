import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { fsisRole } from '@/lib/roles';
import { tierFor } from '@/lib/reputation';

const box = { borderColor: '#3A2F20', background: '#0C0A07', color: '#EDE5D6' };

const ACTIONS = [
  { key: 'adjust', label: 'RECORD ADJUSTMENT', color: '#E0A22E' },
  { key: 'amnesty', label: 'FORGIVE ALL MARKS', color: '#8A8F45' },
  { key: 'dismiss', label: 'RELEASE FROM YARD', color: '#C05050' },
  { key: 'reinstate', label: 'REINSTATE', color: '#6FA0C8' },
];

/** Standing set by hand — always with an actor, a reason, and an entry on the permanent record. */
export default function StandingAdjustForm({ members, onAdjust, pending }) {
  const [memberId, setMemberId] = useState('');
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState('');

  const workers = members.filter((m) => ['contractor', 'owner'].includes(fsisRole(m)));
  const chosen = workers.find((m) => m.id === memberId);

  return (
    <div className="border p-3 space-y-2" style={{ borderColor: '#5C4424', background: 'linear-gradient(180deg, #14100B, #0B0906)' }}>
      <div className="text-[9px] tracking-[0.22em]" style={{ color: '#E0A22E' }}>SET STANDING BY HAND</div>
      <p className="text-[9px] leading-relaxed" style={{ color: '#8A7E6C' }}>
        Every change here is appended to the comrade's permanent record with your name and your reason attached,
        and is shown back to them in full. Nothing is written quietly and nothing is ever erased.
      </p>

      <div className="grid sm:grid-cols-2 gap-2">
        <select value={memberId} onChange={(e) => setMemberId(e.target.value)} className="h-9 border px-2 text-[10px]" style={box}>
          <option value="">Select a comrade…</option>
          {workers.map((m) => (
            <option key={m.id} value={m.id}>
              {(m.handle || m.full_name || m.email)} — {Number(m.reputation) || 0} ({tierFor(m.reputation).label})
            </option>
          ))}
        </select>
        <input
          type="number"
          value={delta}
          onChange={(e) => setDelta(e.target.value)}
          placeholder="Standing change, e.g. 5 or -10"
          className="h-9 border px-2 text-[10px]"
          style={box}
        />
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="Reason — the comrade will read this"
          className="border px-2 py-1.5 text-[10px] sm:col-span-2"
          style={box}
        />
      </div>

      {chosen?.standing_locked && (
        <p className="text-[9px]" style={{ color: '#D08A6A' }}>
          RELEASED FROM THE YARD{chosen.standing_locked_reason ? ` — ${chosen.standing_locked_reason}` : ''}
        </p>
      )}

      <div className="grid grid-cols-2 gap-1">
        {ACTIONS.map((a) => (
          <button
            key={a.key}
            disabled={pending || !memberId || !reason.trim() || (a.key === 'adjust' && !Number(delta))}
            onClick={() => onAdjust({
              member_user_id: memberId,
              action: a.key,
              reason: reason.trim(),
              ...(a.key === 'adjust' ? { delta: Number(delta) } : {}),
            })}
            className="h-8 border text-[8px] font-bold tracking-[0.12em] inline-flex items-center justify-center gap-1 disabled:opacity-40"
            style={{ borderColor: `${a.color}55`, color: a.color, background: '#120D08' }}
          >
            {pending ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : null} {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}