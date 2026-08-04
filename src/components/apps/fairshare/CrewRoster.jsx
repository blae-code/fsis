import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import CrewAvailabilityCard from '@/components/apps/fairshare/CrewAvailabilityCard';
import CrewAddForm from '@/components/apps/fairshare/CrewAddForm';
import { C, panel, plate, notch } from '@/components/console/theme';

export default function CrewRoster() {
  const queryClient = useQueryClient();

  const { data: crew = [] } = useQuery({
    queryKey: ['crew_members'],
    queryFn: () => base44.entities.crew_member.list('-created_date'),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['crew_members'] });

  const createMutation = useMutation({ mutationFn: (m) => base44.entities.crew_member.create(m), onSuccess: invalidate });
  const updateMutation = useMutation({ mutationFn: ({ id, data }) => base44.entities.crew_member.update(id, data), onSuccess: invalidate });
  const deleteMutation = useMutation({ mutationFn: (id) => base44.entities.crew_member.delete(id), onSuccess: invalidate });

  const available = crew.filter((m) => m.active !== false);
  const onRun = available.filter((m) => m.current_mission).length;

  return (
    <div className="p-4 space-y-4 font-mono">
      {/* Masthead — storefront hero-strip treatment */}
      <div className="border px-3 py-2 flex items-baseline gap-3" style={{ ...plate, ...notch(8) }}>
        <span className="text-[10px] font-bold tracking-[0.28em]" style={{ color: C.bone }}>CREW ROSTER</span>
        <span className="text-[8px] truncate" style={{ color: C.dim }}>Who stands ready, what place they hold, and what they are on.</span>
      </div>

      {/* Availability strip */}
      <div className="grid grid-cols-3 gap-px" style={{ background: '#241C14' }}>
        {[
          { label: 'ON ROSTER', value: crew.length, color: C.parchment },
          { label: 'AVAILABLE', value: available.length, color: C.green },
          { label: 'ON A RUN', value: onRun, color: C.amber },
        ].map((s) => (
          <div key={s.label} className="px-3 py-2 text-center" style={{ background: '#0A0806' }}>
            <div className="text-[8px] tracking-[0.2em]" style={{ color: C.dimmer }}>{s.label}</div>
            <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <CrewAddForm onAdd={(m) => createMutation.mutate(m)} pending={createMutation.isPending} />

      <div>
        <div className="text-[9px] tracking-[0.22em] mb-2 flex items-center gap-2" style={{ color: C.dim }}>
          <span style={{ color: C.amber }}>◈</span> HANDS ({crew.length})
        </div>
        {crew.length === 0 ? (
          <div className="border py-10 text-center" style={{ ...panel, ...notch(8) }}>
            <Users className="w-6 h-6 mx-auto mb-2" style={{ color: C.dimmer }} />
            <div className="text-[10px]" style={{ color: C.dim }}>No hands on the roster yet.</div>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {crew.map((m, i) => (
              <CrewAvailabilityCard
                key={m.id}
                member={m}
                index={i}
                onToggleActive={(member, active) => updateMutation.mutate({ id: member.id, data: { active } })}
                onDelete={(member) => deleteMutation.mutate(member.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}