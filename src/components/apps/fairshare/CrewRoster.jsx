import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Trash2 } from 'lucide-react';

const border = { borderColor: 'hsl(33, 18%, 18%)' };
const panel = { ...border, background: 'hsl(30, 10%, 8%)' };

export default function CrewRoster() {
  const queryClient = useQueryClient();
  const [handle, setHandle] = useState('');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [defaultShares, setDefaultShares] = useState('1');

  const { data: crew = [] } = useQuery({
    queryKey: ['crew_members'],
    queryFn: () => base44.entities.crew_member.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (m) => base44.entities.crew_member.create(m),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crew_members'] });
      setHandle(''); setRole(''); setEmail(''); setDefaultShares('1');
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

  return (
    <div className="p-4 space-y-4 font-mono">
      <div className="p-3 rounded border space-y-2" style={panel}>
        <div className="text-[10px] text-muted-foreground tracking-[0.2em]">ADD CREW MEMBER</div>
        <div className="grid grid-cols-[1fr_1fr_1fr_5rem_auto] gap-2">
          <Input placeholder="In-game handle" value={handle} onChange={(e) => setHandle(e.target.value)} className="h-8 text-xs" style={border} />
          <Input placeholder="Role, e.g. Scraper" value={role} onChange={(e) => setRole(e.target.value)} className="h-8 text-xs" style={border} />
          <Input type="email" placeholder="Account email (for pay day)" value={email} onChange={(e) => setEmail(e.target.value)} className="h-8 text-xs" style={border} />
          <Input type="number" min="0" step="0.5" value={defaultShares} onChange={(e) => setDefaultShares(e.target.value)} className="h-8 text-xs" style={border} title="Default shares" />
          <Button size="sm" className="h-8 text-[10px] gap-1" disabled={!handle || createMutation.isPending}
            onClick={() => createMutation.mutate({ handle, role, email: email.trim().toLowerCase(), default_shares: parseFloat(defaultShares) || 1, active: true, employment_type: 'contractor' })}>
            <UserPlus className="w-3 h-3" /> ADD
          </Button>
        </div>
        <p className="text-[9px] text-muted-foreground">All new crew are added as contractors — the Proprietor is the sole permanent member. Linking their account email enables pay day notifications and in-app cash-in decisions.</p>
      </div>

      <div className="space-y-1.5">
        <div className="text-[10px] text-muted-foreground tracking-[0.2em]">ROSTER ({crew.length})</div>
        {crew.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">No crew on roster yet.</p>
        ) : crew.map((m) => (
          <div key={m.id} className="p-2.5 rounded border flex items-center gap-3" style={panel}>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-foreground flex items-center gap-2">
                {m.handle}
                <Badge variant="outline" className={`text-[8px] h-4 ${m.employment_type === 'proprietor' ? 'border-primary/60 text-primary' : 'border-muted-foreground/40 text-muted-foreground'}`}>
                  {m.employment_type === 'proprietor' ? 'PROPRIETOR' : 'CONTRACTOR'}
                </Badge>
              </div>
              <div className="text-[9px] text-muted-foreground">{m.role || 'Crew'} • {m.default_shares ?? 1} share{(m.default_shares ?? 1) === 1 ? '' : 's'} default</div>
            </div>
            <Input
              type="email"
              defaultValue={m.email || ''}
              placeholder="link account email"
              title="Account email — enables pay day elections & notifications"
              className="h-6 w-44 text-[9px] font-mono"
              style={border}
              onBlur={(e) => {
                const v = e.target.value.trim().toLowerCase();
                if (v !== (m.email || '')) updateMutation.mutate({ id: m.id, data: { email: v } });
              }}
            />
            <button
              onClick={() => updateMutation.mutate({ id: m.id, data: { active: !m.active } })}
              title="Toggle active"
            >
              <Badge variant="outline" className={`text-[9px] h-4 cursor-pointer ${m.active ? 'border-primary/40 text-primary' : 'border-muted text-muted-foreground'}`}>
                {m.active ? 'ACTIVE' : 'INACTIVE'}
              </Badge>
            </button>
            {m.employment_type !== 'proprietor' && (
              <button onClick={() => deleteMutation.mutate(m.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}