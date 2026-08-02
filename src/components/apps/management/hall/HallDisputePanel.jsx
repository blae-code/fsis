import React from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ruleHallDispute } from '@/functions/ruleHallDispute';
import { Loader2, Scale } from 'lucide-react';
import HallDisputeCard from '@/components/apps/management/hall/HallDisputeCard';

/** Disputes in front of the Owners: what is waiting on a ruling, and what has been ruled. */
export default function HallDisputePanel() {
  const qc = useQueryClient();
  const { data: disputes = [], isLoading } = useQuery({
    queryKey: ['hall_disputes'],
    queryFn: () => base44.entities.hall_dispute.list('-raised_at', 100),
    refetchInterval: 30000,
  });

  const rule = useMutation({
    mutationFn: (payload) => ruleHallDispute(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hall_disputes'] });
      qc.invalidateQueries({ queryKey: ['hall'] });
    },
  });

  const open = disputes.filter((d) => d.status === 'open');
  const ruled = disputes.filter((d) => d.status === 'ruled');
  const err = rule.error?.response?.data?.error || rule.error?.message;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[9px] tracking-[0.22em]" style={{ color: '#E0A22E' }}>
        <Scale className="w-3.5 h-3.5" /> DISPUTES — {open.length} AWAITING A RULING
      </div>
      <p className="text-[9px] leading-relaxed max-w-3xl" style={{ color: '#8A7E6C' }}>
        Every remedy here is something the hall can actually do — it cannot reverse a payment or recover
        an item, so it does not offer to. Whether a ruling touches standing is decided explicitly and
        apart from the remedy: most disputes are two comrades describing the same evening differently.
      </p>

      {err && <p className="text-[9px] border p-2" style={{ color: '#D08A6A', borderColor: '#5C302A', background: '#140B08' }}>{err}</p>}

      {isLoading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin" style={{ color: '#E0A22E' }} /></div>
      ) : disputes.length === 0 ? (
        <p className="text-[9px] py-4 text-center border" style={{ color: '#6B6155', borderColor: '#2E2519' }}>
          No disputes on record. A quiet hall is a hall where handoffs happen as agreed.
        </p>
      ) : (
        <div className="space-y-2">
          {open.map((d) => (
            <HallDisputeCard key={d.id} dispute={d} pending={rule.isPending} onRule={(p) => rule.mutate(p)} />
          ))}
          {ruled.length > 0 && (
            <>
              <div className="text-[7px] font-bold tracking-[0.2em] pt-2" style={{ color: '#6B6155' }}>RULED — THE RECORD STANDS</div>
              {ruled.map((d) => (
                <HallDisputeCard key={d.id} dispute={d} pending={false} onRule={() => {}} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}