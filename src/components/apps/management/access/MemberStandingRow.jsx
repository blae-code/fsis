import React from 'react';
import { ROLE_META, fsisRole, canGrant, PROPRIETOR_EMAIL } from '@/lib/roles';
import { ShieldCheck, Ban, RotateCcw } from 'lucide-react';

const STATUS_COLOR = { active: '#8A8F45', pending: '#E0A22E', suspended: '#C05050' };

/** One comrade's standing, with the changes the acting council member is permitted to make. */
export default function MemberStandingRow({ member, actor, onSet, pending }) {
  const role = fsisRole(member);
  const meta = ROLE_META[role];
  const locked = (member.email || '').toLowerCase() === PROPRIETOR_EMAIL;
  const status = member.membership_status || 'active';
  const options = ['owner', 'contractor', 'patron'].filter((r) => r !== role && canGrant(actor, r));

  return (
    <div className="border p-2 space-y-2" style={{ borderColor: '#2E2519', background: '#0C0A07' }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[11px] truncate" style={{ color: '#EDE5D6' }}>{member.handle || member.full_name || member.email}</div>
          <div className="text-[8px] truncate" style={{ color: '#6B6155' }}>{member.email}</div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="px-1.5 py-0.5 border text-[7px] font-bold tracking-[0.14em]" style={{ borderColor: `${meta.color}55`, color: meta.color, background: `${meta.color}14` }}>
            {meta.label}
          </span>
          <span className="px-1.5 py-0.5 border text-[7px] tracking-[0.14em]" style={{ borderColor: `${STATUS_COLOR[status]}44`, color: STATUS_COLOR[status] }}>
            {status.toUpperCase()}
          </span>
        </div>
      </div>
      <p className="text-[8px]" style={{ color: '#6B6155' }}>{meta.blurb}</p>
      {locked ? (
        <p className="text-[8px] flex items-center gap-1" style={{ color: '#8A8F45' }}><ShieldCheck className="w-2.5 h-2.5" /> PROPRIETOR SEAT — NOT REASSIGNABLE</p>
      ) : (
        <div className="flex flex-wrap gap-1">
          {options.map((r) => (
            <button
              key={r}
              disabled={pending}
              onClick={() => onSet({ user_id: member.id, fsis_role: r, membership_status: 'active', notes: `Standing set to ${r} by the council.` })}
              className="px-2 py-1 border text-[7px] font-bold tracking-[0.12em] disabled:opacity-40"
              style={{ borderColor: '#5C4424', color: '#C8A05B', background: '#120D08' }}
            >
              → {ROLE_META[r].label}
            </button>
          ))}
          {status === 'suspended' ? (
            <button
              disabled={pending}
              onClick={() => onSet({ user_id: member.id, membership_status: 'active', notes: 'Reinstated in good standing.' })}
              className="px-2 py-1 border text-[7px] font-bold tracking-[0.12em] inline-flex items-center gap-1 disabled:opacity-40"
              style={{ borderColor: '#8A8F4555', color: '#8A8F45', background: '#0E1009' }}
            >
              <RotateCcw className="w-2.5 h-2.5" /> REINSTATE
            </button>
          ) : (
            <button
              disabled={pending}
              onClick={() => onSet({ user_id: member.id, membership_status: 'suspended', notes: 'Standing suspended pending council review.' })}
              className="px-2 py-1 border text-[7px] font-bold tracking-[0.12em] inline-flex items-center gap-1 disabled:opacity-40"
              style={{ borderColor: '#5C302A', color: '#D08A6A', background: '#140B08' }}
            >
              <Ban className="w-2.5 h-2.5" /> SUSPEND
            </button>
          )}
        </div>
      )}
    </div>
  );
}