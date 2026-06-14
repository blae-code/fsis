import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Check } from 'lucide-react';

const AMBER = '#E0A22E';
const TEAL  = '#5F9A8C';
const DIM   = '#7A6E60';
const RED   = '#C05050';
const PANEL = { background: '#0E0C09', borderColor: '#2A2118' };

const QUICK_CATS = [
  { label: 'FUEL',    icon: '⛽', category: 'fuel' },
  { label: 'REPAIR',  icon: '🔧', category: 'repairs' },
  { label: 'FEE',     icon: '⚠', category: 'fees_fines' },
  { label: 'EQUIP',   icon: '📦', category: 'equipment' },
  { label: 'RENTAL',  icon: '🚀', category: 'ship_rental' },
  { label: 'OTHER',   icon: '◈',  category: 'other' },
];

function fmt(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

export default function MicroExpenseLogger() {
  const [selCat, setSelCat] = useState(QUICK_CATS[0]);
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [flash, setFlash] = useState(false);

  const qc = useQueryClient();

  const today = new Date().toISOString().slice(0, 10);

  const { data: todayEntries = [] } = useQuery({
    queryKey: ['ledger_today'],
    queryFn: () => base44.entities.ledger_entry.filter({ entry_type: 'expense', entry_date: today }),
  });

  const addMutation = useMutation({
    mutationFn: (data) => base44.entities.ledger_entry.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ledger_today'] });
      setAmount('');
      setDesc('');
      setFlash(true);
      setTimeout(() => setFlash(false), 1200);
    },
  });

  const handleSubmit = () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    addMutation.mutate({
      entry_type: 'expense',
      category: selCat.category,
      amount_auec: amt,
      description: desc || selCat.label,
      entry_date: today,
      source: 'manual',
    });
  };

  const todayTotal = todayEntries.reduce((s, e) => s + (e.amount_auec || 0), 0);

  return (
    <div className="space-y-4 font-mono p-4">
      <div className="text-[9px] tracking-[0.2em]" style={{ color: DIM }}>◈ MICRO-EXPENSE LOGGER</div>

      {/* Quick category picker */}
      <div className="border p-3" style={PANEL}>
        <div className="text-[8px] tracking-[0.18em] mb-2" style={{ color: DIM }}>EXPENSE TYPE</div>
        <div className="grid grid-cols-3 gap-2">
          {QUICK_CATS.map(cat => (
            <button
              key={cat.category}
              onClick={() => setSelCat(cat)}
              className="flex flex-col items-center gap-1 py-2 border transition-all"
              style={{
                borderColor: selCat.category === cat.category ? AMBER : '#2A2118',
                background: selCat.category === cat.category ? 'rgba(224,162,46,0.08)' : 'transparent',
                color: selCat.category === cat.category ? AMBER : DIM,
              }}
            >
              <span className="text-base">{cat.icon}</span>
              <span className="text-[8px] tracking-[0.12em]">{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Amount + description */}
      <div className="border p-3 space-y-3" style={PANEL}>
        <div>
          <div className="text-[8px] tracking-[0.18em] mb-1" style={{ color: DIM }}>AMOUNT (aUEC)</div>
          <input
            type="number" min="0" placeholder="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className="w-full bg-transparent border px-3 py-2 text-[18px] font-bold outline-none"
            style={{ borderColor: '#2A2118', color: AMBER }}
            autoFocus
          />
        </div>
        <div>
          <div className="text-[8px] tracking-[0.18em] mb-1" style={{ color: DIM }}>DESCRIPTION (optional)</div>
          <input
            type="text" placeholder={selCat.label}
            value={desc}
            onChange={e => setDesc(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            className="w-full bg-transparent border px-3 py-1.5 text-[10px] outline-none"
            style={{ borderColor: '#2A2118', color: '#D8CFC0' }}
          />
        </div>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleSubmit}
          disabled={addMutation.isPending || !amount}
          className="w-full py-2.5 flex items-center justify-center gap-2 text-[10px] tracking-[0.2em] border transition-all"
          style={{
            borderColor: flash ? TEAL : AMBER,
            color: flash ? TEAL : AMBER,
            background: flash ? 'rgba(95,154,140,0.08)' : 'rgba(224,162,46,0.06)',
          }}
        >
          {flash ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {flash ? 'LOGGED' : 'LOG EXPENSE'}
        </motion.button>
      </div>

      {/* Today's expense feed */}
      <div className="border" style={PANEL}>
        <div className="px-3 py-2 border-b flex justify-between text-[8px] tracking-[0.18em]" style={{ borderColor: '#2A2118', color: DIM }}>
          <span>TODAY'S EXPENSES</span>
          <span style={{ color: RED }}>{fmt(todayTotal)} aUEC</span>
        </div>
        {todayEntries.length === 0 ? (
          <div className="px-3 py-4 text-[9px] text-center" style={{ color: DIM }}>No expenses logged today</div>
        ) : (
          <AnimatePresence>
            {[...todayEntries].reverse().slice(0, 10).map(e => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex justify-between items-center px-3 py-2 border-b last:border-b-0"
                style={{ borderColor: '#2A2118' }}
              >
                <div>
                  <div className="text-[10px]" style={{ color: '#D8CFC0' }}>{e.description}</div>
                  <div className="text-[8px]" style={{ color: DIM }}>{e.category?.replace('_', ' ').toUpperCase()}</div>
                </div>
                <div className="text-[11px] font-bold" style={{ color: RED }}>{fmt(e.amount_auec)} ¤</div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}