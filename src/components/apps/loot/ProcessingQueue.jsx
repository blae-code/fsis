import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, TrendingUp, Plus, ChevronRight, ChevronDown, Check, X, Loader2 } from 'lucide-react';
import { publishLootItem } from '@/functions/publishLootItem';
import { roundPrice } from '@/lib/pricing';
import { differenceInDays } from 'date-fns';

const AMBER  = '#E0A22E';
const TEAL   = '#6FA08F';
const GREEN  = '#7BA05B';
const RED    = '#C05050';
const DIM    = '#7A6E60';
const DIMMER = '#3A3028';
const PANEL  = { background: '#0E0C09', borderColor: '#2A2118' };

const REPAIR_RATE = { ship_component: 500, vehicle_component: 200, fps_gear: 100, weapon: 150, bulk_cargo: 0 };

const STATUS_COLOR = {
  raw: DIM, repairing: '#C8893B', repaired: TEAL, listed: AMBER, sold: GREEN, scrapped: RED,
};

const CONDITION_ACTIONS = [
  { range: [90, 100], label: 'MINT — List immediately',     color: GREEN, action: 'list now'    },
  { range: [60,  89], label: 'REFURB — Minor repair rec.',  color: TEAL,  action: 'quick repair' },
  { range: [30,  59], label: 'USED — Full repair needed',   color: AMBER, action: 'full repair'  },
  { range: [0,   29], label: 'WORN — Repair or scrap eval', color: RED,   action: 'assess'       },
];

function conditionAdvice(pct) {
  return CONDITION_ACTIONS.find(({ range }) => pct >= range[0] && pct <= range[1]);
}

function conditionToGrade(pct) {
  if (pct >= 90) return 'new';
  if (pct >= 60) return 'refurb';
  if (pct >= 30) return 'used';
  return 'worn';
}

function fmt(n) {
  if (!n) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

// ── Queue item card ─────────────────────────────────────────────────────────
function QueueCard({ item, onUpdate, onDelete, onPublish }) {
  const [open, setOpen]       = useState(false);
  const [repairCostInput, setRepairCostInput] = useState('');
  const [estSellInput, setEstSellInput]       = useState(item.est_sell_auec ?? '');
  const [notesInput, setNotesInput]           = useState(item.notes ?? '');
  const [saving, setSaving]   = useState(false);

  const ageDays    = differenceInDays(new Date(), new Date(item.created_date));
  const repairRate = REPAIR_RATE[item.item_type] || 0;
  const repairEst  = Math.max(0, (100 - (item.condition_pct ?? 0)) * repairRate);
  const estSell    = roundPrice(item.est_sell_auec || 0);
  const roi        = estSell > 0 ? estSell - repairEst : null;
  const advice     = conditionAdvice(item.condition_pct ?? 0);
  const isActive   = !['sold','scrapped','listed'].includes(item.status);
  const statusColor = STATUS_COLOR[item.status] || DIM;

  async function saveDetails() {
    setSaving(true);
    const updates = {};
    if (estSellInput !== '' && Number(estSellInput) !== item.est_sell_auec) {
      updates.est_sell_auec = Number(estSellInput);
    }
    if (notesInput !== item.notes) updates.notes = notesInput;
    await onUpdate(item.id, updates);
    setSaving(false);
    setOpen(false);
  }

  async function logRepair() {
    const cost = Number(repairCostInput);
    if (!cost) return;
    setSaving(true);
    // Advance status to repaired and log a repair record
    await onUpdate(item.id, { status: 'repaired' });
    await base44.entities.repair_log.create({
      loot_item_id: item.id,
      item_name: item.item_name,
      repair_cost_auec: cost,
      condition_before: item.condition_pct,
      condition_after: 100,
    });
    setRepairCostInput('');
    setSaving(false);
  }

  async function advance() {
    if (item.status === 'repaired') {
      await onPublish(item);
      return;
    }
    const next = { raw: 'repairing', repairing: 'repaired' }[item.status];
    if (next) await onUpdate(item.id, { status: next });
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      className="border overflow-hidden"
      style={{ ...PANEL, borderColor: ageDays >= 7 ? '#5A2A2A' : ageDays >= 3 ? '#4A3A18' : '#2A2118' }}
    >
      {/* ── Summary row ── */}
      <div className="flex items-center gap-3 px-3 py-2.5">
        {/* Status pip */}
        <span className="w-1.5 h-5 shrink-0 rounded-sm" style={{ background: statusColor }} />

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold truncate" style={{ color: '#D8CFC0' }}>{item.item_name}</span>
            {item.quantity > 1 && <span className="text-[8px] px-1" style={{ color: AMBER, border: `1px solid ${AMBER}44` }}>×{item.quantity}</span>}
            {item.size_class && item.size_class !== 'N/A' && (
              <span className="text-[8px] px-1" style={{ color: TEAL, border: `1px solid ${TEAL}44` }}>{item.size_class}</span>
            )}
          </div>
          <div className="text-[8px] mt-0.5 flex items-center gap-2" style={{ color: DIM }}>
            <span style={{ color: statusColor }}>● {(item.status || 'raw').toUpperCase()}</span>
            {item.manufacturer && <span>{item.manufacturer}</span>}
            {item.source_op && <span>from {item.source_op}</span>}
            {ageDays > 0 && <span style={{ color: ageDays >= 7 ? RED : ageDays >= 3 ? '#C8893B' : DIM }}>{ageDays}d</span>}
          </div>
        </div>

        {/* Condition */}
        <div className="text-center shrink-0">
          <div className="text-sm font-bold font-mono" style={{ color: advice?.color || DIM }}>{item.condition_pct ?? 0}%</div>
          <div className="text-[7px] tracking-[0.1em]" style={{ color: advice?.color || DIM }}>{conditionToGrade(item.condition_pct ?? 0).toUpperCase()}</div>
        </div>

        {/* ROI */}
        <div className="text-right shrink-0 min-w-[70px]">
          {estSell > 0 ? (
            <>
              <div className="text-[10px] font-bold font-mono" style={{ color: AMBER }}>{fmt(estSell)} ¤</div>
              {roi !== null && (
                <div className="text-[8px] font-mono" style={{ color: roi >= 0 ? GREEN : RED }}>
                  {roi >= 0 ? '+' : ''}{fmt(roi)} ROI
                </div>
              )}
            </>
          ) : (
            <span className="text-[8px]" style={{ color: DIMMER }}>no est.</span>
          )}
        </div>

        {/* Expand toggle */}
        <button onClick={() => setOpen((v) => !v)} style={{ color: DIM }}>
          {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* ── Expanded detail panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t"
            style={{ borderColor: '#2A2118' }}
          >
            <div className="px-3 py-3 space-y-3">
              {/* Condition advice */}
              {advice && (
                <div className="flex items-center gap-2 px-2 py-1.5 text-[9px]"
                  style={{ background: `${advice.color}0E`, border: `1px solid ${advice.color}33`, color: advice.color }}>
                  <TrendingUp className="w-3 h-3 shrink-0" />
                  <span>{advice.label}</span>
                  <span className="ml-auto font-bold tracking-[0.1em]">→ {advice.action.toUpperCase()}</span>
                </div>
              )}

              {/* Repair estimate breakdown */}
              {isActive && (
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="border p-2" style={PANEL}>
                    <div className="text-[8px]" style={{ color: DIMMER }}>REPAIR EST.</div>
                    <div className="text-sm font-bold" style={{ color: repairEst > 0 ? '#C8893B' : GREEN }}>
                      {repairEst > 0 ? `~${fmt(repairEst)} ¤` : 'NONE'}
                    </div>
                  </div>
                  <div className="border p-2" style={PANEL}>
                    <div className="text-[8px]" style={{ color: DIMMER }}>SELL EST.</div>
                    <div className="text-sm font-bold" style={{ color: AMBER }}>
                      {estSell > 0 ? `${fmt(estSell)} ¤` : '—'}
                    </div>
                  </div>
                  <div className="border p-2" style={PANEL}>
                    <div className="text-[8px]" style={{ color: DIMMER }}>NET ROI</div>
                    <div className="text-sm font-bold" style={{ color: roi !== null ? (roi >= 0 ? GREEN : RED) : DIM }}>
                      {roi !== null ? `${roi >= 0 ? '+' : ''}${fmt(roi)} ¤` : '—'}
                    </div>
                  </div>
                </div>
              )}

              {/* Log actual repair cost */}
              {(item.status === 'repairing' || item.status === 'raw') && (
                <div className="flex items-center gap-2">
                  <Wrench className="w-3 h-3 shrink-0" style={{ color: '#C8893B' }} />
                  <input
                    type="number" min="0" placeholder="Actual repair cost (aUEC)"
                    className="flex-1 h-7 bg-transparent border px-2 text-[10px] font-mono outline-none"
                    style={{ borderColor: '#4A3A18', color: '#D8CFC0' }}
                    value={repairCostInput}
                    onChange={(e) => setRepairCostInput(e.target.value)}
                  />
                  <button
                    disabled={!repairCostInput || saving}
                    onClick={logRepair}
                    className="px-2.5 py-1 text-[9px] font-mono font-bold border disabled:opacity-40"
                    style={{ color: '#C8893B', borderColor: '#C8893B55', background: '#C8893B0E' }}
                  >
                    LOG REPAIR
                  </button>
                </div>
              )}

              {/* Sell estimate + notes edit */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[8px] mb-1 tracking-[0.12em]" style={{ color: DIMMER }}>MARKET SELL EST. (aUEC)</div>
                  <input
                    type="number" min="0" placeholder="e.g. 45000"
                    className="w-full h-7 bg-transparent border px-2 text-[10px] font-mono outline-none"
                    style={{ borderColor: '#2A2118', color: '#D8CFC0' }}
                    value={estSellInput}
                    onChange={(e) => setEstSellInput(e.target.value)}
                  />
                </div>
                <div>
                  <div className="text-[8px] mb-1 tracking-[0.12em]" style={{ color: DIMMER }}>RESALE NOTES</div>
                  <input
                    type="text" placeholder="e.g. Rare S2 — good demand at GrimHex"
                    className="w-full h-7 bg-transparent border px-2 text-[10px] font-mono outline-none"
                    style={{ borderColor: '#2A2118', color: '#D8CFC0' }}
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                  />
                </div>
              </div>

              {/* Action row */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  {/* Advance status */}
                  {['raw','repairing','repaired'].includes(item.status) && (
                    <button
                      onClick={advance}
                      disabled={saving}
                      className="px-2.5 py-1 text-[9px] font-mono font-bold border flex items-center gap-1 disabled:opacity-40"
                      style={{ color: AMBER, borderColor: `${AMBER}55`, background: `${AMBER}0E` }}
                    >
                      → {({ raw: 'START REPAIR', repairing: 'MARK REPAIRED', repaired: 'LIST ON STOREFRONT' }[item.status])}
                    </button>
                  )}
                  <button
                    onClick={saveDetails}
                    disabled={saving}
                    className="px-2.5 py-1 text-[9px] font-mono border flex items-center gap-1 disabled:opacity-40"
                    style={{ color: GREEN, borderColor: `${GREEN}55`, background: `${GREEN}0E` }}
                  >
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    SAVE
                  </button>
                </div>
                <button
                  onClick={() => onDelete(item.id)}
                  className="text-[8px] font-mono px-2 py-1"
                  style={{ color: DIMMER }}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Quick-add form ───────────────────────────────────────────────────────────
function QuickAddForm({ onSave, onClose }) {
  const [name, setName]       = useState('');
  const [type, setType]       = useState('ship_component');
  const [cond, setCond]       = useState('80');
  const [mfr, setMfr]         = useState('');
  const [size, setSize]       = useState('N/A');
  const [source, setSource]   = useState('');
  const [estSell, setEstSell] = useState('');

  const grade = conditionToGrade(Number(cond));
  const GRADE_COLOR = { new: GREEN, refurb: TEAL, used: AMBER, worn: RED };

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
      <div className="border p-3 space-y-2 mb-3" style={{ ...PANEL, borderColor: '#5C4424' }}>
        <div className="text-[9px] tracking-[0.2em] mb-1" style={{ color: '#B0793A' }}>▸ LOG COMPONENT TO QUEUE</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <input placeholder="Item name *" value={name} onChange={(e) => setName(e.target.value)}
            className="col-span-2 h-7 bg-transparent border px-2 text-[10px] font-mono outline-none" style={{ borderColor: '#2A2118', color: '#D8CFC0' }} />
          <select value={type} onChange={(e) => setType(e.target.value)}
            className="h-7 bg-transparent border px-2 text-[10px] font-mono outline-none" style={{ borderColor: '#2A2118', color: '#D8CFC0', background: '#0E0C09' }}>
            <option value="ship_component">Ship Component</option>
            <option value="vehicle_component">Vehicle Comp</option>
            <option value="fps_gear">FPS Gear</option>
            <option value="weapon">Weapon</option>
            <option value="bulk_cargo">Bulk Cargo</option>
          </select>
          <select value={size} onChange={(e) => setSize(e.target.value)}
            className="h-7 bg-transparent border px-2 text-[10px] font-mono outline-none" style={{ borderColor: '#2A2118', color: '#D8CFC0', background: '#0E0C09' }}>
            {['S1','S2','S3','S4','S5','M','L','XL','N/A'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="flex items-center gap-1.5">
            <input type="number" min="0" max="100" placeholder="Cond %" value={cond} onChange={(e) => setCond(e.target.value)}
              className="flex-1 h-7 bg-transparent border px-2 text-[10px] font-mono outline-none" style={{ borderColor: '#2A2118', color: '#D8CFC0' }} />
            <span className="text-[8px] px-1.5 py-0.5 font-bold" style={{ color: GRADE_COLOR[grade], border: `1px solid ${GRADE_COLOR[grade]}44` }}>{grade.toUpperCase()}</span>
          </div>
          <input placeholder="Manufacturer" value={mfr} onChange={(e) => setMfr(e.target.value)}
            className="h-7 bg-transparent border px-2 text-[10px] font-mono outline-none" style={{ borderColor: '#2A2118', color: '#D8CFC0' }} />
          <input placeholder="Source op / location" value={source} onChange={(e) => setSource(e.target.value)}
            className="h-7 bg-transparent border px-2 text-[10px] font-mono outline-none" style={{ borderColor: '#2A2118', color: '#D8CFC0' }} />
          <input type="number" min="0" placeholder="Est. sell (aUEC)" value={estSell} onChange={(e) => setEstSell(e.target.value)}
            className="h-7 bg-transparent border px-2 text-[10px] font-mono outline-none" style={{ borderColor: '#2A2118', color: '#D8CFC0' }} />
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <button onClick={onClose} className="px-3 py-1 text-[9px] font-mono" style={{ color: DIM }}>CANCEL</button>
          <button
            disabled={!name}
            onClick={() => onSave({
              item_name: name, item_type: type,
              condition_pct: Number(cond), condition_grade: conditionToGrade(Number(cond)),
              size_class: size, manufacturer: mfr, source_op: source,
              est_sell_auec: estSell ? Number(estSell) : undefined,
              status: 'raw', quantity: 1,
            })}
            className="px-3 py-1 text-[9px] font-mono font-bold border disabled:opacity-40"
            style={{ color: AMBER, borderColor: `${AMBER}55`, background: `${AMBER}0E` }}
          >
            ADD TO QUEUE
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────
export default function ProcessingQueue() {
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [stageFilter, setStageFilter] = useState('active'); // 'active' | 'all' | stage key

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['loot_items_queue'],
    queryFn: () => base44.entities.loot_item.list('-created_date', 500),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['loot_items_queue'] });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.loot_item.create(data),
    onSuccess: () => { invalidate(); setAddOpen(false); },
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.loot_item.update(id, data),
    onSuccess: invalidate,
  });
  const publishMutation = useMutation({
    mutationFn: (item) => publishLootItem({ loot_item_id: item.id, price_auec: roundPrice(item.est_sell_auec || 0), quantity: item.quantity || 1 }),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.loot_item.delete(id),
    onSuccess: invalidate,
  });

  const handleUpdate = (id, data) => updateMutation.mutateAsync({ id, data });
  const handleDelete = (id) => deleteMutation.mutate(id);
  const handlePublish = (item) => publishMutation.mutateAsync(item);

  // Stage counts
  const stageCounts = useMemo(() => {
    const c = { raw: 0, repairing: 0, repaired: 0, listed: 0, sold: 0, scrapped: 0 };
    items.forEach((i) => { const s = i.status || 'raw'; if (c[s] !== undefined) c[s]++; });
    return c;
  }, [items]);

  const activeCount = stageCounts.raw + stageCounts.repairing + stageCounts.repaired;

  // Summary metrics
  const summary = useMemo(() => {
    const active = items.filter((i) => ['raw','repairing','repaired'].includes(i.status || 'raw'));
    const readyROI = items
      .filter((i) => i.status === 'repaired' || i.status === 'listed')
      .reduce((s, i) => {
        const rr = REPAIR_RATE[i.item_type] || 0;
        const repEst = Math.max(0, (100 - (i.condition_pct ?? 0)) * rr);
        return s + Math.max(0, (i.est_sell_auec || 0) - repEst);
      }, 0);
    const pipelineVal = active.reduce((s, i) => s + (i.est_sell_auec || 0), 0);
    const needsRepair = stageCounts.raw + stageCounts.repairing;
    return { active: active.length, readyROI, pipelineVal, needsRepair };
  }, [items, stageCounts]);

  // Filtered list
  const filtered = useMemo(() => {
    if (stageFilter === 'active') return items.filter((i) => ['raw','repairing','repaired'].includes(i.status || 'raw'));
    if (stageFilter === 'all') return items;
    return items.filter((i) => (i.status || 'raw') === stageFilter);
  }, [items, stageFilter]);

  const STAGE_TABS = [
    { key: 'active', label: 'ACTIVE', count: activeCount, color: TEAL },
    { key: 'raw',       label: 'RAW',      count: stageCounts.raw,       color: DIM    },
    { key: 'repairing', label: 'REPAIRING',count: stageCounts.repairing, color: '#C8893B' },
    { key: 'repaired',  label: 'REPAIRED', count: stageCounts.repaired,  color: TEAL   },
    { key: 'listed',    label: 'LISTED',   count: stageCounts.listed,    color: AMBER  },
    { key: 'all',       label: 'ALL',      count: items.length,          color: DIM    },
  ];

  return (
    <div className="flex flex-col h-full font-mono">
      {/* ── Summary strip ── */}
      <div className="grid grid-cols-4 gap-1.5 px-3 py-2.5 border-b shrink-0" style={{ borderColor: '#2A2118', background: '#0A0908' }}>
        {[
          { label: 'IN QUEUE',      value: summary.active,                         color: TEAL  },
          { label: 'NEEDS REPAIR',  value: summary.needsRepair,                    color: '#C8893B' },
          { label: 'PIPELINE VALUE',value: summary.pipelineVal > 0 ? `~${(summary.pipelineVal/1000).toFixed(0)}k ¤` : '—', color: AMBER },
          { label: 'NET ROI (READY)',value: summary.readyROI > 0 ? `+${(summary.readyROI/1000).toFixed(0)}k ¤` : '—', color: GREEN },
        ].map((s) => (
          <div key={s.label} className="text-center border py-1.5" style={PANEL}>
            <div className="text-sm font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[7px] tracking-[0.14em]" style={{ color: DIMMER }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Stage filter tabs ── */}
      <div className="flex items-center gap-0.5 px-3 py-2 border-b shrink-0 overflow-x-auto" style={{ borderColor: '#2A2118' }}>
        {STAGE_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setStageFilter(t.key)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[8px] tracking-[0.12em] font-bold border transition-colors shrink-0"
            style={{
              borderColor: stageFilter === t.key ? `${t.color}88` : DIMMER,
              color: stageFilter === t.key ? t.color : DIM,
              background: stageFilter === t.key ? `${t.color}0E` : 'transparent',
            }}
          >
            {t.label}
            <span className="text-[7px] px-1 py-0.5" style={{ background: DIMMER, color: '#D8CFC0' }}>{t.count}</span>
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => setAddOpen((v) => !v)}
          className="flex items-center gap-1 px-2.5 py-1 text-[8px] font-bold border shrink-0"
          style={{ color: addOpen ? AMBER : DIM, borderColor: addOpen ? `${AMBER}55` : DIMMER, background: addOpen ? `${AMBER}0E` : 'transparent' }}
        >
          <Plus className="w-3 h-3" /> LOG
        </button>
      </div>

      {/* ── Quick add form ── */}
      <div className="px-3 pt-2 shrink-0">
        <AnimatePresence>
          {addOpen && <QuickAddForm onSave={(d) => createMutation.mutate(d)} onClose={() => setAddOpen(false)} />}
        </AnimatePresence>
      </div>

      {/* ── Item list ── */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5 pt-1">
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-4 h-4 animate-spin" style={{ color: AMBER }} /></div>
        ) : filtered.length === 0 ? (
          <div className="border py-10 text-center" style={{ ...PANEL, color: DIMMER }}>
            <div className="text-[10px] tracking-[0.18em] mb-1">QUEUE EMPTY</div>
            <div className="text-[8px]">Log a component using the LOG button above.</div>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((item) => (
              <QueueCard key={item.id} item={item} onUpdate={handleUpdate} onDelete={handleDelete} onPublish={handlePublish} />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}