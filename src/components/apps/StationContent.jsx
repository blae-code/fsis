import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Clock, Package, Anchor, LayoutDashboard } from 'lucide-react';
import SalvageOpsView from '@/components/apps/station/SalvageOpsView';
import HaulerView from '@/components/apps/station/HaulerView';
import ManagementView from '@/components/apps/station/ManagementView';
import ContractorPaydayView from '@/components/apps/station/ContractorPaydayView';
import QuickTimeLog from '@/components/apps/station/QuickTimeLog';

const AMBER  = '#E0A22E';
const TEAL   = '#6FA08F';
const BLUE   = '#6FA0C8';
const DIM    = '#7A6E60';
const DIMMER = '#3A3028';

const ROLES = [
  { id: 'salvage_operator', label: 'SALVAGE OPS',  glyph: '⬡', color: AMBER, icon: Anchor,        hint: 'Active runs · Stock · Best terminals' },
  { id: 'cargo_hauler',     label: 'CARGO HAULER', glyph: '▶', color: TEAL,  icon: Package,       hint: 'Lots awaiting haul · Deliveries' },
  { id: 'management',       label: 'MANAGEMENT',   glyph: '◈', color: BLUE,  icon: LayoutDashboard, hint: 'Ops overview across all FSIS divisions' },
];

const TABS = [
  { id: 'ops',    label: 'OPS VIEW'  },
  { id: 'payday', label: 'PAY DAY'   },
  { id: 'time',   label: 'LOG TIME'  },
];

export default function StationContent() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('ops');

  const { data: user, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: paydayData } = useQuery({
    queryKey: ['contractor_payday'],
    queryFn: async () => {
      try { return (await import('@/functions/contractorPayday').then(m => m.contractorPayday({}))).data; }
      catch { return null; }
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

  const role     = user?.ops_role;
  const roleMeta = ROLES.find(r => r.id === role);
  const myShares = paydayData?.my_shares || 0;
  const handle   = user?.handle || user?.full_name || 'OPERATOR';
  const openCycle = paydayData?.open_cycle;
  const hasElection = !!paydayData?.my_election;

  return (
    <div className="h-full flex flex-col font-mono" style={{ background: '#0A0806' }}>

      {/* ── Identity bar ─────────────────────────────────────────────── */}
      <div className="shrink-0 border-b px-3 py-2.5 flex items-center gap-3"
        style={{ borderColor: '#2A2118', background: '#0D0B09' }}>
        {/* Avatar glyph */}
        <div className="w-9 h-9 border flex items-center justify-center shrink-0"
          style={{ borderColor: roleMeta?.color || DIMMER, background: `${roleMeta?.color || DIMMER}10` }}>
          <span className="text-base font-bold" style={{ color: roleMeta?.color || DIM }}>
            {roleMeta?.glyph || '○'}
          </span>
        </div>

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-bold tracking-[0.08em] truncate" style={{ color: '#D8CFC0' }}>
            {handle.toUpperCase()}
          </div>
          <div className="flex items-center gap-2 text-[8px] mt-0.5">
            {roleMeta
              ? <span style={{ color: roleMeta.color }}>{roleMeta.label}</span>
              : <span style={{ color: DIMMER }}>NO DUTY SELECTED</span>
            }
            {myShares > 0 && (
              <>
                <span style={{ color: DIMMER }}>·</span>
                <span style={{ color: AMBER }}>{myShares} SHARE{myShares !== 1 ? 'S' : ''}</span>
              </>
            )}
            {openCycle && !hasElection && (
              <>
                <span style={{ color: DIMMER }}>·</span>
                <span className="animate-pulse" style={{ color: '#C05050' }}>PAY DAY OPEN — VOTE NOW</span>
              </>
            )}
          </div>
        </div>

        {/* Role selector pills */}
        <div className="flex gap-1 shrink-0">
          {ROLES.map(r => (
            <button key={r.id} onClick={() => roleMutation.mutate(r.id)}
              title={r.hint}
              className="flex items-center gap-1 px-2 py-1 text-[8px] tracking-[0.1em] transition-all border"
              style={{
                borderColor: role === r.id ? r.color : '#2A2118',
                background:  role === r.id ? `${r.color}14` : 'transparent',
                color:        role === r.id ? r.color : DIM,
              }}>
              <span>{r.glyph}</span>
              <span className="hidden sm:inline">{r.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab rail ─────────────────────────────────────────────────── */}
      <div className="shrink-0 border-b flex" style={{ borderColor: '#2A2118' }}>
        {TABS.map(t => {
          const active = tab === t.id;
          const isAlert = t.id === 'payday' && openCycle && !hasElection;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="relative px-4 py-2 text-[9px] tracking-[0.15em] transition-colors flex items-center gap-1.5"
              style={{ color: active ? AMBER : DIM }}>
              {t.label}
              {isAlert && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#C05050' }} />}
              {active && (
                <motion.div layoutId="station-tab-line"
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ background: AMBER }}
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Content ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto p-4">
        <AnimatePresence mode="wait">
          {tab === 'ops' && (
            <motion.div key="ops"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}>
              {!role ? (
                <div className="border p-8 text-center" style={{ background: '#0E0C09', borderColor: '#2A2118' }}>
                  <div className="text-[10px] tracking-[0.2em] mb-4" style={{ color: DIMMER }}>SELECT YOUR DUTY ROLE</div>
                  <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
                    {ROLES.map(r => {
                      const Icon = r.icon;
                      return (
                        <button key={r.id} onClick={() => roleMutation.mutate(r.id)}
                          className="border p-4 text-center space-y-2 transition-all group"
                          style={{ borderColor: '#2A2118', background: '#0A0806' }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = r.color; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#2A2118'; }}>
                          <Icon className="w-5 h-5 mx-auto transition-colors" style={{ color: r.color }} />
                          <div className="text-[7px] tracking-[0.1em]" style={{ color: DIM }}>{r.label}</div>
                          <div className="text-[7px] leading-tight" style={{ color: DIMMER }}>{r.hint}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : role === 'salvage_operator' ? <SalvageOpsView />
                : role === 'cargo_hauler'     ? <HaulerView />
                : <ManagementView />
              }
            </motion.div>
          )}
          {tab === 'payday' && (
            <motion.div key="payday"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}>
              <ContractorPaydayView />
            </motion.div>
          )}
          {tab === 'time' && (
            <motion.div key="time"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}>
              {user?.handle
                ? <QuickTimeLog handle={user.handle} />
                : (
                  <div className="border p-6 text-center" style={{ background: '#0E0C09', borderColor: '#2A2118' }}>
                    <Clock className="w-6 h-6 mx-auto mb-3 opacity-30" style={{ color: DIM }} />
                    <div className="text-[10px] tracking-[0.18em]" style={{ color: DIM }}>CALLSIGN NOT SET</div>
                    <div className="text-[9px] mt-1" style={{ color: DIMMER }}>
                      Ask management to set your in-game handle in the crew roster.
                    </div>
                  </div>
                )
              }
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}