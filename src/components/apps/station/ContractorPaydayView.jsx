import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { contractorPayday } from '@/functions/contractorPayday';
import { submitPaydayElection } from '@/functions/submitPaydayElection';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { CycleCountdown, CycleReport } from '@/components/apps/fairshare/PaydayCyclePanel';

const AMBER  = '#E0A22E';
const TEAL   = '#6FA08F';
const DIM    = '#7A6E60';
const DIMMER = '#3A3028';
const PANEL  = { background: '#0E0C09', borderColor: '#2A2118' };

export default function ContractorPaydayView() {
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['contractor_payday'],
    queryFn: async () => (await contractorPayday({})).data,
  });

  if (isLoading) {
    return (
      <div className="border p-4 flex items-center gap-2 font-mono" style={PANEL}>
        <Loader2 className="w-3 h-3 animate-spin" style={{ color: AMBER }} />
        <span className="text-[10px]" style={{ color: DIM }}>LOADING PAY DAY STATUS…</span>
      </div>
    );
  }

  const { linked, handle, my_shares, open_cycle, my_election, last_report } = data || {};
  const shareValue = open_cycle?.share_value_auec || 0;
  const estPayout  = Math.round((my_shares || 0) * shareValue);
  const windowClosed = open_cycle && new Date(open_cycle.closes_at) <= new Date();

  const elect = async (decision) => {
    setSubmitting(true);
    try {
      await submitPaydayElection({ decision });
      queryClient.invalidateQueries({ queryKey: ['contractor_payday'] });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-3 font-mono">
      {/* Header */}
      <div className="border px-3 py-2 flex items-center justify-between" style={PANEL}>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5" style={{ background: AMBER }} />
          <span className="text-[10px] tracking-[0.2em]" style={{ color: '#B0793A' }}>
            MY PAY DAY{handle ? ` — ${handle.toUpperCase()}` : ''}
          </span>
        </div>
        {my_shares > 0 && (
          <span className="text-[10px] font-mono" style={{ color: AMBER }}>
            {my_shares} SHARE{my_shares !== 1 ? 'S' : ''} BANKED
          </span>
        )}
      </div>

      {!linked ? (
        <div className="border p-4 text-center" style={PANEL}>
          <div className="text-[10px]" style={{ color: DIM }}>
            Account not linked to crew roster. Ask management to match your callsign.
          </div>
        </div>
      ) : open_cycle ? (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {/* Countdown ring + share info */}
          <div className="grid grid-cols-[auto_1fr] gap-3">
            <CycleCountdown cycle={open_cycle} />
            <div className="border p-3 space-y-2" style={PANEL}>
              <div className="text-[8px] tracking-[0.18em]" style={{ color: DIMMER }}>YOUR POSITION</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'SHARES', value: my_shares || 0, color: '#D8CFC0' },
                  { label: 'SHARE VALUE', value: `${Math.round(shareValue).toLocaleString()}`, color: AMBER },
                  { label: 'EST. PAYOUT', value: estPayout.toLocaleString(), color: AMBER },
                ].map((s) => (
                  <div key={s.label} className="border px-2 py-1.5 text-center" style={{ borderColor: DIMMER, background: '#0A0806' }}>
                    <div className="text-[7px] tracking-[0.15em]" style={{ color: DIMMER }}>{s.label}</div>
                    <div className="text-xs font-bold font-mono mt-0.5" style={{ color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>
              {my_election && (
                <div className="text-[9px] flex items-center gap-2" style={{ color: DIM }}>
                  ELECTION:
                  <span className="px-1.5 py-0.5 text-[8px] font-bold tracking-[0.1em]"
                    style={{
                      color: my_election.decision === 'cash_in' ? AMBER : DIM,
                      border: `1px solid ${my_election.decision === 'cash_in' ? AMBER : DIMMER}55`,
                      background: my_election.decision === 'cash_in' ? `${AMBER}14` : 'transparent',
                    }}>
                    {my_election.decision === 'cash_in' ? 'CASH IN' : 'DEFER'}
                  </span>
                  <span style={{ color: DIMMER }}>— changeable until window closes</span>
                </div>
              )}
              {!my_election && (
                <div className="text-[9px]" style={{ color: DIMMER }}>
                  No election yet — no response = DEFER (shares roll over, never forfeited)
                </div>
              )}
            </div>
          </div>

          {/* Decision buttons */}
          {!windowClosed && (my_shares || 0) > 0 && (
            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={submitting || my_election?.decision === 'cash_in'}
                onClick={() => elect('cash_in')}
                className="h-10 text-[10px] tracking-[0.15em] font-mono border transition-all disabled:opacity-40"
                style={{ borderColor: AMBER, color: AMBER, background: `${AMBER}14` }}
              >
                {submitting ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : `CASH IN — ~${estPayout.toLocaleString()} aUEC`}
              </button>
              <button
                disabled={submitting || my_election?.decision === 'defer'}
                onClick={() => elect('defer')}
                className="h-10 text-[10px] tracking-[0.15em] font-mono border transition-all disabled:opacity-40"
                style={{ borderColor: DIMMER, color: DIM }}
              >
                DEFER — ROLL OVER
              </button>
            </div>
          )}
        </motion.div>
      ) : (
        <div className="border p-4" style={PANEL}>
          <div className="text-[10px]" style={{ color: DIM }}>
            No pay day window open. Banked shares: <span style={{ color: AMBER }}>{my_shares || 0}</span>
            <span className="block mt-1" style={{ color: DIMMER }}>Next cycle opens Friday 09:00. You'll have 72 hours to decide.</span>
          </div>
        </div>
      )}

      {/* Last published report */}
      {last_report && (
        <div className="space-y-2">
          <div className="text-[8px] tracking-[0.2em]" style={{ color: DIMMER }}>LATEST PUBLISHED REPORT — FULL TRANSPARENCY</div>
          <CycleReport cycle={last_report} />
        </div>
      )}
    </div>
  );
}