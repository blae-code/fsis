import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { setMemberStanding } from '@/functions/setMemberStanding';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Users, Loader2 } from 'lucide-react';
import { fsisRole, isProprietor, ROLE_META } from '@/lib/roles';
import OwnerInviteForm from '@/components/apps/management/access/OwnerInviteForm';
import MemberStandingRow from '@/components/apps/management/access/MemberStandingRow';
import AccessGrantLog from '@/components/apps/management/access/AccessGrantLog';

const ORDER = ['proprietor', 'owner', 'contractor', 'patron'];

/** Council view of who stands where, and the only place standing can change. */
export default function AccessConsole() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState('all');
  const { data: actor } = useQuery({ queryKey: ['user'], queryFn: () => base44.auth.me() });
  const { data: members = [], isLoading } = useQuery({
    queryKey: ['access_roster'],
    queryFn: () => base44.entities.User.list('-created_date', 300),
  });

  const standing = useMutation({
    mutationFn: (payload) => setMemberStanding(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['access_roster'] });
      qc.invalidateQueries({ queryKey: ['access_grants'] });
    },
  });

  const counts = useMemo(() => {
    const c = { proprietor: 0, owner: 0, contractor: 0, patron: 0 };
    members.forEach((m) => { c[fsisRole(m)] += 1; });
    return c;
  }, [members]);

  const visible = useMemo(() => {
    const list = filter === 'all' ? members : members.filter((m) => fsisRole(m) === filter);
    return [...list].sort((a, b) => ORDER.indexOf(fsisRole(a)) - ORDER.indexOf(fsisRole(b)));
  }, [members, filter]);

  return (
    <div className="p-4 space-y-3 font-mono">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-[10px] tracking-[0.24em]" style={{ color: '#E0A22E' }}>
          <Users className="w-4 h-4" /> STANDING & ACCESS — WORKERS' COUNCIL
        </div>
        <p className="text-[9px] max-w-3xl leading-relaxed" style={{ color: '#8A7E6C' }}>
          Every hour of labour in this outfit is the source of its value, so standing is recorded openly and
          held accountable to the collective. Owners hold the yard in common and are admitted by invitation
          alone. Contractors are comrades hired for a task — paid in full for that task, never folded into the
          share pool. Patrons owe us nothing but a fair trade, and never need an account to get one.
        </p>
      </div>

      <div className="flex flex-wrap gap-1">
        {['all', ...ORDER].map((r) => (
          <button
            key={r}
            onClick={() => setFilter(r)}
            className="px-2 py-1 border text-[8px] font-bold tracking-[0.14em]"
            style={{
              borderColor: filter === r ? '#E0A22E' : '#2E2519',
              color: filter === r ? '#E0A22E' : '#7A6E60',
              background: '#0C0A07',
            }}
          >
            {r === 'all' ? `ALL ${members.length}` : `${ROLE_META[r].label} ${counts[r]}`}
          </button>
        ))}
      </div>

      {isProprietor(actor) && <OwnerInviteForm />}
      {!isProprietor(actor) && (
        <p className="border p-2 text-[9px]" style={{ borderColor: '#2E2519', color: '#8A7E6C', background: '#0C0A07' }}>
          Owner seats are extended by the proprietor alone. Owners may admit and release contractors and patrons.
        </p>
      )}

      {standing.error && (
        <p className="text-[9px]" style={{ color: '#D08A6A' }}>{standing.error?.response?.data?.error || standing.error.message}</p>
      )}

      <div className="grid xl:grid-cols-[1.3fr_1fr] gap-3">
        <div className="space-y-2">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-4 h-4 animate-spin" style={{ color: '#E0A22E' }} /></div>
          ) : visible.length === 0 ? (
            <p className="text-[9px] py-6 text-center" style={{ color: '#6B6155' }}>No comrades in this standing yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-2">
              {visible.map((m) => (
                <MemberStandingRow key={m.id} member={m} actor={actor} pending={standing.isPending} onSet={(p) => standing.mutate(p)} />
              ))}
            </div>
          )}
        </div>
        <AccessGrantLog />
      </div>
    </div>
  );
}