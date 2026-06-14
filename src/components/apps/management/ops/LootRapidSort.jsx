import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Check, Zap } from 'lucide-react';

const AMBER  = '#E0A22E';
const TEAL   = '#5F9A8C';
const DIM    = '#7A6E60';
const PANEL  = { background: '#0E0C09', borderColor: '#2A2118' };

const ITEM_TYPES = [
  { label: 'SHIP COMP',  value: 'ship_component',    icon: '⚙' },
  { label: 'WEAPON',     value: 'weapon',             icon: '🔫' },
  { label: 'FPS GEAR',   value: 'fps_gear',           icon: '🪖' },
  { label: 'VEHICLE',    value: 'vehicle_component',  icon: '🚗' },
  { label: 'BULK CARGO', value: 'bulk_cargo',         icon: '📦' },
];

const CONDITIONS = [
  { label: 'NEW',   value: 'new',   pct: 95, color: '#7BA05B' },
  { label: 'REFURB',value: 'refurb',pct: 70, color: TEAL },
  { label: 'USED',  value: 'used',  pct: 45, color: AMBER },
  { label: 'WORN',  value: 'worn',  pct: 15, color: '#C05050' },
];

const SIZES = ['S1','S2','S3','S4','S5','M','L','XL','N/A'];

function fmt(n) {
  if (!n) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

export default function LootRapidSort() {
  const [type,    setType]    = useState(ITEM_TYPES[0]);
  const [cond,    setCond]    = useState(CONDITIONS[2]);
  const [size,    setSize]    = useState('S1');
  const [name,    setName]    = useState('');
  const [qty,     setQty]     = useState(1);
  const [est,     setEst]     = useState('');
  const [flash,   setFlash]   = useState(false);
  const [recent,  setRecent]  = useState([]);

  const qc = useQueryClient();

  const addMutation = useMutation({
    mutationFn: (item) => base44.entities.loot_item.create(item),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['loot_items'] });
      setRecent(prev => [res, ...prev].slice(0, 5));
      setName('');
      setEst('');
      setQty(1);
      setFlash(true);
      setTimeout(() => setFlash(false), 1200);
    },
  });

  const handleLog = () => {
    if (!name.trim()) return;
    addMutation.mutate({
      item_name: name.trim(),
      item_type: type.value,
      condition_grade: cond.value,
      condition_pct: cond.pct,
      size_class: size,
      quantity: qty,
      est_sell_auec: parseFloat(est) || 0,
      status: 'raw',
      source_op: `Rapid log — ${new Date().toLocaleDateString()}`,
    });
  };

  const estRoi = parseFloat(est) || 0;

  return (
    <div className="space-y-4 font-mono p-4">
      <div className="text-[9px] tracking-[0.2em]" style={{ color: DIM }}>◈ LOOT RAPID-SORT</div>

      {/* Type row */}
      <div className="border p-3" style={PANEL}>
        <div className="text-[8px] tracking-[0.18em] mb-2" style={{ color: DIM }}>ITEM TYPE</div>
        <div className="flex flex-wrap gap-2">
          {ITEM_TYPES.map(t => (
            <button key={t.value} onClick={() => setType(t)}
              className="flex items-center gap-1.5 px-2.5 py-1 border text-[9px] transition-all"
              style={{
                borderColor: type.value === t.value ? AMBER : '#2A2118',
                color: type.value === t.value ? AMBER : DIM,
                background: type.value === t.value ? 'rgba(224,162,46,0.08)' : 'transparent',
              }}>
              <span>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Condition row */}
      <div className="border p-3" style={PANEL}>
        <div className="text-[8px] tracking-[0.18em] mb-2" style={{ color: DIM }}>CONDITION</div>
        <div className="grid grid-cols-4 gap-2">
          {CONDITIONS.map(c => (
            <button key={c.value} onClick={() => setCond(c)}
              className="py-2 border text-[9px] tracking-[0.1em] transition-all"
              style={{
                borderColor: cond.value === c.value ? c.color : '#2A2118',
                color: cond.value === c.value ? c.color : DIM,
                background: cond.value === c.value ? `${c.color}15` : 'transparent',
              }}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Item details */}
      <div className="border p-3 space-y-3" style={PANEL}>
        <div className="text-[8px] tracking-[0.18em]" style={{ color: DIM }}>ITEM DETAILS</div>
        <input
          type="text" placeholder="Item name…"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLog()}
          className="w-full bg-transparent border px-3 py-2 text-[11px] outline-none"
          style={{ borderColor: '#2A2118', color: '#D8CFC0' }}
          autoFocus
        />
        <div className="grid grid-cols-3 gap-3">
          <div>
            <div className="text-[8px] mb-1" style={{ color: DIM }}>SIZE</div>
            <select value={size} onChange={e => setSize(e.target.value)}
              className="w-full bg-transparent border px-2 py-1.5 text-[10px] outline-none"
              style={{ borderColor: '#2A2118', color: AMBER }}>
              {SIZES.map(s => <option key={s} value={s} style={{ background: '#0E0C09' }}>{s}</option>)}
            </select>
          </div>
          <div>
            <div className="text-[8px] mb-1" style={{ color: DIM }}>QTY</div>
            <input type="number" min="1" value={qty}
              onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-transparent border px-2 py-1.5 text-[11px] text-center outline-none"
              style={{ borderColor: '#2A2118', color: AMBER }}
            />
          </div>
          <div>
            <div className="text-[8px] mb-1" style={{ color: DIM }}>EST. aUEC</div>
            <input type="number" min="0" placeholder="0"
              value={est}
              onChange={e => setEst(e.target.value)}
              className="w-full bg-transparent border px-2 py-1.5 text-[11px] text-center outline-none"
              style={{ borderColor: '#2A2118', color: TEAL }}
            />
          </div>
        </div>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={handleLog}
          disabled={addMutation.isPending || !name.trim()}
          className="w-full py-2.5 flex items-center justify-center gap-2 text-[10px] tracking-[0.2em] border transition-all"
          style={{
            borderColor: flash ? TEAL : AMBER,
            color: flash ? TEAL : AMBER,
            background: flash ? 'rgba(95,154,140,0.08)' : 'rgba(224,162,46,0.06)',
          }}>
          {flash ? <Check className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
          {flash ? 'ADDED TO QUEUE' : 'LOG & QUEUE'}
        </motion.button>
      </div>

      {/* Recent adds */}
      {recent.length > 0 && (
        <div className="border" style={PANEL}>
          <div className="px-3 py-2 border-b text-[8px] tracking-[0.18em]" style={{ borderColor: '#2A2118', color: DIM }}>
            THIS SESSION
          </div>
          <AnimatePresence>
            {recent.map((item, i) => (
              <motion.div key={item.id || i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex justify-between items-center px-3 py-2 border-b last:border-b-0"
                style={{ borderColor: '#2A2118' }}>
                <div>
                  <div className="text-[10px]" style={{ color: '#D8CFC0' }}>{item.item_name}</div>
                  <div className="text-[8px]" style={{ color: DIM }}>
                    {item.item_type?.replace('_', ' ')} · {item.condition_grade} · {item.size_class}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px]" style={{ color: TEAL }}>{fmt(item.est_sell_auec)}</div>
                  <div className="text-[8px]" style={{ color: DIM }}>×{item.quantity}</div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}