import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Users, UserPlus } from 'lucide-react';

const AMBER = '#E0A22E';
const GREEN = '#4EBF7A';
const YELLOW = '#D4A830';
const RED = '#C05050';
const DIM = '#5A4A34';
const fieldStyle = { borderColor: '#3A2F20', background: '#0C0A07', color: '#EDE5D6' };

const SALVAGE_ROLES = ['Scraper Operator', 'Hull Stripper', 'Cargo Handler', 'Pilot', 'Hauler', 'Security', 'Spotter'];
const STATUS_META = {
  active: { label: 'ACTIVE', color: GREEN },
  prospect: { label: 'PROSPECT', color: YELLOW },
  inactive: { label: 'INACTIVE', color: RED },
};

function CrewRow({ member, missions }) {
  const qc = useQueryClient();
  const update = useMutation({
    mutationFn: (patch) => base44.entities.crew_member.update(member.id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crew_ops'] }),
  });
  const status = STATUS_META[member.member_status] || STATUS_META.active;

  return (
    <div className="border rounded p-3 space-y-2" style={{ borderColor: 'hsl(33,18%,18%)', background: 'hsl(30,10%,8%)' }}>
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: status.color, boxShadow: `0 0 6px ${status.color}80` }} />
        <span className="text-[11px] font-bold truncate" style={{ color: '#EDE5D6' }}>{member.display_name || member.handle}</span>
        <span className="text-[8px]" style={{ color: DIM }}>@{member.handle}</span>
        <span className="ml-auto text-[8px] font-bold tracking-[0.15em] px-1.5 py-0.5 rounded-sm" style={{ background: `${status.color}18`, color: status.color, border: `1px solid ${status.color}40` }}>
          {status.label}
        </span>
        {update.isPending && <Loader2 className="w-3 h-3 animate-spin" style={{ color: AMBER }} />}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <div className="text-[7px] tracking-[0.18em] mb-0.5" style={{ color: DIM }}>SALVAGE ROLE</div>
          <select
            value={member.role || ''}
            onChange={(e) => update.mutate({ role: e.target.value })}
            className="w-full h-7 px-1.5 text-[10px] border rounded outline-none"
            style={fieldStyle}
          >
            <option value="">— Unassigned —</option>
            {SALVAGE_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            {member.role && !SALVAGE_ROLES.includes(member.role) && <option value={member.role}>{member.role}</option>}
          </select>
        </div>
        <div>
          <div className="text-[7px] tracking-[0.18em] mb-0.5" style={{ color: DIM }}>STATUS</div>
          <select
            value={member.member_status || 'active'}
            onChange={(e) => update.mutate({ member_status: e.target.value })}
            className="w-full h-7 px-1.5 text-[10px] border rounded outline-none"
            style={fieldStyle}
          >
            {Object.entries(STATUS_META).map(([v, m]) => <option key={v} value={v}>{m.label}</option>)}
          </select>
        </div>
        <div>
          <div className="text-[7px] tracking-[0.18em] mb-0.5" style={{ color: DIM }}>ACTIVE MISSION</div>
          <select
            value={member.current_mission || ''}
            onChange={(e) => update.mutate({ current_mission: e.target.value })}
            className="w-full h-7 px-1.5 text-[10px] border rounded outline-none"
            style={fieldStyle}
          >
            <option value="">— Standby —</option>
            {missions.map((m) => <option key={m} value={m}>{m}</option>)}
            {member.current_mission && !missions.includes(member.current_mission) && (
              <option value={member.current_mission}>{member.current_mission}</option>
            )}
          </select>
        </div>
      </div>
    </div>
  );
}

/** Crew ops — assign salvage roles and active missions, track member status. */
export default function CrewOpsPanel() {
  const qc = useQueryClient();
  const [handle, setHandle] = useState('');
  const [role, setRole] = useState('');

  const { data: crew = [], isLoading } = useQuery({
    queryKey: ['crew_ops'],
    queryFn: () => base44.entities.crew_member.list('-updated_date', 100),
  });

  // Open salvage sessions double as assignable missions
  const { data: sessions = [] } = useQuery({
    queryKey: ['salvage_sessions'],
    queryFn: () => base44.entities.salvage_session.list('-created_date', 500),
  });
  const missions = [...new Set(
    sessions.filter((s) => ['planning', 'in-progress', 'hauling'].includes(s.status)).map((s) => s.session_name)
  )];

  const add = useMutation({
    mutationFn: () => base44.entities.crew_member.create({ handle: handle.trim(), role, member_status: 'active' }),
    onSuccess: () => {
      setHandle(''); setRole('');
      qc.invalidateQueries({ queryKey: ['crew_ops'] });
    },
  });

  const onMission = crew.filter((c) => c.current_mission).length;
  const activeCount = crew.filter((c) => c.member_status === 'active').length;

  return (
    <div className="p-4 space-y-3 font-mono">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[9px]">
        <span className="flex items-center gap-2 tracking-[0.22em] font-bold" style={{ color: AMBER }}>
          <Users className="w-3.5 h-3.5" /> CREW OPERATIONS
        </span>
        <span style={{ color: DIM }}>ROSTER <span style={{ color: '#EDE5D6' }}>{crew.length}</span></span>
        <span style={{ color: DIM }}>ACTIVE <span style={{ color: GREEN }}>{activeCount}</span></span>
        <span style={{ color: DIM }}>ON MISSION <span style={{ color: AMBER }}>{onMission}</span></span>
      </div>

      {/* Add crew member */}
      <form
        onSubmit={(e) => { e.preventDefault(); if (handle.trim() && !add.isPending) add.mutate(); }}
        className="border rounded p-3 flex flex-wrap items-end gap-2"
        style={{ borderColor: `${AMBER}30`, background: `${AMBER}06` }}
      >
        <div className="flex-1 min-w-[140px]">
          <div className="text-[7px] tracking-[0.18em] mb-0.5" style={{ color: DIM }}>HANDLE</div>
          <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="In-game callsign…" className="w-full h-8 px-2 text-[10px] border rounded outline-none" style={fieldStyle} />
        </div>
        <div className="min-w-[150px]">
          <div className="text-[7px] tracking-[0.18em] mb-0.5" style={{ color: DIM }}>SALVAGE ROLE</div>
          <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full h-8 px-1.5 text-[10px] border rounded outline-none" style={fieldStyle}>
            <option value="">— Assign later —</option>
            {SALVAGE_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <button
          type="submit"
          disabled={!handle.trim() || add.isPending}
          className="border px-3 h-8 text-[9px] font-bold tracking-[0.14em] flex items-center gap-1.5 disabled:opacity-30"
          style={{ borderColor: `${AMBER}60`, color: AMBER, background: '#E0A22E10' }}
        >
          {add.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserPlus className="w-3 h-3" />}
          ADD CREW
        </button>
        {add.isError && <p className="w-full text-[9px]" style={{ color: RED }}>Add failed — {add.error?.message || 'try again'}.</p>}
      </form>

      {/* Roster */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: AMBER }} />
        </div>
      ) : crew.length === 0 ? (
        <p className="text-[10px] text-center py-10" style={{ color: DIM }}>No crew on the roster yet — add your first member above.</p>
      ) : (
        <div className="space-y-2">
          {crew.map((m) => <CrewRow key={m.id} member={m} missions={missions} />)}
        </div>
      )}

      <p className="text-[8px] text-center" style={{ color: '#3A2A14' }}>
        Active missions come from your open salvage sessions (planning / in-progress / hauling) · changes save instantly
      </p>
    </div>
  );
}