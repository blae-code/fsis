import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { UserPlus, Trash2 } from 'lucide-react';

const AMBER  = '#E0A22E';
const TEAL   = '#6FA08F';
const DIM    = '#7A6E60';
const DIMMER = '#3A3028';
const PANEL  = { background: '#0E0C09', borderColor: '#2A2118' };

const EMPLOYMENT_META = {
  proprietor: { label: 'PROPRIETOR', color: AMBER },
  contractor:  { label: 'CONTRACTOR', color: DIM },
};

export default function CrewRoster() {
  const queryClient = useQueryClient();
  const [handle, setHandle] = useState('');
  const [role, setRole] = useState('');
  const [defaultShares, setDefaultShares] = useState('1');

  const { data: crew = [] } = useQuery({
    queryKey: ['crew_members'],
    queryFn: () => base44.entities.crew_member.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (m) => base44.entities.crew_member.create(m),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crew_members'] });
      setHandle(''); setRole(''); setDefaultShares('1');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.crew_member.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crew_members'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.crew_member.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crew_members'] }),
  });

  const activeCount = crew.filter((m) => m.active !== false).length;

  return (
    <div className="p-4 space-y-4 font-mono">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'TOTAL CREW', value: crew.length, color: '#D8CFC0' },
          { label: 'ACTIVE', value: activeCount, color: '#7BA05B' },
          { label: 'INACTIVE', value: crew.length - activeCount, color: DIM },
        ].map((s) => (
          <div key={s.label} className="border px-3 py-2 text-center" style={PANEL}>
            <div className="text-[8px] tracking-[0.15em]" style={{ color: DIMMER }}>{s.label}</div>
            <div className="text-xl font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Add form */}
      <div className="border p-3 space-y-2" style={PANEL}>
        <div className="text-[9px] tracking-[0.2em]" style={{ color: DIM }}>ADD CREW MEMBER</div>
        <div className="grid grid-cols-[1fr_1fr_5rem_auto] gap-2">
          <input
            className="h-8 bg-transparent border px-2 text-xs font-mono outline-none focus:border-amber-600/60"
            style={{ borderColor: '#2A2118', color: '#D8CFC0' }}
            placeholder="Callsign"
            value={handle} onChange={(e) => setHandle(e.target.value)}
          />
          <input
            className="h-8 bg-transparent border px-2 text-xs font-mono outline-none focus:border-amber-600/60"
            style={{ borderColor: '#2A2118', color: '#D8CFC0' }}
            placeholder="Role, e.g. Scraper"
            value={role} onChange={(e) => setRole(e.target.value)}
          />
          <input
            type="number" min="0" step="0.5"
            className="h-8 bg-transparent border px-2 text-xs font-mono outline-none text-center"
            style={{ borderColor: '#2A2118', color: '#D8CFC0' }}
            title="Default shares"
            value={defaultShares} onChange={(e) => setDefaultShares(e.target.value)}
          />
          <button
            disabled={!handle || createMutation.isPending}
            onClick={() => createMutation.mutate({ handle, role, default_shares: parseFloat(defaultShares) || 1, active: true, employment_type: 'contractor' })}
            className="flex items-center gap-1.5 h-8 px-3 text-[9px] border font-mono tracking-[0.1em] disabled:opacity-40 transition-all"
            style={{ borderColor: AMBER, color: AMBER, background: `${AMBER}0E` }}
          >
            <UserPlus className="w-3 h-3" /> ADD
          </button>
        </div>
        <p className="text-[8px]" style={{ color: DIMMER }}>
          Callsign links automatically to the crew member's FSIS operator account for pay day elections — no personal data collected.
        </p>
      </div>

      {/* Roster */}
      <div>
        <div className="text-[9px] tracking-[0.18em] mb-2" style={{ color: DIM }}>ROSTER ({crew.length})</div>
        {crew.length === 0 ? (
          <div className="border py-10 text-center" style={PANEL}>
            <div className="text-[10px]" style={{ color: DIM }}>No crew on roster yet.</div>
          </div>
        ) : (
          <div className="space-y-1.5">
            {crew.map((m, i) => {
              const meta = EMPLOYMENT_META[m.employment_type || 'contractor'];
              const isActive = m.active !== false;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border flex items-center gap-3 px-3 py-2"
                  style={{ ...PANEL, borderColor: isActive ? '#2A2118' : '#1A1510' }}
                >
                  {/* Active indicator */}
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{
                      background: isActive ? '#7BA05B' : DIMMER,
                      boxShadow: isActive ? '0 0 6px #7BA05B88' : 'none',
                    }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono" style={{ color: isActive ? '#D8CFC0' : DIM }}>{m.handle}</span>
                      <span className="text-[8px] px-1.5 py-0.5 tracking-[0.1em]"
                        style={{ color: meta.color, border: `1px solid ${meta.color}44`, background: `${meta.color}14` }}>
                        {meta.label}
                      </span>
                    </div>
                    <div className="text-[8px] mt-0.5" style={{ color: DIMMER }}>
                      {m.role || 'Crew'} · {m.default_shares ?? 1} share{(m.default_shares ?? 1) === 1 ? '' : 's'} default
                    </div>
                  </div>

                  {/* Active toggle */}
                  <button
                    onClick={() => updateMutation.mutate({ id: m.id, data: { active: !isActive } })}
                    className="text-[8px] px-2 py-1 border tracking-[0.1em] transition-all font-mono"
                    style={{
                      borderColor: isActive ? '#7BA05B55' : DIMMER,
                      color: isActive ? '#7BA05B' : DIMMER,
                      background: isActive ? '#7BA05B14' : 'transparent',
                    }}
                  >
                    {isActive ? 'ACTIVE' : 'INACTIVE'}
                  </button>

                  {m.employment_type !== 'proprietor' && (
                    <button onClick={() => deleteMutation.mutate(m.id)}
                      style={{ color: DIMMER }} className="hover:text-red-500 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}