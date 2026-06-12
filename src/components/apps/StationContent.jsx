import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MonitorDot } from 'lucide-react';
import SalvageOpsView from '@/components/apps/station/SalvageOpsView';
import HaulerView from '@/components/apps/station/HaulerView';
import ManagementView from '@/components/apps/station/ManagementView';

const ROLES = [
  { id: 'salvage_operator', label: 'SALVAGE OPERATOR' },
  { id: 'cargo_hauler', label: 'CARGO HAULER' },
  { id: 'management', label: 'MANAGEMENT' },
];

/** Role-aware Station dashboard — each duty role sees only its relevant panels */
export default function StationContent() {
  const queryClient = useQueryClient();
  const { data: user, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const roleMutation = useMutation({
    mutationFn: (ops_role) => base44.auth.updateMe({ ops_role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user'] }),
  });

  if (isLoading) {
    return <div className="text-center py-12 text-xs font-mono text-muted-foreground">Loading station…</div>;
  }

  const role = user?.ops_role;

  return (
    <div className="h-full flex flex-col industrial-interior" style={{ background: 'hsl(30, 8%, 9%)' }}>
      {/* Header: who you are + role selector */}
      <div className="p-3 border-b flex items-center justify-between gap-3" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 7%)' }}>
        <div className="flex items-center gap-2 min-w-0">
          <MonitorDot className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="font-mono text-xs text-muted-foreground truncate">
            {user?.full_name || user?.email} — {role ? ROLES.find((r) => r.id === role)?.label : 'NO DUTY ROLE SET'}
          </span>
        </div>
        <Select value={role || ''} onValueChange={(v) => roleMutation.mutate(v)}>
          <SelectTrigger className="h-7 w-44 text-[10px] font-mono shrink-0" style={{ borderColor: 'hsl(33, 18%, 18%)' }}>
            <SelectValue placeholder="Set duty role" />
          </SelectTrigger>
          <SelectContent>
            {ROLES.map((r) => (
              <SelectItem key={r.id} value={r.id} className="text-xs font-mono">{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-auto p-4 font-mono">
        {!role ? (
          <div className="text-center py-12">
            <MonitorDot className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs font-mono text-muted-foreground">Select your duty role above to load your station view.</p>
          </div>
        ) : role === 'salvage_operator' ? (
          <SalvageOpsView />
        ) : role === 'cargo_hauler' ? (
          <HaulerView />
        ) : (
          <ManagementView />
        )}
      </div>
    </div>
  );
}