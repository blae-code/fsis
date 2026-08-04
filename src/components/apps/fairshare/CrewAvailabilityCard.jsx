import React from 'react';
import { motion } from 'framer-motion';
import { Trash2, MapPin } from 'lucide-react';
import { C, panel, notch } from '@/components/console/theme';

const EMPLOYMENT_META = {
  proprietor: { label: 'PROPRIETOR', color: C.amber },
  contractor: { label: 'CONTRACTOR', color: C.teal },
};

/** One hand on the roster — availability, place, and what they are standing on. */
export default function CrewAvailabilityCard({ member, index = 0, onToggleActive, onDelete }) {
  const meta = EMPLOYMENT_META[member.employment_type || 'contractor'] || EMPLOYMENT_META.contractor;
  const isActive = member.active !== false;
  const accent = isActive ? C.green : C.faint;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.24) }}
      className="border p-3 flex flex-col gap-2"
      style={{ ...panel, borderColor: isActive ? '#3A2F20' : '#241C14', ...notch(6) }}
    >
      <div className="flex items-start gap-2">
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
          style={{ background: accent, boxShadow: isActive ? `0 0 6px ${C.green}88` : 'none' }}
        />
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold tracking-[0.08em] truncate" style={{ color: isActive ? C.bone : C.dim }}>
            {member.display_name || member.handle}
          </div>
          <div className="text-[8px] tracking-[0.14em] mt-0.5" style={{ color: C.faint }}>
            {(member.role || 'CREW').toUpperCase()}
          </div>
        </div>
        <span
          className="text-[7px] px-1.5 py-0.5 tracking-[0.16em] shrink-0"
          style={{ color: meta.color, border: `1px solid ${meta.color}44`, background: `${meta.color}12` }}
        >
          {meta.label}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-px" style={{ background: '#241C14' }}>
        {[
          { label: 'SHARES', value: member.default_shares ?? 1, color: C.amber },
          { label: 'STANDING', value: (member.member_status || 'active').toUpperCase(), color: C.parchment },
        ].map((s) => (
          <div key={s.label} className="px-2 py-1.5" style={{ background: '#0A0806' }}>
            <div className="text-[7px] tracking-[0.2em]" style={{ color: C.dimmer }}>{s.label}</div>
            <div className="text-[10px] font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 text-[8px] min-h-[14px]" style={{ color: member.current_mission ? C.teal : C.dimmer }}>
        <MapPin className="w-2.5 h-2.5 shrink-0" />
        <span className="truncate">{member.current_mission || 'No assignment logged'}</span>
      </div>

      <div className="flex items-center gap-2 pt-1 border-t" style={{ borderColor: '#241C14' }}>
        <button
          onClick={() => onToggleActive(member, !isActive)}
          className="flex-1 text-[8px] py-1 border tracking-[0.16em] transition-colors"
          style={{
            borderColor: isActive ? `${C.green}55` : '#3A2F20',
            color: accent,
            background: isActive ? `${C.green}12` : 'transparent',
          }}
        >
          {isActive ? 'AVAILABLE' : 'STOOD DOWN'}
        </button>
        {member.employment_type !== 'proprietor' && (
          <button onClick={() => onDelete(member)} style={{ color: C.dimmer }} className="hover:text-red-500 transition-colors px-1">
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>
    </motion.div>
  );
}