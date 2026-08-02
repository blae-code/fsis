import React, { useState } from 'react';
import { CalendarClock, MapPin, Users, Ship, Hourglass } from 'lucide-react';
import { fmtAuec } from '@/components/apps/management/tasks/taskMeta';
import MusterSlots from '@/components/work/MusterSlots';

const RESPONSES = [
  { key: 'in', label: "I'M IN", color: '#8A8F45' },
  { key: 'maybe', label: 'MAYBE', color: '#C8893B' },
  { key: 'out', label: 'CAN\u2019T MAKE IT', color: '#7A6E60' },
];

const OP_STATUS = {
  scheduled: { label: 'SCHEDULED', color: '#E0A22E' },
  mustering: { label: 'MUSTERING', color: '#6FA0C8' },
  underway: { label: 'UNDERWAY', color: '#8A8F45' },
  completed: { label: 'COMPLETED', color: '#6B6155' },
  stood_down: { label: 'STOOD DOWN', color: '#C05050' },
};

/** A scheduled muster, with the comrade's own answer and who else has spoken up. */
export default function OperationRsvpCard({ op, userId, onRsvp, pending }) {
  const [note, setNote] = useState('');
  const meta = OP_STATUS[op.status] || OP_STATUS.scheduled;
  const rsvps = op.rsvps || [];
  const mine = rsvps.find((r) => r.user_id === userId);
  const inCount = rsvps.filter((r) => r.response === 'in' && !r.waitlisted).length;
  const starts = op.starts_at ? new Date(op.starts_at) : null;
  const slots = op.slots || [];
  const wanted = slots.reduce((s, x) => s + (x.wanted || 0), 0) || op.crew_needed || 0;
  const shortHands = Math.max(0, wanted - inCount);
  // Only the places this run actually calls for may be chosen.
  const roles = slots.map((s) => s.role);
  const [role, setRole] = useState(mine?.role || roles[0] || 'any');

  return (
    <div className="border p-3 space-y-2" style={{ borderColor: '#2E2519', background: '#0C0A07' }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[12px] truncate" style={{ color: '#EDE5D6' }}>{op.op_name}</div>
          <div className="text-[8px] tracking-[0.14em]" style={{ color: '#7A6E60' }}>{(op.op_type || '').toUpperCase()}</div>
        </div>
        <span className="px-1.5 py-0.5 border text-[7px] font-bold tracking-[0.14em] shrink-0" style={{ borderColor: `${meta.color}55`, color: meta.color, background: `${meta.color}14` }}>
          {meta.label}
        </span>
      </div>

      {op.brief && <p className="text-[10px] leading-snug" style={{ color: '#A89C8A' }}>{op.brief}</p>}

      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[9px]" style={{ color: '#6B6155' }}>
        {starts && (
          <span className="flex items-center gap-1" style={{ color: '#E0A22E' }}>
            <CalendarClock className="w-2.5 h-2.5" /> {starts.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
          </span>
        )}
        {op.duration_hours ? <span>~{op.duration_hours}H</span> : null}
        {op.muster_location && <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" /> {op.muster_location}</span>}
        {op.ship && <span className="flex items-center gap-1"><Ship className="w-2.5 h-2.5" /> {op.ship}</span>}
        <span className="flex items-center gap-1"><Users className="w-2.5 h-2.5" /> {inCount}/{wanted} IN{shortHands > 0 ? ` · ${shortHands} SHORT` : ''}</span>
      </div>

      {op.roles_wanted && <p className="text-[8px]" style={{ color: '#7A6E60' }}>HANDS WANTED: {op.roles_wanted}</p>}
      <p className="text-[9px]" style={{ color: op.pay_basis === 'shares' ? '#8A8F45' : '#C8893B' }}>
        {op.pay_basis === 'shares'
          ? 'PAID IN SHARES — proceeds divided through the pay day pool.'
          : `PAID DIRECTLY — ${fmtAuec(op.flat_credit_auec)} per hand, settled in full.`}
      </p>

      <MusterSlots slots={slots} />

      {op.status === 'stood_down' && op.stood_down_reason && (
        <p className="text-[9px] border-l pl-2 leading-snug" style={{ color: '#D08A6A', borderColor: '#5C302A' }}>
          STOOD DOWN: {op.stood_down_reason}
        </p>
      )}

      {rsvps.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {rsvps.map((r) => (
            <span key={r.user_id} className="px-1.5 py-0.5 border text-[7px]" style={{ borderColor: '#2E2519', color: r.response === 'in' ? '#8A8F45' : r.response === 'maybe' ? '#C8893B' : '#6B6155' }}>
              {r.handle} · {(r.response || '').toUpperCase()}{r.waitlisted ? ' · WAITING' : ''}
            </span>
          ))}
        </div>
      )}

      {!['completed', 'stood_down'].includes(op.status) && (
        <div className="space-y-2 border-t pt-2" style={{ borderColor: '#2E2519' }}>
          {mine && (
            <p className="text-[8px]" style={{ color: '#6FA0C8' }}>
              YOUR ANSWER: {(mine.response || '').toUpperCase()}
              {mine.role ? ` · ${(mine.role === 'any' ? 'ANY HAND' : mine.role).toUpperCase()}` : ''}
            </p>
          )}
          {mine?.waitlisted && (
            <p className="flex items-start gap-1 text-[8px] leading-relaxed border px-1.5 py-1" style={{ color: '#C8A05B', borderColor: '#4A3A22', background: '#14100A' }}>
              <Hourglass className="w-2.5 h-2.5 mt-px shrink-0" />
              That place was full, so you are next in line for it — answers are taken in the order they arrive, and
              you will be told the moment one comes free.
            </p>
          )}
          {roles.length > 1 && (
            <div className="space-y-1">
              <div className="text-[7px] font-bold tracking-[0.2em]" style={{ color: '#6B6155' }}>THE PLACE YOU COME FOR</div>
              <div className="flex flex-wrap gap-1">
                {slots.map((s) => (
                  <button
                    key={s.role}
                    onClick={() => setRole(s.role)}
                    className="px-1.5 py-1 border text-[7px] font-bold tracking-[0.14em]"
                    style={{
                      borderColor: role === s.role ? '#E0A22E' : '#2E2519',
                      color: role === s.role ? '#E0A22E' : '#7A6E60',
                      background: role === s.role ? '#E0A22E1A' : '#120D08',
                    }}
                  >
                    {(s.role === 'any' ? 'ANY HAND' : s.role).toUpperCase()}
                    {s.places_left > 0 ? ` · ${s.places_left}` : ' · QUEUE'}
                  </button>
                ))}
              </div>
            </div>
          )}
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note for the crew (optional)" className="h-8 w-full border px-2 text-[10px]" style={{ borderColor: '#3A2F20', background: '#0C0A07', color: '#EDE5D6' }} />
          <div className="flex gap-1">
            {RESPONSES.map((r) => (
              <button
                key={r.key}
                disabled={pending}
                onClick={() => onRsvp({ operation_id: op.id, response: r.key, role, note: note.trim() })}
                className="flex-1 h-8 border text-[8px] font-bold tracking-[0.12em] disabled:opacity-40"
                style={{
                  borderColor: mine?.response === r.key ? r.color : '#2E2519',
                  color: r.color,
                  background: mine?.response === r.key ? `${r.color}1A` : '#120D08',
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}