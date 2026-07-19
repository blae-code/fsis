import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { contractorPayday } from '@/functions/contractorPayday';
import { submitPaydayElection } from '@/functions/submitPaydayElection';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Coins, Loader2, Shield, Anchor, Briefcase, MonitorDot, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { formatDistanceToNow, differenceInHours } from 'date-fns';
import { CycleReport } from '@/components/apps/fairshare/PaydayCycleDeck';
import SalvageOpsView from '@/components/apps/station/SalvageOpsView';
import HaulerView from '@/components/apps/station/HaulerView';
import ManagementCommandDeck from '@/components/apps/management/ManagementCommandDeck';

// ─── Theme ────────────────────────────────────────────────────────────────────
const AMBER  = '#E0A22E';
const TEAL   = '#6FA08F';
const DIM    = '#7A6E60';
const DIMMER = '#3A3028';
const PANEL  = { background: '#111009', borderColor: '#2A2118' };

function fmt(n) {
  if (!n && n !== 0) return '—';
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return Number(n).toLocaleString();
}

function SectionHead({ children }) {
  return (
    <div className="flex items-center gap-2 text-[9px] tracking-[0.28em] font-mono" style={{ color: '#B0793A' }}>
      <span className="w-3 h-px" style={{ background: '#B0793A' }} />
      {children}
      <span className="flex-1 h-px" style={{ background: 'rgba(90,62,28,0.2)' }} />
    </div>
  );
}

const ROLES = [
  { id: 'salvage_operator', label: 'SALVAGE OPERATOR', icon: Anchor },
  { id: 'cargo_hauler',     label: 'CARGO HAULER',      icon: Briefcase },
  { id: 'management',       label: 'MANAGEMENT',         icon: Shield },
];

// ─── Payday Widget ────────────────────────────────────────────────────────────
function PaydayWidget({ handle }) {
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['contractor_payday'],
    queryFn: async () => (await contractorPayday({})).data,
  });

  const elect = async (decision) => {
    setSubmitting(true);
    try {
      await submitPaydayElection({ decision });
      queryClient.invalidateQueries({ queryKey: ['contractor_payday'] });
    } finally { setSubmitting(false); }
  };

  if (isLoading) return (
    <div className="border p-4 flex items-center gap-2 text-[10px]" style={{ ...PANEL, color: DIM }}>
      <Loader2 className="w-3 h-3 animate-spin" style={{ color: AMBER }} /> Loading pay day status…
    </div>
  );

  const { linked, my_shares, open_cycle, my_election, last_report } = data || {};
  const shareValue = open_cycle?.share_value_auec || 0;
  const estPayout = Math.round((my_shares || 0) * shareValue);
  const windowClosed = open_cycle && new Date(open_cycle.closes_at) <= new Date();
  const hoursLeft = open_cycle ? Math.max(0, differenceInHours(new Date(open_cycle.closes_at), new Date())) : 0;
  const urgentWindow = hoursLeft < 12 && hoursLeft > 0;

  return (
    <div className="space-y-3">
      {/* Shares banner */}
      <div className="border p-4 relative overflow-hidden" style={{ ...PANEL, borderColor: open_cycle ? (urgentWindow ? '#C05050' : '#5C4424') : '#2A2118' }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(224,162,46,0.03) 0%, transparent 60%)' }} />
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[8px] tracking-[0.22em]" style={{ color: '#B0793A' }}>
              <Coins className="w-3 h-3 inline mr-1.5" style={{ color: AMBER }} />
              YOUR SHARES
            </div>
            <div className="text-3xl font-bold font-mono mt-1" style={{ color: AMBER }}>{my_shares || 0}</div>
            <div className="text-[9px] mt-0.5" style={{ color: TEAL }}>
              {shareValue > 0 ? `@ ${fmt(shareValue)} ¤/share = ${fmt(estPayout)} ¤ est.` : 'No open cycle'}
            </div>
          </div>
          {!linked && (
            <div className="border px-2.5 py-1.5 text-[9px]" style={{ borderColor: '#C8893B55', color: '#C8893B', background: '#C8893B0C' }}>
              NOT LINKED — ask management to link your callsign
            </div>
          )}
          {open_cycle && (
            <div className="text-right">
              <div className="text-[8px]" style={{ color: DIMMER }}>WINDOW</div>
              <div className="text-[11px] font-mono font-bold" style={{ color: urgentWindow ? '#C05050' : TEAL }}>
                {hoursLeft}h left
              </div>
              <div className="text-[8px]" style={{ color: DIMMER }}>
                {formatDistanceToNow(new Date(open_cycle.closes_at), { addSuffix: true }).toUpperCase()}
              </div>
            </div>
          )}
        </div>

        {/* Election buttons */}
        {open_cycle && !windowClosed && (my_shares || 0) > 0 && linked && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button
              disabled={submitting || my_election?.decision === 'cash_in'}
              onClick={() => elect('cash_in')}
              className="flex items-center justify-center gap-2 py-2.5 text-[10px] font-bold tracking-[0.1em] disabled:opacity-40 transition-opacity"
              style={{
                background: my_election?.decision === 'cash_in' ? '#3A5A18' : '#2A1E0C',
                border: `1px solid ${my_election?.decision === 'cash_in' ? '#7BA05B' : AMBER}`,
                color: my_election?.decision === 'cash_in' ? '#7BA05B' : AMBER,
                clipPath: 'polygon(8px 0,100% 0,calc(100%-8px) 100%,0 100%)',
              }}>
              {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
              CASH IN — ~{fmt(estPayout)} ¤
            </button>
            <button
              disabled={submitting || my_election?.decision === 'defer'}
              onClick={() => elect('defer')}
              className="flex items-center justify-center gap-2 py-2.5 text-[10px] font-bold tracking-[0.1em] disabled:opacity-40 transition-opacity"
              style={{
                background: my_election?.decision === 'defer' ? '#1A2A3A' : 'transparent',
                border: `1px solid ${my_election?.decision === 'defer' ? TEAL : '#2A2118'}`,
                color: my_election?.decision === 'defer' ? TEAL : DIM,
                clipPath: 'polygon(8px 0,100% 0,calc(100%-8px) 100%,0 100%)',
              }}>
              <Clock className="w-3 h-3" />
              DEFER — ROLL OVER
            </button>
          </div>
        )}

        {my_election && (
          <div className="mt-2 text-[9px] flex items-center gap-1.5" style={{ color: DIM }}>
            <ArrowRight className="w-3 h-3" />
            Election locked: <span className="font-bold" style={{ color: my_election.decision === 'cash_in' ? AMBER : TEAL }}>
              {my_election.decision === 'cash_in' ? 'CASH IN' : 'DEFER'}</span> — change it any time before window closes.
          </div>
        )}

        {!open_cycle && (
          <p className="mt-2 text-[9px]" style={{ color: DIM }}>
            No cycle open. Next auto-opens Friday 09:00. Your shares bank safely until then — nothing forfeited.
          </p>
        )}
      </div>

      {/* Last report */}
      {last_report && (
        <div className="space-y-1.5">
          <div className="text-[8px] tracking-[0.22em]" style={{ color: DIMMER }}>LATEST PUBLISHED REPORT</div>
          <CycleReport cycle={last_report} />
        </div>
      )}
    </div>
  );
}

// ─── Role selector cards ──────────────────────────────────────────────────────
function RoleSelector({ role, onSelect }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {ROLES.map(r => {
        const Icon = r.icon;
        const active = role === r.id;
        return (
          <button key={r.id} onClick={() => onSelect(r.id)}
            className="border p-3 text-left transition-all"
            style={{
              background: active ? '#2A1E0C' : '#0C0A07',
              borderColor: active ? AMBER : '#2A2118',
            }}>
            <Icon className="w-4 h-4 mb-2" style={{ color: active ? AMBER : DIM }} />
            <div className="text-[9px] tracking-[0.18em] font-mono font-bold" style={{ color: active ? AMBER : DIM }}>{r.label}</div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function ContractorStationDeck() {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({ queryKey: ['user'], queryFn: () => base44.auth.me() });

  const roleMutation = useMutation({
    mutationFn: (ops_role) => base44.auth.updateMe({ ops_role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user'] }),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-16 font-mono">
      <Loader2 className="w-4 h-4 animate-spin mr-2" style={{ color: AMBER }} />
      <span className="text-[10px]" style={{ color: DIM }}>Loading station…</span>
    </div>
  );

  const role = user?.ops_role;

  return (
    <div className="p-4 space-y-5 font-mono">

      {/* ── Operator identity banner ──────────────────────────────────────── */}
      <div className="border p-3 flex items-center gap-3" style={{ ...PANEL, borderColor: '#3A2A18' }}>
        <div className="w-8 h-8 border flex items-center justify-center shrink-0" style={{ borderColor: '#5C4424', background: '#1A130A' }}>
          <MonitorDot className="w-4 h-4" style={{ color: AMBER }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-bold truncate" style={{ color: '#D8CFC0' }}>
            {user?.full_name || 'OPERATOR'} 
            {user?.ops_role && <span className="ml-2 text-[9px] font-normal" style={{ color: TEAL }}>— {ROLES.find(r=>r.id===user.ops_role)?.label}</span>}
          </div>
          <div className="text-[9px]" style={{ color: DIM }}>FSIS STATION TERMINAL · ACTIVE SESSION</div>
        </div>
        <div className="shrink-0">
          <div className="text-[8px] tracking-[0.15em] mb-1" style={{ color: DIMMER }}>DUTY ROLE</div>
          <Select value={role||''} onValueChange={v => roleMutation.mutate(v)}>
            <SelectTrigger className="h-7 w-44 text-[10px] font-mono" style={{ borderColor: '#2A2118', background: '#0C0A07' }}>
              <SelectValue placeholder="Set duty role" />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map(r => <SelectItem key={r.id} value={r.id} className="text-xs font-mono">{r.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Pay day section ───────────────────────────────────────────────── */}
      <div>
        <SectionHead>PAY DAY STATUS</SectionHead>
        <div className="mt-2">
          <PaydayWidget handle={user?.handle} />
        </div>
      </div>

      {/* ── Role selector ─────────────────────────────────────────────────── */}
      <div>
        <SectionHead>DUTY STATION</SectionHead>
        <div className="mt-2 space-y-3">
          <RoleSelector role={role} onSelect={r => roleMutation.mutate(r)} />

          <AnimatePresence mode="wait">
            {!role ? (
              <motion.div key="none" initial={{opacity:0}} animate={{opacity:1}}
                className="border p-10 text-center text-[10px]" style={{ ...PANEL, color: DIM }}>
                Select your duty station above to load your operational view.
              </motion.div>
            ) : role === 'salvage_operator' ? (
              <motion.div key="salvage" initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}>
                <SalvageOpsView />
              </motion.div>
            ) : role === 'cargo_hauler' ? (
              <motion.div key="hauler" initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}>
                <HaulerView />
              </motion.div>
            ) : (
              <motion.div key="mgmt" initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}>
                <ManagementCommandDeck />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}