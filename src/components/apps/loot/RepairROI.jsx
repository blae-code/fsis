import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, TrendingUp, TrendingDown, Minus, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AMBER  = '#E0A22E';
const TEAL   = '#6FA08F';
const DIM    = '#7A6E60';
const DIMMER = '#3A3028';
const PANEL  = { background: '#111009', borderColor: '#2A2118' };

// Rough repair cost model per item type (aUEC per 1% condition restored)
const REPAIR_RATE = {
  ship_component: 500,
  vehicle_component: 200,
  fps_gear: 100,
  weapon: 150,
  bulk_cargo: 0,
};

// Condition-to-grade sell multiplier (relative to 100% value)
const GRADE_MULT = { new: 1.0, refurb: 0.85, used: 0.65, worn: 0.40 };

function conditionToGrade(pct) {
  if (pct >= 90) return 'new';
  if (pct >= 60) return 'refurb';
  if (pct >= 30) return 'used';
  return 'worn';
}

const GRADE_COLOR = { new: '#7BA05B', refurb: '#6FA08F', used: '#C8893B', worn: '#C05050' };

function SectionHead({ children }) {
  return (
    <div className="flex items-center gap-2 font-mono text-[9px] tracking-[0.28em] mb-2" style={{ color: '#B0793A' }}>
      <span className="w-2 h-px shrink-0" style={{ background: '#B0793A' }} />
      {children}
      <span className="flex-1 h-px" style={{ background: 'rgba(90,62,28,0.2)' }} />
    </div>
  );
}

export default function RepairROI() {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState('');
  const [targetCondition, setTargetCondition] = useState(90);
  const [baseValue, setBaseValue] = useState('');
  const [repairCostOverride, setRepairCostOverride] = useState('');
  const [logOpen, setLogOpen] = useState(false);
  const [logForm, setLogForm] = useState({ repair_cost_auec: '', repaired_by: '', condition_after: '', repair_location: '' });

  const { data: items = [] } = useQuery({
    queryKey: ['loot_items_repairable'],
    queryFn: () => base44.entities.loot_item.filter({ status: 'raw' }),
  });

  const repairingItems = useQuery({
    queryKey: ['loot_items_repairing'],
    queryFn: () => base44.entities.loot_item.filter({ status: 'repairing' }),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['loot_items_repairable'] });
    queryClient.invalidateQueries({ queryKey: ['loot_items_repairing'] });
    queryClient.invalidateQueries({ queryKey: ['loot_items'] });
  };

  const logRepairMutation = useMutation({
    mutationFn: async ({ itemId, logData }) => {
      await base44.entities.repair_log.create({ ...logData, loot_item_id: itemId, item_name: selected?.item_name });
      await base44.entities.loot_item.update(itemId, {
        status: 'repaired',
        condition_pct: Number(logData.condition_after) || selected.condition_pct,
        condition_grade: conditionToGrade(Number(logData.condition_after) || selected.condition_pct),
      });
    },
    onSuccess: () => { invalidate(); setLogOpen(false); setLogForm({ repair_cost_auec: '', repaired_by: '', condition_after: '', repair_location: '' }); },
  });

  const allRepairable = [...items, ...(repairingItems.data || [])];
  const selected = allRepairable.find((i) => i.id === selectedId);

  // Compute ROI
  const currentPct  = selected?.condition_pct || 0;
  const target      = Math.min(100, Math.max(currentPct, Number(targetCondition) || 90));
  const deltaPoints = target - currentPct;
  const rate        = REPAIR_RATE[selected?.item_type || 'ship_component'];
  const estRepairCost = repairCostOverride ? Number(repairCostOverride) : deltaPoints * rate;

  const base  = Number(baseValue) || 0;
  const sellBefore = base > 0 ? Math.round(base * GRADE_MULT[conditionToGrade(currentPct)]) : 0;
  const sellAfter  = base > 0 ? Math.round(base * GRADE_MULT[conditionToGrade(target)]) : 0;
  const gain       = sellAfter - sellBefore;
  const netROI     = gain - estRepairCost;
  const recommendation = estRepairCost === 0 ? 'N/A' : netROI > 0 ? 'REPAIR' : netROI > -500 ? 'MARGINAL' : 'SELL AS-IS';
  const recColor   = recommendation === 'REPAIR' ? '#7BA05B' : recommendation === 'MARGINAL' ? AMBER : '#C05050';

  function fmt(n) {
    if (!n) return '0';
    if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
    if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
    return n.toLocaleString();
  }

  return (
    <div className="p-4 space-y-5 font-mono">

      <SectionHead>REPAIR ROI CALCULATOR</SectionHead>

      {/* Item selector */}
      <div className="border p-3 space-y-3" style={{ ...PANEL, borderColor: '#3A2A18' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <p className="text-[9px] tracking-[0.2em] mb-1" style={{ color: DIM }}>SELECT ITEM (RAW / REPAIRING)</p>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="h-8 text-xs font-mono" style={{ borderColor: '#2A2118', background: '#0C0A07' }}>
                <SelectValue placeholder="Select a looted item…" />
              </SelectTrigger>
              <SelectContent>
                {allRepairable.map((i) => (
                  <SelectItem key={i.id} value={i.id} className="text-xs font-mono">
                    {i.item_name} — {i.condition_pct}% ({i.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-[9px] tracking-[0.2em] mb-1" style={{ color: DIM }}>TARGET CONDITION %</p>
            <Input type="number" min="0" max="100" value={targetCondition} onChange={(e) => setTargetCondition(e.target.value)}
              className="h-8 text-xs font-mono bg-transparent" style={{ borderColor: '#2A2118' }} />
          </div>
          <div>
            <p className="text-[9px] tracking-[0.2em] mb-1" style={{ color: DIM }}>BASE VALUE @ 100% (aUEC)</p>
            <Input type="number" min="0" placeholder="e.g. 50000" value={baseValue} onChange={(e) => setBaseValue(e.target.value)}
              className="h-8 text-xs font-mono bg-transparent" style={{ borderColor: '#2A2118' }} />
          </div>
          <div>
            <p className="text-[9px] tracking-[0.2em] mb-1" style={{ color: DIM }}>ACTUAL REPAIR COST (override)</p>
            <Input type="number" min="0" placeholder="Leave blank for estimate" value={repairCostOverride} onChange={(e) => setRepairCostOverride(e.target.value)}
              className="h-8 text-xs font-mono bg-transparent" style={{ borderColor: '#2A2118' }} />
          </div>
        </div>
      </div>

      {/* Results */}
      {selected && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          {/* Condition strip */}
          <div className="border p-3 flex items-center gap-4" style={{ ...PANEL, borderColor: '#3A2A18' }}>
            <div className="text-center">
              <div className="text-[8px] tracking-[0.2em]" style={{ color: DIM }}>CURRENT</div>
              <div className="text-xl font-bold" style={{ color: GRADE_COLOR[conditionToGrade(currentPct)] }}>{currentPct}%</div>
              <div className="text-[8px]" style={{ color: GRADE_COLOR[conditionToGrade(currentPct)] }}>{conditionToGrade(currentPct).toUpperCase()}</div>
            </div>
            <ArrowRight className="w-5 h-5 flex-1" style={{ color: AMBER }} />
            <div className="text-center">
              <div className="text-[8px] tracking-[0.2em]" style={{ color: DIM }}>AFTER REPAIR</div>
              <div className="text-xl font-bold" style={{ color: GRADE_COLOR[conditionToGrade(target)] }}>{target}%</div>
              <div className="text-[8px]" style={{ color: GRADE_COLOR[conditionToGrade(target)] }}>{conditionToGrade(target).toUpperCase()}</div>
            </div>
          </div>

          {/* Value table */}
          {base > 0 && (
            <div className="border p-3 space-y-2" style={{ ...PANEL, borderColor: '#3A2A18' }}>
              <Row label="SELL VALUE BEFORE" value={`${fmt(sellBefore)} aUEC`} dim />
              <Row label="REPAIR COST (EST.)" value={`−${fmt(estRepairCost)} aUEC`} color="#C05050" />
              <Row label="SELL VALUE AFTER REPAIR" value={`${fmt(sellAfter)} aUEC`} />
              <div className="border-t pt-2" style={{ borderColor: '#3A2A18' }}>
                <Row label="NET ROI" value={`${netROI >= 0 ? '+' : ''}${fmt(netROI)} aUEC`} color={netROI >= 0 ? '#7BA05B' : '#C05050'} bold />
              </div>
            </div>
          )}

          {/* Recommendation */}
          <div className="border p-3 flex items-center gap-3" style={{ ...PANEL, borderColor: `${recColor}44` }}>
            {recommendation === 'REPAIR' ? <TrendingUp className="w-5 h-5" style={{ color: recColor }} />
              : recommendation === 'SELL AS-IS' ? <TrendingDown className="w-5 h-5" style={{ color: recColor }} />
              : <Minus className="w-5 h-5" style={{ color: recColor }} />}
            <div>
              <div className="text-sm font-bold tracking-[0.15em]" style={{ color: recColor }}>{recommendation}</div>
              <div className="text-[9px]" style={{ color: DIM }}>
                {recommendation === 'REPAIR' ? 'Repair cost is justified — net positive ROI.' :
                 recommendation === 'SELL AS-IS' ? 'Repair costs exceed value gain — sell current condition.' :
                 'Marginal — repair only if you have a buyer lined up.'}
              </div>
            </div>
          </div>

          {/* Log repair button */}
          <button
            onClick={() => setLogOpen((v) => !v)}
            className="flex items-center gap-2 px-3 py-2 text-[10px] font-bold tracking-[0.12em] w-full justify-center"
            style={{ background: '#1A130A', border: `1px solid ${logOpen ? '#B0793A' : '#3A2A18'}`, color: logOpen ? AMBER : DIM }}
          >
            <Wrench className="w-3.5 h-3.5" /> LOG COMPLETED REPAIR
          </button>

          <AnimatePresence>
            {logOpen && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="border p-3 space-y-2" style={{ ...PANEL, borderColor: '#5C4424' }}>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="number" placeholder="Actual repair cost aUEC" value={logForm.repair_cost_auec} onChange={(e) => setLogForm({ ...logForm, repair_cost_auec: e.target.value })}
                      className="h-8 text-xs font-mono bg-transparent" style={{ borderColor: '#2A2118' }} />
                    <Input type="number" min="0" max="100" placeholder="Condition after %" value={logForm.condition_after} onChange={(e) => setLogForm({ ...logForm, condition_after: e.target.value })}
                      className="h-8 text-xs font-mono bg-transparent" style={{ borderColor: '#2A2118' }} />
                    <Input placeholder="Repaired by (handle)" value={logForm.repaired_by} onChange={(e) => setLogForm({ ...logForm, repaired_by: e.target.value })}
                      className="h-8 text-xs font-mono bg-transparent" style={{ borderColor: '#2A2118' }} />
                    <Input placeholder="Repair location" value={logForm.repair_location} onChange={(e) => setLogForm({ ...logForm, repair_location: e.target.value })}
                      className="h-8 text-xs font-mono bg-transparent" style={{ borderColor: '#2A2118' }} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setLogOpen(false)} className="px-3 py-1 text-[10px]" style={{ color: DIM }}>CANCEL</button>
                    <button
                      disabled={!logForm.repair_cost_auec || logRepairMutation.isPending}
                      onClick={() => logRepairMutation.mutate({ itemId: selectedId, logData: { ...logForm, repair_cost_auec: Number(logForm.repair_cost_auec), condition_before: currentPct } })}
                      className="flex items-center gap-1 px-3 py-1 text-[10px] font-bold disabled:opacity-40"
                      style={{ background: '#3A2810', border: '1px solid #B0793A', color: AMBER }}
                    >
                      {logRepairMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                      SAVE REPAIR LOG
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {!selected && (
        <div className="border p-10 text-center text-[10px]" style={{ ...PANEL, color: DIM }}>
          Select a raw or repairing item above to run an ROI analysis.
        </div>
      )}
    </div>
  );
}

function Row({ label, value, dim, color, bold }) {
  return (
    <div className="flex justify-between text-[10px]">
      <span style={{ color: dim ? '#7A6E60' : '#9C9080' }}>{label}</span>
      <span className={bold ? 'font-bold' : ''} style={{ color: color || '#D8CFC0' }}>{value}</span>
    </div>
  );
}