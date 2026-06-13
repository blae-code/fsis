import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Trash2, Shield, Activity, Boxes } from 'lucide-react';

const AMBER  = '#E0A22E';
const TEAL   = '#6FA08F';
const DIM    = '#7A6E60';
const DIMMER = '#3A3028';
const PANEL  = { background: '#111009', borderColor: '#2A2118' };

function fmt(n) {
  if (!n) return '—';
  if (n >= 1_000_000) return `${(n/1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n/1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

const sessionScu = (s) => (s?.rmc_scu||0) + (s?.cmr_scu||0) + (s?.cms_scu||0);

export default function CrewRosterDeck() {
  const queryClient = useQueryClient();
  const [handle, setHandle] = useState('');
  const [role, setRole] = useState('');
  const [empType, setEmpType] = useState('contractor');
  const [defaultShares, setDefaultShares] = useState('1');

  const { data: crew = [] } = useQuery({ queryKey: ['crew_members'], queryFn: () => base44.entities.crew_member.list('-created_date') });
  const { data: orders = [] } = useQuery({ queryKey: ['work_orders'], queryFn: () => base44.entities.work_order.list('-created_date', 100) });
  const { data: sessions = [] } = useQuery({ queryKey: ['salvage_sessions_all'], queryFn: () => base44.entities.salvage_session.list('-created_date', 100) });
  const { data: timeLogs = [] } = useQuery({ queryKey: ['time_logs'], queryFn: () => base44.entities.time_log.list('-created_date', 200) });

  const sessionById = Object.fromEntries(sessions.map(s=>[s.id,s]));

  // Per-handle rollup
  const stats = {};
  const ensure = (h) => (stats[h] ||= { volumeScu: 0, opsCompleted: 0, opsActive: 0, totalPayout: 0, sharesOutstanding: 0 });
  orders.forEach(o => {
    const settled = o.status === 'settled';
    const scu = settled && o.session_id ? sessionScu(sessionById[o.session_id]) : 0;
    const gross = o.gross_auec||0;
    const exp = (o.expenses||[]).reduce((s,e)=>s+(e.amount_auec||0),0);
    const net = gross - exp;
    const totalSh = (o.crew_shares||[]).reduce((s,c)=>s+(c.shares||0),0);
    (o.crew_shares||[]).forEach(c => {
      const a = ensure(c.handle);
      const payout = totalSh > 0 ? Math.round((net*(c.shares||0))/totalSh) : 0;
      if (settled) { a.opsCompleted++; a.volumeScu+=scu; a.totalPayout+=payout; }
      else a.opsActive++;
    });
  });
  timeLogs.filter(l=>l.status!=='cashed').forEach(l => { ensure(l.handle).sharesOutstanding += l.shares||0; });

  const createMutation = useMutation({
    mutationFn: (m) => base44.entities.crew_member.create(m),
    onSuccess: () => { queryClient.invalidateQueries({queryKey:['crew_members']}); setHandle(''); setRole(''); setDefaultShares('1'); },
  });
  const updateMutation = useMutation({
    mutationFn: ({id,data}) => base44.entities.crew_member.update(id,data),
    onSuccess: () => queryClient.invalidateQueries({queryKey:['crew_members']}),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.crew_member.delete(id),
    onSuccess: () => queryClient.invalidateQueries({queryKey:['crew_members']}),
  });

  const totalShares = Object.values(stats).reduce((s,v)=>s+v.sharesOutstanding,0);

  return (
    <div className="p-4 space-y-4 font-mono">

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: Shield, label: 'CREW ON ROSTER', value: crew.length, color: AMBER },
          { icon: Activity, label: 'ACTIVE', value: crew.filter(m=>m.active!==false).length, color: '#7BA05B' },
          { icon: Boxes, label: 'SHARES OUTSTANDING', value: Math.round(totalShares*100)/100, color: TEAL },
        ].map(t => (
          <div key={t.label} className="border p-2.5" style={PANEL}>
            <t.icon className="w-3 h-3 mb-1" style={{ color: t.color }} />
            <div className="text-lg font-bold" style={{ color: t.color }}>{t.value}</div>
            <div className="text-[8px] tracking-[0.16em]" style={{ color: DIMMER }}>{t.label}</div>
          </div>
        ))}
      </div>

      {/* Add crew form */}
      <div className="border p-3 space-y-2" style={{ ...PANEL, borderColor: '#3A2A18' }}>
        <div className="text-[9px] tracking-[0.22em]" style={{ color: '#B0793A' }}>ENLIST CREW MEMBER</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Input placeholder="Callsign *" value={handle} onChange={e=>setHandle(e.target.value)}
            className="h-8 text-xs font-mono bg-transparent" style={{ borderColor: '#2A2118' }} />
          <Input placeholder="Role, e.g. Scraper" value={role} onChange={e=>setRole(e.target.value)}
            className="h-8 text-xs font-mono bg-transparent" style={{ borderColor: '#2A2118' }} />
          <Select value={empType} onValueChange={setEmpType}>
            <SelectTrigger className="h-8 text-xs font-mono" style={{ borderColor: '#2A2118', background: '#0C0A07' }}><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="contractor" className="text-xs font-mono">CONTRACTOR</SelectItem>
              <SelectItem value="proprietor" className="text-xs font-mono">PROPRIETOR</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input type="number" min="0" step="0.5" value={defaultShares} onChange={e=>setDefaultShares(e.target.value)}
              className="h-8 text-xs font-mono bg-transparent flex-1" style={{ borderColor: '#2A2118' }} title="Default shares" />
            <button
              disabled={!handle||createMutation.isPending}
              onClick={() => createMutation.mutate({handle,role,default_shares:parseFloat(defaultShares)||1,active:true,employment_type:empType})}
              className="flex items-center gap-1 px-3 h-8 text-[10px] font-bold disabled:opacity-40"
              style={{ background:'#2A1E0C', border:`1px solid #B0793A`, color: AMBER, clipPath:'polygon(4px 0,100% 0,calc(100%-4px) 100%,0 100%)' }}>
              <UserPlus className="w-3 h-3" /> ADD
            </button>
          </div>
        </div>
        <p className="text-[8px]" style={{ color: DIMMER }}>Callsign links automatically to pay day elections — no email or PII collected.</p>
      </div>

      {/* Roster table */}
      <div className="border" style={PANEL}>
        <div className="grid grid-cols-[1fr_80px_70px_80px_90px_70px_auto] gap-2 px-3 py-1.5 text-[8px] tracking-[0.16em] border-b" style={{ borderColor: '#1E1810', color: DIMMER }}>
          <span>CALLSIGN</span><span>ROLE</span><span className="text-right">ACTIVE</span><span className="text-right">DONE</span><span className="text-right">VOLUME</span><span className="text-right">SHARES</span><span />
        </div>
        {crew.length === 0 ? (
          <p className="text-center py-8 text-[10px]" style={{ color: DIM }}>No crew enlisted yet.</p>
        ) : (
          [...crew].sort((a,b) => (stats[b.handle]?.totalPayout||0) - (stats[a.handle]?.totalPayout||0)).map((m,i) => {
            const a = stats[m.handle] || {};
            const isActive = m.active !== false;
            const isProp = m.employment_type === 'proprietor';
            return (
              <motion.div key={m.id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.025}}
                className="grid grid-cols-[1fr_80px_70px_80px_90px_70px_auto] gap-2 items-center px-3 py-2.5 border-b last:border-b-0"
                style={{ borderColor: '#1E1810' }}>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{
                    background: isActive ? '#7BA05B' : '#3A3028',
                    boxShadow: isActive ? '0 0 5px rgba(123,160,91,0.5)' : 'none',
                  }} />
                  <span className="truncate text-[11px]" style={{ color: '#D8CFC0' }}>{m.handle}</span>
                  {isProp && <span className="text-[7px] px-1 py-0.5 shrink-0" style={{ color: AMBER, border:`1px solid ${AMBER}55`, background:`${AMBER}10` }}>OWNER</span>}
                </div>
                <span className="text-[9px] truncate" style={{ color: DIM }}>{m.role||'—'}</span>
                <span className="text-right text-[10px]" style={{ color: a.opsActive>0 ? '#C8893B' : DIMMER }}>{a.opsActive||'—'}</span>
                <span className="text-right text-[10px]" style={{ color: DIM }}>{a.opsCompleted||'—'}</span>
                <span className="text-right text-[10px] font-mono" style={{ color: a.volumeScu>0 ? TEAL : DIMMER }}>{a.volumeScu>0?`${a.volumeScu.toLocaleString()} SCU`:'—'}</span>
                <span className="text-right text-[10px] font-mono font-bold" style={{ color: a.sharesOutstanding>0 ? AMBER : DIMMER }}>
                  {a.sharesOutstanding>0 ? Math.round(a.sharesOutstanding*100)/100 : '—'}
                </span>
                <div className="flex items-center gap-1.5 justify-end">
                  <button onClick={() => updateMutation.mutate({id:m.id,data:{active:!m.active}})}
                    className="text-[8px] px-1.5 py-0.5 font-mono"
                    style={{ color: isActive?'#7BA05B':DIM, border:`1px solid ${isActive?'#7BA05B':DIMMER}44`, background:`${isActive?'#7BA05B':DIMMER}10` }}>
                    {isActive?'ACTIVE':'INACTIVE'}
                  </button>
                  {!isProp && (
                    <button onClick={() => deleteMutation.mutate(m.id)} className="opacity-20 hover:opacity-70 transition-opacity" style={{ color:'#FF6B6B' }}>
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}