import React from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settleHallObligation } from '@/functions/settleHallObligation';
import { Loader2, Coins } from 'lucide-react';
import ObligationRow from '@/components/apps/management/hall/ObligationRow';

/** Collections: what is owed to the hall, by whom, and how overdue. */
export default function CollectionsPanel() {
  const qc = useQueryClient();
  const { data: obligations = [], isLoading } = useQuery({
    queryKey: ['hall_obligations'],
    queryFn: () => base44.entities.hall_obligation.list('-incurred_at', 100),
    refetchInterval: 30000,
  });

  const settle = useMutation({
    mutationFn: (payload) => settleHallObligation(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hall_obligations'] }),
  });

  const open = obligations.filter((o) => !['paid', 'waived', 'void'].includes(o.status));
  const closed = obligations.filter((o) => ['paid', 'waived', 'void'].includes(o.status));
  const outstanding = open.reduce((sum, o) => sum + Number(o.amount_auec || 0), 0);
  const suspended = open.filter((o) => o.listing_suspended).length;
  const err = settle.error?.response?.data?.error || settle.error?.message;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[9px] tracking-[0.22em]" style={{ color: '#E0A22E' }}>
        <Coins className="w-3.5 h-3.5" /> COLLECTIONS — {outstanding.toLocaleString()} aUEC OUTSTANDING
        {suspended > 0 && <span style={{ color: '#C05050' }}>· {suspended} LISTING SUSPENSION{suspended > 1 ? 'S' : ''}</span>}
      </div>
      <p className="text-[9px] leading-relaxed max-w-3xl" style={{ color: '#8A7E6C' }}>
        The hall records what is owed; it never holds the money. Forgiving a debt is an ordinary outcome
        rather than an exception — a comrade who cannot pay is not what the ladder exists for. Settling or
        forgiving lifts any listing suspension at once, because a suspension that outlives the debt is a
        punishment nobody decided to impose.
      </p>

      {err && <p className="text-[9px] border p-2" style={{ color: '#D08A6A', borderColor: '#5C302A', background: '#140B08' }}>{err}</p>}

      {isLoading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin" style={{ color: '#E0A22E' }} /></div>
      ) : obligations.length === 0 ? (
        <p className="text-[9px] py-4 text-center border" style={{ color: '#6B6155', borderColor: '#2E2519' }}>
          Nothing is owed to the hall.
        </p>
      ) : (
        <div className="space-y-2">
          {open.map((o) => (
            <ObligationRow key={o.id} obligation={o} pending={settle.isPending} onSettle={(p) => settle.mutate(p)} />
          ))}
          {closed.length > 0 && (
            <>
              <div className="text-[7px] font-bold tracking-[0.2em] pt-2" style={{ color: '#6B6155' }}>CLOSED — THE RECORD STANDS</div>
              {closed.map((o) => (
                <ObligationRow key={o.id} obligation={o} pending={false} onSettle={() => {}} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}