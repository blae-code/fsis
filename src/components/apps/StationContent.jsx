import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import ContractorStationHeader from '@/components/apps/station/ContractorStationHeader';
import SalvageOpsView from '@/components/apps/station/SalvageOpsView';
import HaulerView from '@/components/apps/station/HaulerView';
import ManagementView from '@/components/apps/station/ManagementView';
import ContractorPaydayView from '@/components/apps/station/ContractorPaydayView';

const AMBER = '#E0A22E';
const TEAL  = '#6FA08F';
const DIM   = '#7A6E60';

const ROLE_EMPTY = {
  salvage_operator: { icon: '⬡', color: AMBER, hint: 'Shows active salvage runs, uncommitted stock and best sell terminals.' },
  cargo_hauler:     { icon: '▶', color: TEAL,  hint: 'Shows cargo lots awaiting haul, delivery queue and saved routes.' },
  management:       { icon: '◈', color: '#6FA0C8', hint: 'Shows ops summary across all FSIS divisions.' },
};

export default function StationContent() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  // My share balance for header display
  const { data: paydayData } = useQuery({
    queryKey: ['contractor_payday'],
    queryFn: async () => {
      try {
        return (await import('@/functions/contractorPayday').then(m => m.contractorPayday({}))).data;
      } catch { return null; }
    },
  });

  const roleMutation = useMutation({
    mutationFn: (ops_role) => base44.auth.updateMe({ ops_role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user'] }),
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center" style={{ background: '#0A0806' }}>
        <Loader2 className="w-4 h-4 animate-spin" style={{ color: AMBER }} />
      </div>
    );
  }

  const role = user?.ops_role;
  const myShares = paydayData?.my_shares || 0;

  return (
    <div className="h-full flex flex-col font-mono" style={{ background: 'hsl(30, 8%, 9%)' }}>
      {/* Operator identity header */}
      <div className="p-3 border-b shrink-0" style={{ borderColor: '#2A2118' }}>
        <ContractorStationHeader
          user={user}
          role={role}
          myShares={myShares}
          onRoleChange={(r) => roleMutation.mutate(r)}
        />
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Pay day panel always visible */}
        <ContractorPaydayView />

        {/* Role-specific view */}
        {!role ? (
          <div className="border p-8 text-center" style={{ background: '#0E0C09', borderColor: '#2A2118' }}>
            <div className="text-[10px] tracking-[0.2em] mb-3" style={{ color: DIM }}>SELECT DUTY ROLE ABOVE</div>
            <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
              {Object.entries(ROLE_EMPTY).map(([id, m]) => (
                <button
                  key={id}
                  onClick={() => roleMutation.mutate(id)}
                  className="border p-3 text-center transition-all"
                  style={{ borderColor: '#2A2118', background: '#0A0806' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = m.color; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2A2118'; }}
                >
                  <div className="text-lg mb-1" style={{ color: m.color }}>{m.icon}</div>
                  <div className="text-[7px] tracking-[0.1em]" style={{ color: DIM }}>
                    {id.replace('_', ' ').toUpperCase()}
                  </div>
                </button>
              ))}
            </div>
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