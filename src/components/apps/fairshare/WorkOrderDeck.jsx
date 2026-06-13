import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Copy, Check, CheckCircle2, Trash2, Users, ChevronDown, ChevronUp } from 'lucide-react';

// ─── Theme ────────────────────────────────────────────────────────────────────
const AMBER  = '#E0A22E';
const TEAL   = '#6FA08F';
const DIM    = '#7A6E60';
const DIMMER = '#3A3028';
const PANEL  = { background: '#111009', borderColor: '#2A2118' };

const OP_TYPES  = ['salvage','bounty','cargo','piracy','escort','other'];
const OP_COLOR  = { salvage: '#6FA08F', bounty: '#C8893B', cargo: '#5B8EC0', piracy: '#C05050', escort: '#B0793A', other: '#7A6E60' };

function fmt(n) {
  if (!n && n !== 0) return '—';
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return Number(n).toLocaleString();
}

export function computePayout(order) {
  const gross = order.gross_auec || 0;
  const expensesTotal = (order.expenses||[]).reduce((s,e) => s+(e.amount_auec||0), 0);
  const net = gross - expensesTotal;
  const totalShares = (order.crew_shares||[]).reduce((s,c) => s+(c.shares||0), 0);
  const rows = (order.crew_shares||[]).map((c) => ({
    handle: c.handle,
    shares: c.shares,
    payout: totalShares > 0 ? Math.round((net * (c.shares||0)) / totalShares) : 0,
  }));
  return { gross, expensesTotal, net, totalShares, rows };
}

// ─── Live payout preview strip ───────────────────────────────────────────────
function PayoutPreview({ gross, expenses, shares }) {
  const grossNum = parseFloat(gross) || 0;
  const totalExp = expenses.reduce((s,e) => s+(parseFloat(e.amount_auec)||0), 0);
  const net = grossNum - totalExp;
  const totalShares = Object.values(shares).reduce((s,v) => s+(parseFloat(v)||0), 0);
  if (!totalShares || !grossNum) return null;
  return (
    <div className="border p-2.5 space-y-1" style={{ ...PANEL, borderColor: `${AMBER}44` }}>
      <div className="text-[8px] tracking-[0.2em]" style={{ color: '#B0793A' }}>LIVE PAYOUT PREVIEW</div>
      <div className="flex gap-4 text-[9px] font-mono mb-1">
        <span style={{ color: DIM }}>GROSS <span style={{ color: '#D8CFC0' }}>{fmt(grossNum)}</span></span>
        <span style={{ color: DIM }}>EXP <span style={{ color: '#C05050' }}>−{fmt(totalExp)}</span></span>
        <span style={{ color: DIM }}>NET <span className="font-bold" style={{ color: AMBER }}>{fmt(net)}</span></span>
      </div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(shares).map(([handle, sh]) => {
          const payout = totalShares > 0 ? Math.round((net * (parseFloat(sh)||0)) / totalShares) : 0;
          return (
            <div key={handle} className="flex items-center gap-1 border px-2 py-0.5 text-[9px]" style={{ borderColor: `${TEAL}44`, background: `${TEAL}0C` }}>
              <span style={{ color: TEAL }}>{handle}</span>
              <span style={{ color: DIM }}>({sh}sh)</span>
              <span className="font-bold" style={{ color: AMBER }}>{fmt(payout)} ¤</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Create form ──────────────────────────────────────────────────────────────
function WorkOrderForm({ onDone }) {
  const queryClient = useQueryClient();
  const [name, setName]     = useState('');
  const [gross, setGross]   = useState('');
  const [opType, setOpType] = useState('salvage');
  const [expenses, setExpenses] = useState([]);
  const [shares, setShares]   = useState({});

  const { data: crew = [] } = useQuery({ queryKey: ['crew_members'], queryFn: () => base44.entities.crew_member.filter({ active: true }) });

  const createMutation = useMutation({
    mutationFn: (order) => base44.entities.work_order.create(order),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work_orders'] });
      queryClient.invalidateQueries({ queryKey: ['mgmt_work_orders'] });
      onDone?.();
      setName(''); setGross(''); setExpenses([]); setShares({});
    },
  });

  const toggleCrew = (m) => {
    setShares(prev => {
      const next = { ...prev };
      if (next[m.handle] != null) delete next[m.handle];
      else next[m.handle] = m.default_shares || 1;
      return next;
    });
  };

  return (
    <div className="border p-4 space-y-3" style={{ ...PANEL, borderColor: '#5C4424' }}>
      <div className="text-[9px] tracking-[0.22em]" style={{ color: '#B0793A' }}>NEW WORK ORDER</div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <Input placeholder="Order name, e.g. Halo sweep #4" value={name} onChange={e=>setName(e.target.value)}
          className="h-8 text-xs font-mono bg-transparent" style={{ borderColor: '#2A2118' }} />
        <Input type="number" placeholder="Gross sale (aUEC)" value={gross} onChange={e=>setGross(e.target.value)}
          className="h-8 text-xs font-mono bg-transparent" style={{ borderColor: '#2A2118' }} />
        <Select value={opType} onValueChange={setOpType}>
          <SelectTrigger className="h-8 text-xs font-mono" style={{ borderColor: '#2A2118' }}><SelectValue /></SelectTrigger>
          <SelectContent>
            {OP_TYPES.map(t => <SelectItem key={t} value={t} className="text-xs font-mono">{t.toUpperCase()}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Expenses */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[9px] tracking-[0.16em]" style={{ color: DIM }}>EXPENSES</span>
          <button onClick={() => setExpenses([...expenses, { label:'', amount_auec:0 }])}
            className="flex items-center gap-1 px-2 py-0.5 text-[8px]" style={{ color: AMBER, border: `1px solid ${AMBER}44`, background: `${AMBER}0C` }}>
            <Plus className="w-2.5 h-2.5" /> ADD LINE
          </button>
        </div>
        {expenses.map((e, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input placeholder="Fuel, repairs…" value={e.label} className="h-7 text-[10px] font-mono bg-transparent flex-1" style={{ borderColor: '#2A2118' }}
              onChange={ev => setExpenses(expenses.map((x,j) => j===i ? {...x, label: ev.target.value} : x))} />
            <Input type="number" placeholder="aUEC" value={e.amount_auec||''} className="h-7 text-[10px] font-mono bg-transparent w-28" style={{ borderColor: '#2A2118' }}
              onChange={ev => setExpenses(expenses.map((x,j) => j===i ? {...x, amount_auec: parseFloat(ev.target.value)||0} : x))} />
            <button onClick={() => setExpenses(expenses.filter((_,j)=>j!==i))} style={{ color: '#C05050' }}><X className="w-3 h-3" /></button>
          </div>
        ))}
      </div>

      {/* Crew */}
      <div className="space-y-1.5">
        <span className="text-[9px] tracking-[0.16em] flex items-center gap-1.5" style={{ color: DIM }}>
          <Users className="w-3 h-3" /> CREW ON THIS OP
        </span>
        {crew.length === 0 ? (
          <p className="text-[10px]" style={{ color: DIM }}>No crew on roster — add members in CREW ROSTER.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {crew.map(m => {
              const selected = shares[m.handle] != null;
              return (
                <div key={m.id} className="flex items-center gap-1">
                  <button onClick={() => toggleCrew(m)}
                    className="text-[10px] font-mono px-2 py-0.5 transition-colors"
                    style={{
                      border: `1px solid ${selected ? AMBER : '#2A2118'}`,
                      background: selected ? `${AMBER}14` : 'transparent',
                      color: selected ? AMBER : DIM,
                      clipPath: 'polygon(4px 0,100% 0,calc(100%-4px) 100%,0 100%)',
                    }}>
                    {m.handle}
                  </button>
                  {selected && (
                    <Input type="number" min="0" step="0.5" value={shares[m.handle]}
                      onChange={e => setShares({...shares, [m.handle]: parseFloat(e.target.value)||0})}
                      className="h-6 w-14 text-[10px] font-mono bg-transparent" style={{ borderColor: '#2A2118' }} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <PayoutPreview gross={gross} expenses={expenses} shares={shares} />

      <div className="flex justify-end gap-2">
        <button onClick={() => onDone?.()} className="px-3 py-1 text-[10px] font-mono" style={{ color: DIM }}>CANCEL</button>
        <button
          disabled={!name || createMutation.isPending}
          onClick={() => createMutation.mutate({ order_name: name, gross_auec: parseFloat(gross)||0, op_type: opType, expenses: expenses.filter(e=>e.label&&e.amount_auec>0), crew_shares: Object.entries(shares).map(([handle,s])=>({handle,shares:s})), status: 'open' })}
          className="flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-bold font-mono disabled:opacity-40"
          style={{ background: '#3A2810', border: '1px solid #B0793A', color: AMBER, clipPath: 'polygon(6px 0,100% 0,calc(100%-6px) 100%,0 100%)' }}>
          CREATE WORK ORDER
        </button>
      </div>
    </div>
  );
}

// ─── Work order card ──────────────────────────────────────────────────────────
function WorkOrderCard({ order }) {
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const p = computePayout(order);
  const settled = order.status === 'settled';
  const opColor = OP_COLOR[order.op_type||'other'];

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.work_order.update(order.id, data),
    onSuccess: () => { queryClient.invalidateQueries({queryKey:['work_orders']}); queryClient.invalidateQueries({queryKey:['mgmt_work_orders']}); },
  });
  const deleteMutation = useMutation({
    mutationFn: () => base44.entities.work_order.delete(order.id),
    onSuccess: () => { queryClient.invalidateQueries({queryKey:['work_orders']}); queryClient.invalidateQueries({queryKey:['mgmt_work_orders']}); },
  });

  const copyPayout = () => {
    const lines = [
      `FSIS FairShare — ${order.order_name}`,
      '━━━━━━━━━━━━━━━━━━━━━━━━',
      `Gross: ${fmt(p.gross)} aUEC  |  Expenses: −${fmt(p.expensesTotal)} aUEC  |  Net: ${fmt(p.net)} aUEC`,
      '─────────────────────────',
      ...p.rows.map(r => `${r.handle} (${r.shares} sh): ${fmt(r.payout)} aUEC`),
      '"Every credit accounted for." — FSIS FairShare',
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    setTimeout(()=>setCopied(false), 2000);
  };

  return (
    <motion.div layout className="border" style={{ ...PANEL, borderColor: settled ? '#2A4A2A' : '#2A2118' }}>
      {/* Header row */}
      <div className="grid grid-cols-[6px_1fr_80px_80px_80px_auto] gap-2 px-3 py-2.5 items-center">
        <span className="h-full w-1.5 self-stretch" style={{ background: opColor, opacity: 0.8 }} />
        <div className="min-w-0">
          <div className="text-[11px] font-bold truncate" style={{ color: '#D8CFC0' }}>{order.order_name}</div>
          <div className="text-[8px] flex gap-2" style={{ color: DIM }}>
            <span style={{ color: opColor }}>{(order.op_type||'other').toUpperCase()}</span>
            {(order.crew_shares||[]).map(c=>c.handle).join(' · ')}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[8px]" style={{ color: DIMMER }}>GROSS</div>
          <div className="text-[10px] font-mono" style={{ color: '#D8CFC0' }}>{fmt(p.gross)}</div>
        </div>
        <div className="text-right">
          <div className="text-[8px]" style={{ color: DIMMER }}>NET</div>
          <div className="text-[10px] font-mono font-bold" style={{ color: AMBER }}>{fmt(p.net)}</div>
        </div>
        <div className="text-right">
          <span className="text-[8px] px-1.5 py-0.5 font-bold" style={{
            color: settled ? '#7BA05B' : AMBER,
            border: `1px solid ${settled ? '#7BA05B' : AMBER}44`,
            background: `${settled ? '#7BA05B' : AMBER}10`,
          }}>{settled ? 'SETTLED' : 'OPEN'}</span>
        </div>
        <div className="flex items-center gap-1.5 justify-end">
          <button onClick={copyPayout} title="Copy payout" style={{ color: copied ? TEAL : DIM }} className="hover:opacity-80 transition-opacity">
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          {!settled && (
            <button onClick={() => updateMutation.mutate({ status: 'settled' })} title="Settle" style={{ color: DIM }} className="hover:opacity-80 transition-opacity">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={() => setExpanded(v=>!v)} style={{ color: DIM }} className="hover:opacity-80 transition-opacity">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button onClick={() => deleteMutation.mutate()} style={{ color: DIM }} className="opacity-30 hover:opacity-70 transition-opacity">
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Expanded payout breakdown */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} className="overflow-hidden">
            <div className="px-3 pb-3 space-y-1 border-t" style={{ borderColor: '#1E1810' }}>
              {(order.expenses||[]).length > 0 && (
                <div className="pt-2 space-y-0.5">
                  {(order.expenses||[]).map((e,i) => (
                    <div key={i} className="flex justify-between text-[9px] font-mono">
                      <span style={{ color: DIM }}>{e.label}</span>
                      <span style={{ color: '#C05050' }}>−{fmt(e.amount_auec)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="pt-1 grid gap-1">
                {p.rows.map(r => (
                  <div key={r.handle} className="flex justify-between items-center px-2 py-1.5" style={{ background: '#0C0A07', border: '1px solid #1E1810' }}>
                    <span className="text-[10px] font-mono" style={{ color: '#D8CFC0' }}>
                      {r.handle} <span style={{ color: DIM }}>({r.shares} sh)</span>
                    </span>
                    <span className="text-[11px] font-bold font-mono" style={{ color: AMBER }}>{fmt(r.payout)} ¤</span>
                  </div>
                ))}
              </div>
              {order.notes && <p className="text-[9px] pt-1" style={{ color: DIM }}>{order.notes}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function WorkOrderDeck() {
  const [formOpen, setFormOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['work_orders'],
    queryFn: () => base44.entities.work_order.list('-created_date', 100),
  });

  const filtered = orders.filter(o => filterStatus === 'all' || o.status === filterStatus);
  const openCount = orders.filter(o=>o.status==='open').length;
  const settledCount = orders.filter(o=>o.status==='settled').length;

  return (
    <div className="p-4 space-y-4 font-mono">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="flex border" style={{ borderColor: '#2A2118' }}>
            {[['all','ALL'], ['open','OPEN'], ['settled','SETTLED']].map(([v,label]) => (
              <button key={v} onClick={() => setFilterStatus(v)}
                className="px-3 py-1 text-[9px] font-mono tracking-[0.12em] transition-colors"
                style={{ background: filterStatus===v ? '#2A1E0C' : 'transparent', color: filterStatus===v ? AMBER : DIM }}>
                {label}
                {v === 'open' && openCount > 0 && <span className="ml-1.5 text-[8px]" style={{ color: filterStatus==='open' ? AMBER : '#C8893B' }}>{openCount}</span>}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => setFormOpen(v=>!v)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold tracking-[0.12em]"
          style={{ background: formOpen?'#2A1E0C':'#1A130A', border:`1px solid ${formOpen?'#B0793A':'#3A2810'}`, color: formOpen?AMBER:DIM, clipPath:'polygon(6px 0,100% 0,calc(100%-6px) 100%,0 100%)' }}>
          <Plus className="w-3 h-3" /> NEW ORDER
        </button>
      </div>

      <AnimatePresence>
        {formOpen && <WorkOrderForm onDone={() => setFormOpen(false)} />}
      </AnimatePresence>

      <div className="text-[8px] tracking-[0.2em]" style={{ color: DIMMER }}>
        {filtered.length} ORDER{filtered.length!==1?'S':''} · {openCount} OPEN · {settledCount} SETTLED
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-[10px]" style={{ color: DIM }}>Loading work orders…</div>
      ) : filtered.length === 0 ? (
        <div className="border p-12 text-center text-[9px]" style={{ ...PANEL, color: DIM }}>No work orders yet. Use NEW ORDER to log your first op.</div>
      ) : (
        <div className="space-y-1.5">
          <AnimatePresence>
            {filtered.map((o,i) => (
              <motion.div key={o.id} initial={{opacity:0}} animate={{opacity:1}} transition={{delay:i*0.02}}>
                <WorkOrderCard order={o} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}