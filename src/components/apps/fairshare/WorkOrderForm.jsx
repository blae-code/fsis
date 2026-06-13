import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { computePayout } from './WorkOrderList';

const AMBER  = '#E0A22E';
const TEAL   = '#6FA08F';
const DIM    = '#7A6E60';
const DIMMER = '#3A3028';
const PANEL  = { background: '#0E0C09', borderColor: '#2A2118' };

const OP_TYPES = ['salvage', 'bounty', 'cargo', 'piracy', 'escort', 'other'];
const OP_COLOR = {
  salvage: AMBER, bounty: '#C05050', cargo: TEAL,
  piracy: '#9B6FC0', escort: '#6FA08F', other: DIM,
};

export default function WorkOrderForm() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [gross, setGross] = useState('');
  const [opType, setOpType] = useState('salvage');
  const [expenses, setExpenses] = useState([]);
  const [shares, setShares] = useState({});

  const { data: crew = [] } = useQuery({
    queryKey: ['crew_members'],
    queryFn: () => base44.entities.crew_member.filter({ active: true }),
  });

  const createMutation = useMutation({
    mutationFn: (order) => base44.entities.work_order.create(order),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work_orders'] });
      setName(''); setGross(''); setExpenses([]); setShares({}); setOpen(false);
    },
  });

  const toggleCrew = (member) => {
    setShares((prev) => {
      const next = { ...prev };
      if (next[member.handle] != null) delete next[member.handle];
      else next[member.handle] = member.default_shares || 1;
      return next;
    });
  };

  // Live payout preview
  const preview = computePayout({
    gross_auec: parseFloat(gross) || 0,
    expenses: expenses.filter((e) => e.label && e.amount_auec > 0),
    crew_shares: Object.entries(shares).map(([handle, s]) => ({ handle, shares: s })),
  });

  const submit = () => {
    createMutation.mutate({
      order_name: name,
      op_type: opType,
      gross_auec: parseFloat(gross) || 0,
      expenses: expenses.filter((e) => e.label && e.amount_auec > 0),
      crew_shares: Object.entries(shares).map(([handle, s]) => ({ handle, shares: s })),
      status: 'open',
    });
  };

  return (
    <div className="border font-mono" style={PANEL}>
      {/* Toggle header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5" style={{ background: AMBER }} />
          <span className="text-[10px] tracking-[0.2em]" style={{ color: '#B0793A' }}>NEW WORK ORDER</span>
        </div>
        {open ? <ChevronUp className="w-3 h-3" style={{ color: DIM }} /> : <ChevronDown className="w-3 h-3" style={{ color: DIM }} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="border-t overflow-hidden" style={{ borderColor: '#2A2118' }}>
            <div className="px-3 py-3 space-y-3">

              {/* Name + gross */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[8px] tracking-[0.15em]" style={{ color: DIM }}>ORDER NAME</label>
                  <input
                    className="w-full mt-1 h-8 bg-transparent border px-2 text-xs font-mono outline-none focus:border-amber-600/60"
                    style={{ borderColor: '#2A2118', color: '#D8CFC0' }}
                    placeholder="Halo sweep #4"
                    value={name} onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[8px] tracking-[0.15em]" style={{ color: DIM }}>GROSS SALE (aUEC)</label>
                  <input
                    type="number"
                    className="w-full mt-1 h-8 bg-transparent border px-2 text-xs font-mono outline-none focus:border-amber-600/60"
                    style={{ borderColor: '#2A2118', color: '#D8CFC0' }}
                    placeholder="0"
                    value={gross} onChange={(e) => setGross(e.target.value)}
                  />
                </div>
              </div>

              {/* Op type selector */}
              <div>
                <label className="text-[8px] tracking-[0.15em]" style={{ color: DIM }}>OPERATION TYPE</label>
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  {OP_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setOpType(t)}
                      className="text-[9px] px-2.5 py-1 border tracking-[0.1em] transition-all"
                      style={{
                        borderColor: opType === t ? OP_COLOR[t] : DIMMER,
                        background: opType === t ? `${OP_COLOR[t]}18` : 'transparent',
                        color: opType === t ? OP_COLOR[t] : DIM,
                      }}
                    >
                      {t.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Expenses */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[8px] tracking-[0.15em]" style={{ color: DIM }}>EXPENSES</label>
                  <button
                    onClick={() => setExpenses([...expenses, { label: '', amount_auec: 0 }])}
                    className="flex items-center gap-1 text-[8px] px-2 py-0.5 border"
                    style={{ borderColor: DIMMER, color: DIM }}
                  >
                    <Plus className="w-2 h-2" /> ADD
                  </button>
                </div>
                {expenses.map((e, i) => (
                  <div key={i} className="flex gap-2 items-center mb-1">
                    <input
                      className="flex-1 h-7 bg-transparent border px-2 text-[10px] font-mono outline-none"
                      style={{ borderColor: '#2A2118', color: '#D8CFC0' }}
                      placeholder="Fuel, repairs, fees…"
                      value={e.label}
                      onChange={(ev) => setExpenses(expenses.map((x, j) => j === i ? { ...x, label: ev.target.value } : x))}
                    />
                    <input
                      type="number"
                      className="w-28 h-7 bg-transparent border px-2 text-[10px] font-mono outline-none"
                      style={{ borderColor: '#2A2118', color: '#D8CFC0' }}
                      placeholder="aUEC"
                      value={e.amount_auec || ''}
                      onChange={(ev) => setExpenses(expenses.map((x, j) => j === i ? { ...x, amount_auec: parseFloat(ev.target.value) || 0 } : x))}
                    />
                    <button onClick={() => setExpenses(expenses.filter((_, j) => j !== i))} style={{ color: DIM }}>
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Crew picker */}
              <div>
                <label className="text-[8px] tracking-[0.15em] flex items-center gap-1" style={{ color: DIM }}>
                  <Users className="w-2.5 h-2.5" /> CREW ON THIS OP
                </label>
                {crew.length === 0 ? (
                  <p className="text-[9px] mt-1" style={{ color: DIM }}>No active crew — add members in CREW ROSTER.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {crew.map((m) => {
                      const selected = shares[m.handle] != null;
                      return (
                        <div key={m.id} className="flex items-center gap-1">
                          <button
                            onClick={() => toggleCrew(m)}
                            className="text-[9px] px-2 py-1 border transition-all"
                            style={{
                              borderColor: selected ? AMBER : DIMMER,
                              background: selected ? `${AMBER}14` : 'transparent',
                              color: selected ? AMBER : DIM,
                            }}
                          >
                            {m.handle}
                          </button>
                          {selected && (
                            <input
                              type="number" min="0" step="0.5"
                              className="w-14 h-7 bg-transparent border px-1.5 text-[10px] font-mono outline-none text-center"
                              style={{ borderColor: `${AMBER}44`, color: AMBER }}
                              value={shares[m.handle]}
                              onChange={(e) => setShares({ ...shares, [m.handle]: parseFloat(e.target.value) || 0 })}
                              title="Share weight"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Live payout preview */}
              {preview.payouts.length > 0 && (
                <div className="border p-2" style={{ borderColor: `${AMBER}33`, background: `${AMBER}08` }}>
                  <div className="text-[8px] tracking-[0.15em] mb-1.5" style={{ color: AMBER }}>LIVE PAYOUT PREVIEW</div>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="text-[9px]"><span style={{ color: DIM }}>NET </span><span style={{ color: '#D8CFC0' }}>{preview.net.toLocaleString()}</span></div>
                    <div className="text-[9px]"><span style={{ color: DIM }}>SHARES </span><span style={{ color: '#D8CFC0' }}>{preview.totalShares}</span></div>
                    <div className="text-[9px]"><span style={{ color: DIM }}>PER SHARE </span><span style={{ color: AMBER }}>{preview.totalShares > 0 ? Math.round(preview.net / preview.totalShares).toLocaleString() : '—'}</span></div>
                  </div>
                  {preview.payouts.map((x, i) => (
                    <div key={i} className="flex justify-between text-[9px]">
                      <span style={{ color: DIM }}>{x.handle} ({x.shares} sh)</span>
                      <span style={{ color: AMBER }}>{Math.round(x.amount).toLocaleString()} aUEC</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={submit}
                disabled={!name || createMutation.isPending}
                className="w-full h-9 text-[10px] tracking-[0.15em] border font-mono transition-all disabled:opacity-40"
                style={{ borderColor: AMBER, color: AMBER, background: `${AMBER}0E` }}
              >
                {createMutation.isPending ? 'CREATING…' : 'CREATE WORK ORDER'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}