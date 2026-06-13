import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { openPaydayCycle } from '@/functions/openPaydayCycle';
import { closePaydayCycle } from '@/functions/closePaydayCycle';
import { motion } from 'framer-motion';
import { Loader2, FileCheck2, CalendarCheck } from 'lucide-react';
import { CycleCountdown, CycleReport } from '@/components/apps/fairshare/PaydayCyclePanel';

const AMBER  = '#E0A22E';
const DIM    = '#7A6E60';
const DIMMER = '#3A3028';
const PANEL  = { background: '#0E0C09', borderColor: '#2A2118' };

function Stat({ label, value }) {
  return (
    <div className="border px-2 py-1.5 text-center" style={{ borderColor: DIMMER, background: '#0A0806' }}>
      <div className="text-[7px] tracking-[0.15em]" style={{ color: DIMMER }}>{label}</div>
      <div className="text-xs font-bold font-mono mt-0.5" style={{ color: AMBER }}>{value}</div>
    </div>
  );
}

export default function PaydayCycles() {
  const queryClient = useQueryClient();
  const [pool, setPool] = useState('');
  const [working, setWorking] = useState(false);

  const { data: cycles = [] } = useQuery({
    queryKey: ['payday_cycles'],
    queryFn: () => base44.entities.payday_cycle.list('-created_date', 20),
  });
  const openCycle      = cycles.find((c) => c.status === 'open');
  const publishedCycles = cycles.filter((c) => c.status === 'published');

  const { data: elections = [] } = useQuery({
    queryKey: ['payday_elections', openCycle?.id],
    queryFn: () => base44.entities.payday_election.filter({ cycle_id: openCycle.id }),
    enabled: !!openCycle,
  });
  const electionByHandle = Object.fromEntries(elections.map((e) => [e.handle, e]));

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['payday_cycles'] });
    queryClient.invalidateQueries({ queryKey: ['payday_elections'] });
    queryClient.invalidateQueries({ queryKey: ['time_logs'] });
    queryClient.invalidateQueries({ queryKey: ['ledger_entries'] });
  };

  const poolUpdate = useMutation({
    mutationFn: (newPool) => base44.entities.payday_cycle.update(openCycle.id, {
      pool_auec: newPool,
      pool_source: 'Declared by management',
      share_value_auec: openCycle.total_shares > 0 ? Math.round((newPool / openCycle.total_shares) * 100) / 100 : 0,
    }),
    onSuccess: refresh,
  });

  const handleOpen = async () => {
    setWorking(true);
    try {
      await openPaydayCycle(pool ? { pool_auec: parseFloat(pool) } : {});
      setPool(''); refresh();
    } finally { setWorking(false); }
  };

  const handleForceClose = async () => {
    if (!window.confirm('Close the decision window early and publish the final report now? Unanswered elections default to DEFER — shares roll over, never forfeited.')) return;
    setWorking(true);
    try {
      await closePaydayCycle({ force: true, cycle_id: openCycle.id });
      refresh();
    } finally { setWorking(false); }
  };

  return (
    <div className="p-4 space-y-4 font-mono">
      {/* Protocol banner */}
      <div className="border p-3" style={{ ...PANEL, borderColor: `${AMBER}33` }}>
        <div className="flex items-center gap-1.5 text-[9px] tracking-[0.2em] mb-1.5" style={{ color: AMBER }}>
          <CalendarCheck className="w-3 h-3" /> ETHICAL PAY DAY PROTOCOL
        </div>
        <p className="text-[9px] leading-relaxed" style={{ color: DIM }}>
          Cycles open every <span style={{ color: AMBER }}>Friday 09:00</span>. Contractors get <span style={{ color: AMBER }}>72 hours</span> to elect CASH IN or DEFER.
          No response = defer — shares roll over in full and are <span style={{ color: AMBER }}>never forfeited</span>.
        </p>
      </div>

      {openCycle ? (
        <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {/* Countdown + pool stats */}
          <div className="grid grid-cols-[auto_1fr] gap-3">
            <CycleCountdown cycle={openCycle} />
            <div className="border p-3 space-y-2" style={PANEL}>
              <div className="text-[8px] tracking-[0.18em]" style={{ color: DIMMER }}>CYCLE — {openCycle.cycle_name}</div>
              <div className="grid grid-cols-3 gap-2">
                <Stat label="POOL" value={`${(openCycle.pool_auec || 0).toLocaleString()} aUEC`} />
                <Stat label="TOTAL SHARES" value={openCycle.total_shares || 0} />
                <Stat label="SHARE VALUE" value={`${Math.round(openCycle.share_value_auec || 0).toLocaleString()} aUEC`} />
              </div>
              <div className="text-[8px]" style={{ color: DIMMER }}>Source: {openCycle.pool_source}</div>
            </div>
          </div>

          {/* Adjust pool */}
          <div className="flex gap-2">
            <input
              type="number" min="0"
              placeholder="Adjust pool (aUEC)"
              value={pool} onChange={(e) => setPool(e.target.value)}
              className="flex-1 h-8 bg-transparent border px-2 text-xs font-mono outline-none focus:border-amber-600/60"
              style={{ borderColor: '#2A2118', color: '#D8CFC0' }}
            />
            <button
              disabled={!pool || poolUpdate.isPending}
              onClick={() => { poolUpdate.mutate(parseFloat(pool)); setPool(''); }}
              className="h-8 px-3 text-[9px] border font-mono tracking-[0.1em] disabled:opacity-40 transition-all"
              style={{ borderColor: DIMMER, color: DIM }}
            >
              UPDATE POOL
            </button>
          </div>

          {/* Live elections */}
          <div className="border" style={PANEL}>
            <div className="px-3 py-2 border-b text-[9px] tracking-[0.18em]" style={{ borderColor: '#2A2118', color: DIM }}>
              ELECTIONS ({elections.length}/{(openCycle.shares_by_handle || []).length})
            </div>
            {(openCycle.shares_by_handle || []).map((s, i) => {
              const e = electionByHandle[s.handle];
              return (
                <div key={s.handle}
                  className="flex justify-between items-center px-3 py-2 border-b last:border-b-0 text-[10px]"
                  style={{ borderColor: DIMMER }}>
                  <span style={{ color: '#D8CFC0' }}>
                    {s.handle} <span style={{ color: DIMMER }}>— {s.shares} sh</span>
                  </span>
                  {e ? (
                    <span className="text-[8px] px-1.5 py-0.5 font-bold tracking-[0.1em]"
                      style={{
                        color: e.decision === 'cash_in' ? AMBER : DIM,
                        border: `1px solid ${e.decision === 'cash_in' ? AMBER : DIMMER}55`,
                        background: e.decision === 'cash_in' ? `${AMBER}14` : 'transparent',
                      }}>
                      {e.decision === 'cash_in' ? 'CASH IN' : 'DEFER'}
                    </span>
                  ) : (
                    <span className="text-[8px]" style={{ color: DIMMER }}>AWAITING — defaults to DEFER</span>
                  )}
                </div>
              );
            })}
          </div>

          <button
            disabled={working}
            onClick={handleForceClose}
            className="w-full h-9 text-[9px] tracking-[0.15em] border font-mono transition-all disabled:opacity-40"
            style={{ borderColor: '#C0505055', color: '#C05050', background: '#C0505008' }}
          >
            {working ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'CLOSE EARLY & PUBLISH FINAL REPORT'}
          </button>
        </motion.div>
      ) : (
        <div className="border p-3 space-y-2" style={PANEL}>
          <div className="text-[9px] tracking-[0.18em]" style={{ color: DIM }}>NO CYCLE OPEN — NEXT AUTO-OPEN: FRIDAY 09:00</div>
          <div className="flex gap-2">
            <input
              type="number" min="0"
              placeholder="Pool aUEC (blank = auto from 7-day ledger net)"
              value={pool} onChange={(e) => setPool(e.target.value)}
              className="flex-1 h-8 bg-transparent border px-2 text-xs font-mono outline-none focus:border-amber-600/60"
              style={{ borderColor: '#2A2118', color: '#D8CFC0' }}
            />
            <button
              disabled={working}
              onClick={handleOpen}
              className="h-8 px-3 text-[9px] border font-mono tracking-[0.1em] disabled:opacity-40 transition-all"
              style={{ borderColor: AMBER, color: AMBER, background: `${AMBER}0E` }}
            >
              {working ? <Loader2 className="w-3 h-3 animate-spin" /> : 'OPEN CYCLE NOW'}
            </button>
          </div>
          <p className="text-[8px]" style={{ color: DIMMER }}>Opening starts the 72-hour decision window for all linked crew members.</p>
        </div>
      )}

      {/* Published archive */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-[9px] tracking-[0.18em]" style={{ color: DIM }}>
          <FileCheck2 className="w-3 h-3" /> PUBLISHED REPORTS ({publishedCycles.length})
        </div>
        {publishedCycles.length === 0 ? (
          <div className="border py-6 text-center" style={PANEL}>
            <span className="text-[10px]" style={{ color: DIMMER }}>No reports published yet.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {publishedCycles.map((c) => <CycleReport key={c.id} cycle={c} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// Re-export for backward compat
export { CycleReport } from '@/components/apps/fairshare/PaydayCyclePanel';