import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { openPaydayCycle } from '@/functions/openPaydayCycle';
import { closePaydayCycle } from '@/functions/closePaydayCycle';
import { Input } from '@/components/ui/input';
import { CalendarCheck, Timer, FileCheck2, Loader2, CheckCircle2, Coins, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow, format, differenceInHours } from 'date-fns';

const AMBER  = '#E0A22E';
const TEAL   = '#6FA08F';
const DIM    = '#7A6E60';
const DIMMER = '#3A3028';
const PANEL  = { background: '#111009', borderColor: '#2A2118' };

function fmt(n) {
  if (!n && n !== 0) return '—';
  if (Math.abs(n) >= 1_000_000) return `${(n/1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `${(n/1_000).toFixed(1)}k`;
  return Number(n).toLocaleString();
}

function SectionHead({ children, color }) {
  return (
    <div className="flex items-center gap-2 text-[9px] tracking-[0.28em] font-mono" style={{ color: color||'#B0793A' }}>
      <span className="w-3 h-px" style={{ background: color||'#B0793A' }} />
      {children}
      <span className="flex-1 h-px" style={{ background: 'rgba(90,62,28,0.2)' }} />
    </div>
  );
}

export function CycleReport({ cycle }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border" style={{ ...PANEL, borderColor: '#2A4A2A' }}>
      <button className="w-full flex items-center justify-between px-3 py-2.5 text-left" onClick={() => setExpanded(v=>!v)}>
        <div>
          <div className="text-[10px] font-bold" style={{ color: '#D8CFC0' }}>{cycle.cycle_name}{cycle.force_closed ? <span className="ml-2 text-[8px]" style={{ color: DIM }}>closed early</span> : ''}</div>
          <div className="text-[8px]" style={{ color: DIM }}>
            {cycle.published_at ? format(new Date(cycle.published_at), 'MMM d, HH:mm') : ''} · pool {fmt(cycle.pool_auec)} ¤ · {fmt(cycle.share_value_auec)}/sh
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[8px]" style={{ color: '#7BA05B' }}><CheckCircle2 className="w-3 h-3 inline mr-1" />PUBLISHED</span>
        </div>
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="overflow-hidden">
            <div className="px-3 pb-3 space-y-1 border-t" style={{ borderColor: '#1E1810' }}>
              {(cycle.report||[]).map(r => (
                <div key={r.handle} className="flex justify-between items-center py-1.5 border-b last:border-b-0" style={{ borderColor: '#1E1810' }}>
                  <span className="text-[10px] font-mono" style={{ color: '#D8CFC0' }}>
                    {r.handle} <span style={{ color: DIM }}>— {r.shares} sh</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold" style={{ color: r.decision==='cash_in' ? AMBER : DIM }}>
                    {r.decision==='cash_in' ? `CASHED → ${fmt(r.payout_auec)} ¤` : 'DEFERRED — rolls over'}
                  </span>
                </div>
              ))}
              <div className="text-[8px] pt-1" style={{ color: DIMMER }}>
                Paid: {fmt(cycle.total_paid_auec)} ¤ · Deferred: {cycle.deferred_shares||0} shares
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PaydayCycleDeck() {
  const queryClient = useQueryClient();
  const [pool, setPool] = useState('');
  const [working, setWorking] = useState(false);

  const { data: cycles = [] } = useQuery({ queryKey: ['payday_cycles'], queryFn: () => base44.entities.payday_cycle.list('-created_date', 20) });
  const { data: elections = [] } = useQuery({
    queryKey: ['payday_elections', cycles.find(c=>c.status==='open')?.id],
    queryFn: () => base44.entities.payday_election.filter({ cycle_id: cycles.find(c=>c.status==='open').id }),
    enabled: !!cycles.find(c=>c.status==='open'),
  });

  const openCycle = cycles.find(c=>c.status==='open');
  const publishedCycles = cycles.filter(c=>c.status==='published');
  const electionByHandle = Object.fromEntries(elections.map(e=>[e.handle,e]));
  const hoursLeft = openCycle ? Math.max(0, differenceInHours(new Date(openCycle.closes_at), new Date())) : 0;
  const urgentWindow = hoursLeft < 12 && hoursLeft > 0;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['payday_cycles'] });
    queryClient.invalidateQueries({ queryKey: ['payday_elections'] });
    queryClient.invalidateQueries({ queryKey: ['time_logs'] });
    queryClient.invalidateQueries({ queryKey: ['ledger_entries'] });
  };

  const handleOpen = async () => {
    setWorking(true);
    try { await openPaydayCycle(pool ? { pool_auec: parseFloat(pool) } : {}); setPool(''); refresh(); }
    finally { setWorking(false); }
  };

  const handleForceClose = async () => {
    if (!window.confirm('Close early and publish now? Unanswered elections default to DEFER.')) return;
    setWorking(true);
    try { await closePaydayCycle({ force: true, cycle_id: openCycle.id }); refresh(); }
    finally { setWorking(false); }
  };

  const poolUpdate = useMutation({
    mutationFn: (newPool) => base44.entities.payday_cycle.update(openCycle.id, {
      pool_auec: newPool,
      pool_source: 'Declared by management',
      share_value_auec: openCycle.total_shares > 0 ? Math.round((newPool/openCycle.total_shares)*100)/100 : 0,
    }),
    onSuccess: refresh,
  });

  const cashInCount = elections.filter(e=>e.decision==='cash_in').length;
  const deferCount = (openCycle?.shares_by_handle||[]).length - cashInCount;
  const estPayout = Math.round(cashInCount > 0 ? elections.filter(e=>e.decision==='cash_in').reduce((s,e)=>s+(e.shares_at_election||0),0) * (openCycle?.share_value_auec||0) : 0);

  return (
    <div className="p-4 space-y-5 font-mono">

      {/* Protocol banner */}
      <div className="border p-3 relative overflow-hidden" style={{ ...PANEL, borderColor: '#3A2A18' }}>
        <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ background: TEAL }} />
        <div className="pl-3">
          <div className="text-[9px] tracking-[0.2em] mb-1 flex items-center gap-1.5" style={{ color: '#B0793A' }}>
            <CalendarCheck className="w-3 h-3" /> ETHICAL PAY DAY PROTOCOL
          </div>
          <p className="text-[9px] leading-relaxed" style={{ color: DIM }}>
            Cycles open <span style={{ color: '#D8CFC0' }}>every Friday 09:00</span> automatically. Contractors get{' '}
            <span style={{ color: AMBER }}>72 hours</span> to elect CASH IN or DEFER.{' '}
            No response = defer — shares roll over in full and are <span style={{ color: TEAL }}>never forfeited</span>.{' '}
            A transparency report is published on close.
          </p>
        </div>
      </div>

      {/* Open cycle management */}
      {openCycle ? (
        <div>
          <SectionHead color={urgentWindow ? '#C05050' : undefined}>
            ACTIVE CYCLE — {openCycle.cycle_name}
          </SectionHead>
          <div className="mt-2 border p-4 space-y-4" style={{ ...PANEL, borderColor: urgentWindow ? '#5A2A2A' : '#3A2A18' }}>
            {/* Countdown */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4" style={{ color: urgentWindow ? '#C05050' : AMBER }} />
                <span className="text-lg font-bold font-mono" style={{ color: urgentWindow ? '#C05050' : AMBER }}>
                  {hoursLeft}h remaining
                </span>
                {urgentWindow && <AlertTriangle className="w-3.5 h-3.5" style={{ color: '#C05050' }} />}
              </div>
              <span className="text-[9px]" style={{ color: DIM }}>
                closes {formatDistanceToNow(new Date(openCycle.closes_at), { addSuffix: true }).toUpperCase()}
              </span>
            </div>

            {/* Pool stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'POOL', value: `${fmt(openCycle.pool_auec)} ¤` },
                { label: 'TOTAL SHARES', value: openCycle.total_shares },
                { label: 'SHARE VALUE', value: `${fmt(Math.round(openCycle.share_value_auec||0))} ¤` },
              ].map(s => (
                <div key={s.label} className="border p-2.5 text-center" style={PANEL}>
                  <div className="text-[8px]" style={{ color: DIMMER }}>{s.label}</div>
                  <div className="text-sm font-bold font-mono" style={{ color: AMBER }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div className="text-[8px]" style={{ color: DIMMER }}>Pool source: {openCycle.pool_source}</div>

            {/* Update pool */}
            <div className="flex gap-2">
              <Input type="number" min="0" placeholder="Adjust pool (aUEC)" value={pool} onChange={e=>setPool(e.target.value)}
                className="h-8 text-xs font-mono bg-transparent flex-1" style={{ borderColor: '#2A2118' }} />
              <button disabled={!pool||poolUpdate.isPending} onClick={() => { poolUpdate.mutate(parseFloat(pool)); setPool(''); }}
                className="px-3 h-8 text-[10px] font-mono font-bold disabled:opacity-40"
                style={{ border:`1px solid #3A2810`, background:'#2A1E0C', color: AMBER }}>
                UPDATE POOL
              </button>
            </div>

            {/* Live elections */}
            <div>
              <div className="text-[8px] tracking-[0.2em] mb-2 flex items-center justify-between" style={{ color: DIMMER }}>
                <span>ELECTIONS ({elections.length}/{(openCycle.shares_by_handle||[]).length})</span>
                <span>CASH IN {cashInCount} · DEFER {deferCount} · EST. PAYOUT {fmt(estPayout)} ¤</span>
              </div>
              <div className="space-y-1">
                {(openCycle.shares_by_handle||[]).map(s => {
                  const e = electionByHandle[s.handle];
                  return (
                    <div key={s.handle} className="flex justify-between items-center px-2.5 py-1.5 border" style={{ borderColor: '#1E1810', background: '#0C0A07' }}>
                      <span className="text-[10px] font-mono" style={{ color: '#D8CFC0' }}>
                        {s.handle} <span style={{ color: DIM }}>— {s.shares} sh</span>
                      </span>
                      <span className="text-[9px] font-mono px-2 py-0.5" style={{
                        color: e ? (e.decision==='cash_in' ? AMBER : TEAL) : DIM,
                        border: `1px solid ${e ? (e.decision==='cash_in' ? AMBER : TEAL) : DIMMER}44`,
                        background: `${e ? (e.decision==='cash_in' ? AMBER : TEAL) : DIMMER}0C`,
                      }}>
                        {e ? (e.decision==='cash_in' ? 'CASH IN' : 'DEFER') : 'AWAITING (→ DEFER)'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <button disabled={working} onClick={handleForceClose}
              className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-mono font-bold disabled:opacity-40"
              style={{ border:`1px solid #5A2A2A`, background:'#2A1010', color:'#C05050' }}>
              {working ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
              CLOSE EARLY & PUBLISH FINAL REPORT
            </button>
          </div>
        </div>
      ) : (
        <div>
          <SectionHead>OPEN NEW CYCLE</SectionHead>
          <div className="mt-2 border p-4 space-y-3" style={{ ...PANEL, borderColor: '#3A2A18' }}>
            <div className="text-[9px]" style={{ color: DIM }}>
              No cycle open. Next auto-opens <span style={{ color: '#D8CFC0' }}>Friday 09:00</span>. You can open one now with a declared pool.
            </div>
            <div className="flex gap-2">
              <Input type="number" min="0" placeholder="Pool aUEC (blank = auto from 7-day ledger net)" value={pool} onChange={e=>setPool(e.target.value)}
                className="h-8 text-xs font-mono bg-transparent flex-1" style={{ borderColor: '#2A2118' }} />
              <button disabled={working} onClick={handleOpen}
                className="flex items-center gap-1.5 px-4 h-8 text-[10px] font-bold font-mono disabled:opacity-40"
                style={{ background:'#2A1E0C', border:`1px solid #B0793A`, color: AMBER, clipPath:'polygon(6px 0,100% 0,calc(100%-6px) 100%,0 100%)' }}>
                {working ? <Loader2 className="w-3 h-3 animate-spin" /> : <Coins className="w-3 h-3" />}
                OPEN CYCLE NOW
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Archive */}
      <div>
        <SectionHead>
          <FileCheck2 className="w-3 h-3 inline mr-1" />
          TRANSPARENCY ARCHIVE ({publishedCycles.length})
        </SectionHead>
        <div className="mt-2 space-y-1.5">
          {publishedCycles.length === 0 ? (
            <div className="border p-8 text-center text-[9px]" style={{ ...PANEL, color: DIM }}>No published reports yet.</div>
          ) : publishedCycles.map(c => <CycleReport key={c.id} cycle={c} />)}
        </div>
      </div>
    </div>
  );
}