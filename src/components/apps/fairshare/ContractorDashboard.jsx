import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

const AMBER  = '#E0A22E';
const TEAL   = '#6FA08F';
const DIM    = '#7A6E60';
const DIMMER = '#3A3028';
const PANEL  = { background: '#0E0C09', borderColor: '#2A2118' };

const sessionScu = (s) => (s?.rmc_scu || 0) + (s?.cmr_scu || 0) + (s?.cms_scu || 0);

export default function ContractorDashboard() {
  const { data: crew = [] } = useQuery({
    queryKey: ['crew_members'],
    queryFn: () => base44.entities.crew_member.list('-created_date'),
  });
  const { data: orders = [] } = useQuery({
    queryKey: ['work_orders'],
    queryFn: () => base44.entities.work_order.list('-created_date', 100),
  });
  const { data: sessions = [] } = useQuery({
    queryKey: ['salvage_sessions_all'],
    queryFn: () => base44.entities.salvage_session.list('-created_date', 100),
  });

  const sessionById = Object.fromEntries(sessions.map((s) => [s.id, s]));

  const activity = {};
  const ensure = (h) => (activity[h] ||= { volumeScu: 0, opsCompleted: 0, opsActive: 0 });
  orders.forEach((o) => {
    const settled = o.status === 'settled';
    const scu = settled && o.session_id ? sessionScu(sessionById[o.session_id]) : 0;
    (o.crew_shares || []).forEach((c) => {
      const a = ensure(c.handle);
      if (settled) { a.opsCompleted += 1; a.volumeScu += scu; }
      else { a.opsActive += 1; }
    });
  });

  const activeCrew  = crew.filter((m) => m.active !== false);
  const totalVolume = crew.reduce((t, m) => t + (activity[m.handle]?.volumeScu || 0), 0);
  const maxVolume   = Math.max(1, ...crew.map((m) => activity[m.handle]?.volumeScu || 0));

  const sorted = [...crew].sort((a, b) => (activity[b.handle]?.volumeScu || 0) - (activity[a.handle]?.volumeScu || 0));

  return (
    <div className="p-4 space-y-4 font-mono">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'TOTAL CREW',        value: crew.length,        color: '#D8CFC0' },
          { label: 'ACTIVE',            value: activeCrew.length,  color: '#7BA05B' },
          { label: 'TOTAL SALVAGE VOL', value: `${totalVolume.toLocaleString()} SCU`, color: AMBER },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="border px-3 py-2 text-center"
            style={PANEL}
          >
            <div className="text-[8px] tracking-[0.15em]" style={{ color: DIMMER }}>{s.label}</div>
            <div className="text-lg font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Roster table */}
      <div className="border" style={PANEL}>
        {/* Column headers */}
        <div className="grid grid-cols-[1fr_100px_80px_80px] gap-2 px-3 py-1.5 border-b text-[8px] tracking-[0.15em]"
          style={{ borderColor: '#2A2118', color: DIMMER }}>
          <span>CONTRACTOR</span>
          <span>ROLE</span>
          <span className="text-right">OPS</span>
          <span className="text-right">VOL SCU</span>
        </div>

        {crew.length === 0 ? (
          <div className="py-10 text-center text-[10px]" style={{ color: DIMMER }}>No crew on roster yet.</div>
        ) : (
          sorted.map((m, i) => {
            const a    = activity[m.handle] || { volumeScu: 0, opsCompleted: 0, opsActive: 0 };
            const isActive = m.active !== false;
            const isProp   = m.employment_type === 'proprietor';
            const barPct   = (a.volumeScu / maxVolume) * 100;

            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="border-b last:border-b-0"
                style={{ borderColor: DIMMER }}
              >
                <div className="grid grid-cols-[1fr_100px_80px_80px] gap-2 items-center px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{
                        background: isActive ? '#7BA05B' : DIMMER,
                        boxShadow: isActive ? '0 0 5px #7BA05B88' : 'none',
                      }}
                    />
                    <span className="truncate text-[11px]" style={{ color: isActive ? '#D8CFC0' : DIM }}>
                      {m.handle}
                    </span>
                    {isProp && (
                      <span className="text-[7px] px-1.5 py-0.5 tracking-[0.1em] shrink-0"
                        style={{ color: AMBER, border: `1px solid ${AMBER}44`, background: `${AMBER}14` }}>
                        PROP
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] truncate" style={{ color: DIM }}>{m.role || '—'}</span>
                  <div className="text-right">
                    {a.opsActive > 0 && (
                      <span className="text-[9px]" style={{ color: AMBER }}>{a.opsActive} active</span>
                    )}
                    {a.opsCompleted > 0 && (
                      <span className="block text-[8px]" style={{ color: DIMMER }}>{a.opsCompleted} done</span>
                    )}
                    {a.opsActive === 0 && a.opsCompleted === 0 && (
                      <span className="text-[9px]" style={{ color: DIMMER }}>—</span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold" style={{ color: a.volumeScu > 0 ? AMBER : DIMMER }}>
                      {a.volumeScu > 0 ? a.volumeScu.toLocaleString() : '—'}
                    </span>
                  </div>
                </div>

                {/* Volume bar */}
                {a.volumeScu > 0 && (
                  <div className="mx-3 mb-1.5 h-0.5" style={{ background: DIMMER }}>
                    <motion.div
                      initial={{ width: 0 }} animate={{ width: `${barPct}%` }}
                      transition={{ delay: 0.2 + i * 0.03, duration: 0.4 }}
                      className="h-full" style={{ background: AMBER }}
                    />
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      <p className="text-[8px]" style={{ color: DIMMER }}>
        Salvage volume = total SCU (RMC + CMR + CMS) of sessions tied to settled work orders the contractor crewed.
      </p>
    </div>
  );
}