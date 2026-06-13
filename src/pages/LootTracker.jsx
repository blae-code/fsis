import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Loader2, ArrowRight, Wrench, TrendingUp, TrendingDown,
  Shield, Package, Sword, Zap, Box, Clock, AlertTriangle, ChevronDown,
  ChevronUp, BarChart2, List, Edit2, Check, X
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { differenceInDays } from 'date-fns';
import { Link } from 'react-router-dom';

// ─── Theme ──────────────────────────────────────────────────────────────────
const AMBER  = '#E0A22E';
const TEAL   = '#6FA08F';
const DIM    = '#7A6E60';
const DIMMER = '#3A3028';
const PANEL  = { background: '#111009', borderColor: '#2A2118' };

// ─── Constants ───────────────────────────────────────────────────────────────
const ITEM_TYPES = [
  { value: 'ship_component',    label: 'Ship Component',  icon: Shield },
  { value: 'fps_gear',          label: 'FPS Gear',         icon: Package },
  { value: 'weapon',            label: 'Weapon',            icon: Sword },
  { value: 'vehicle_component', label: 'Vehicle Comp',     icon: Zap },
  { value: 'bulk_cargo',        label: 'Bulk Cargo',        icon: Box },
];

const SIZE_CLASSES = ['S1','S2','S3','S4','S5','M','L','XL','N/A'];

const STATUS_PIPELINE = ['raw','repairing','repaired','listed','sold','scrapped'];
const STATUS_NEXT = { raw: 'repairing', repairing: 'repaired', repaired: 'listed', listed: 'sold' };
const STATUS_COLOR = {
  raw: '#7A6E60', repairing: '#C8893B', repaired: '#6FA08F',
  listed: '#E0A22E', sold: '#7BA05B', scrapped: '#C05050',
};
const STATUS_LABEL = {
  raw: 'RAW', repairing: 'REPAIRING', repaired: 'REPAIRED',
  listed: 'LISTED', sold: 'SOLD', scrapped: 'SCRAPPED',
};

const GRADE_COLOR = { new: '#7BA05B', refurb: '#6FA08F', used: '#C8893B', worn: '#C05050' };
const GRADE_MULT  = { new: 1.0, refurb: 0.85, used: 0.65, worn: 0.40 };
const REPAIR_RATE = { ship_component: 500, vehicle_component: 200, fps_gear: 100, weapon: 150, bulk_cargo: 0 };

const EMPTY_FORM = {
  item_name: '', item_type: 'ship_component', condition_pct: 80,
  size_class: 'N/A', manufacturer: '', quantity: 1,
  source_op: '', source_location: '', crew_handle: '',
  est_sell_auec: '', notes: '',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function conditionToGrade(pct) {
  if (pct >= 90) return 'new';
  if (pct >= 60) return 'refurb';
  if (pct >= 30) return 'used';
  return 'worn';
}

function fmt(n) {
  if (!n && n !== 0) return '—';
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return Number(n).toLocaleString();
}

function ageColor(days) {
  if (days >= 7) return '#C05050';
  if (days >= 3) return '#C8893B';
  return DIM;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-2 text-[9px] tracking-[0.22em] font-mono mb-2" style={{ color: '#B0793A' }}>
      <span className="w-3 h-px" style={{ background: '#B0793A' }} />
      {children}
      <span className="flex-1 h-px" style={{ background: 'rgba(90,62,28,0.25)' }} />
    </div>
  );
}

function GradePip({ pct }) {
  const grade = conditionToGrade(pct ?? 0);
  return (
    <span className="font-bold text-[9px] px-1.5 py-0.5 font-mono" style={{
      color: GRADE_COLOR[grade], border: `1px solid ${GRADE_COLOR[grade]}55`,
      background: `${GRADE_COLOR[grade]}18`,
    }}>
      {grade.toUpperCase()} {pct ?? 0}%
    </span>
  );
}

function StatusBadge({ status, onClick }) {
  const color = STATUS_COLOR[status] || DIM;
  return (
    <button
      onClick={onClick}
      title={onClick ? 'Click to advance status' : undefined}
      className="flex items-center gap-1 px-2 py-0.5 text-[8px] tracking-[0.14em] font-bold font-mono"
      style={{
        color, border: `1px solid ${color}55`, background: `${color}14`,
        clipPath: 'polygon(5px 0,100% 0,calc(100% - 5px) 100%,0 100%)',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {STATUS_LABEL[status] || status?.toUpperCase()}
      {onClick && <ArrowRight className="w-2 h-2" />}
    </button>
  );
}

function StatTile({ label, value, color, sub }) {
  return (
    <div className="border p-3 text-center" style={PANEL}>
      <div className="text-xl font-bold font-mono" style={{ color: color || AMBER }}>{value}</div>
      {sub && <div className="text-[9px] font-mono" style={{ color: TEAL }}>{sub}</div>}
      <div className="text-[8px] tracking-[0.16em] font-mono mt-0.5" style={{ color: DIMMER }}>{label}</div>
    </div>
  );
}

// ─── Add Item Form ────────────────────────────────────────────────────────────
function AddItemForm({ onClose, onSave }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const f = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
      <div className="border p-4 space-y-3" style={{ ...PANEL, borderColor: '#5C4424' }}>
        <SectionLabel>LOG NEW ITEM</SectionLabel>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <Input placeholder="Item name *" value={form.item_name} onChange={f('item_name')}
            className="h-8 text-xs font-mono bg-transparent col-span-2 md:col-span-1" style={{ borderColor: '#2A2118' }} />
          <Select value={form.item_type} onValueChange={(v) => setForm((p) => ({ ...p, item_type: v }))}>
            <SelectTrigger className="h-8 text-xs font-mono" style={{ borderColor: '#2A2118' }}><SelectValue /></SelectTrigger>
            <SelectContent>{ITEM_TYPES.map((t) => <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={form.size_class} onValueChange={(v) => setForm((p) => ({ ...p, size_class: v }))}>
            <SelectTrigger className="h-8 text-xs font-mono" style={{ borderColor: '#2A2118' }}><SelectValue /></SelectTrigger>
            <SelectContent>{SIZE_CLASSES.map((s) => <SelectItem key={s} value={s} className="text-xs font-mono">{s}</SelectItem>)}</SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Input type="number" min="0" max="100" placeholder="Condition %" value={form.condition_pct}
              onChange={f('condition_pct')} className="h-8 text-xs font-mono bg-transparent flex-1" style={{ borderColor: '#2A2118' }} />
            <GradePip pct={Number(form.condition_pct)} />
          </div>
          <Input placeholder="Manufacturer" value={form.manufacturer} onChange={f('manufacturer')}
            className="h-8 text-xs font-mono bg-transparent" style={{ borderColor: '#2A2118' }} />
          <Input type="number" min="1" placeholder="Qty" value={form.quantity} onChange={f('quantity')}
            className="h-8 text-xs font-mono bg-transparent" style={{ borderColor: '#2A2118' }} />
          <Input placeholder="Source op (e.g. Aaron Halo)" value={form.source_op} onChange={f('source_op')}
            className="h-8 text-xs font-mono bg-transparent" style={{ borderColor: '#2A2118' }} />
          <Input placeholder="Crew handle" value={form.crew_handle} onChange={f('crew_handle')}
            className="h-8 text-xs font-mono bg-transparent" style={{ borderColor: '#2A2118' }} />
          <Input type="number" min="0" placeholder="Est. sell value (aUEC)" value={form.est_sell_auec} onChange={f('est_sell_auec')}
            className="h-8 text-xs font-mono bg-transparent" style={{ borderColor: '#2A2118' }} />
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-3 py-1 text-[10px] font-mono" style={{ color: DIM }}>CANCEL</button>
          <button
            disabled={!form.item_name}
            onClick={() => onSave({
              ...form,
              condition_pct: Number(form.condition_pct),
              quantity: Number(form.quantity),
              est_sell_auec: form.est_sell_auec ? Number(form.est_sell_auec) : undefined,
              condition_grade: conditionToGrade(Number(form.condition_pct)),
            })}
            className="flex items-center gap-1 px-3 py-1 text-[10px] font-bold font-mono disabled:opacity-40"
            style={{ background: '#3A2810', border: '1px solid #B0793A', color: AMBER }}
          >
            LOG ITEM
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Inline Edit Row ─────────────────────────────────────────────────────────
function ItemRow({ item, onAdvance, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState({ condition_pct: item.condition_pct ?? 0, est_sell_auec: item.est_sell_auec ?? '' });
  const TypeIcon = ITEM_TYPES.find((t) => t.value === item.item_type)?.icon || Box;
  const ageDays = differenceInDays(new Date(), new Date(item.created_date));
  const nextStatus = STATUS_NEXT[item.status];
  const grade = conditionToGrade(item.condition_pct ?? 0);

  // Estimate value if not set
  const repairRate = REPAIR_RATE[item.item_type] || 0;
  const repairCost = Math.max(0, (100 - (item.condition_pct ?? 0)) * repairRate);
  const estSell = item.est_sell_auec || 0;
  const roi = estSell > 0 ? estSell - repairCost : null;

  function saveEdit() {
    onUpdate(item.id, {
      condition_pct: Number(editVal.condition_pct),
      condition_grade: conditionToGrade(Number(editVal.condition_pct)),
      est_sell_auec: editVal.est_sell_auec ? Number(editVal.est_sell_auec) : undefined,
    });
    setEditing(false);
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
      className="border"
      style={{ ...PANEL, borderColor: ageDays >= 7 ? '#5A2A2A' : ageDays >= 3 ? '#4A3A18' : '#2A2118' }}
    >
      <div className="grid grid-cols-[28px_1fr_auto_auto_auto_auto] gap-2 px-3 py-2.5 items-center">
        {/* Icon */}
        <TypeIcon className="w-4 h-4" style={{ color: TEAL }} />

        {/* Name + meta */}
        <div className="min-w-0">
          <div className="text-[11px] font-bold truncate" style={{ color: '#D8CFC0' }}>
            {item.item_name}
            {item.quantity > 1 && <span className="ml-1.5 text-[9px]" style={{ color: AMBER }}>×{item.quantity}</span>}
          </div>
          <div className="flex flex-wrap gap-x-2 text-[9px]" style={{ color: DIM }}>
            {item.manufacturer && <span>{item.manufacturer}</span>}
            {item.size_class && item.size_class !== 'N/A' && <span style={{ color: TEAL }}>{item.size_class}</span>}
            {item.source_op && <span>from {item.source_op}</span>}
            {item.crew_handle && <span style={{ color: '#B0793A' }}>@{item.crew_handle}</span>}
            {ageDays > 0 && <span style={{ color: ageColor(ageDays) }}>{ageDays}d old</span>}
          </div>
        </div>

        {/* Condition / est value — editable */}
        {editing ? (
          <div className="flex items-center gap-1">
            <Input type="number" min="0" max="100" value={editVal.condition_pct}
              onChange={(e) => setEditVal((p) => ({ ...p, condition_pct: e.target.value }))}
              className="h-6 w-14 text-[10px] font-mono bg-transparent text-center" style={{ borderColor: '#5C4424' }} />
            <Input type="number" min="0" placeholder="est aUEC" value={editVal.est_sell_auec}
              onChange={(e) => setEditVal((p) => ({ ...p, est_sell_auec: e.target.value }))}
              className="h-6 w-24 text-[10px] font-mono bg-transparent" style={{ borderColor: '#5C4424' }} />
            <button onClick={saveEdit} className="text-green-500 hover:opacity-80"><Check className="w-3.5 h-3.5" /></button>
            <button onClick={() => setEditing(false)} style={{ color: DIM }} className="hover:opacity-80"><X className="w-3.5 h-3.5" /></button>
          </div>
        ) : (
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setEditing(true)}>
            <GradePip pct={item.condition_pct ?? 0} />
            {estSell > 0 && (
              <span className="text-[9px] font-mono" style={{ color: AMBER }}>{fmt(estSell)} ¤</span>
            )}
            {roi !== null && (
              <span className="text-[8px] font-mono" style={{ color: roi >= 0 ? '#7BA05B' : '#C05050' }}>
                ROI {roi >= 0 ? '+' : ''}{fmt(roi)}
              </span>
            )}
            <Edit2 className="w-2.5 h-2.5 opacity-30" style={{ color: DIM }} />
          </div>
        )}

        {/* Status */}
        <StatusBadge status={item.status || 'raw'} onClick={nextStatus ? () => onAdvance(item, nextStatus) : undefined} />

        {/* Repair indicator */}
        {(item.status === 'raw' || item.status === 'repairing') && repairCost > 0 && (
          <span className="text-[8px] font-mono flex items-center gap-1" style={{ color: '#C8893B' }}>
            <Wrench className="w-2.5 h-2.5" />~{fmt(repairCost)}
          </span>
        )}
        {!(item.status === 'raw' || item.status === 'repairing') || repairCost === 0 ? (
          <span />
        ) : null}

        {/* Delete */}
        <button onClick={() => onDelete(item.id)} className="opacity-20 hover:opacity-70 transition-opacity" style={{ color: '#FF6B6B' }}>
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Pipeline Column ──────────────────────────────────────────────────────────
function PipelineColumn({ status, items, onAdvance, onDelete, onUpdate }) {
  const color = STATUS_COLOR[status];
  const total = items.reduce((s, i) => s + (i.est_sell_auec || 0), 0);
  return (
    <div className="flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-4" style={{ background: color, opacity: 0.7 }} />
          <span className="text-[9px] tracking-[0.2em] font-mono font-bold" style={{ color }}>{STATUS_LABEL[status]}</span>
          <span className="text-[9px] font-mono px-1.5" style={{ color: DIM, border: `1px solid ${DIMMER}` }}>{items.length}</span>
        </div>
        {total > 0 && <span className="text-[9px] font-mono" style={{ color: AMBER }}>{fmt(total)} ¤</span>}
      </div>
      <div className="space-y-1.5 overflow-y-auto flex-1 min-h-[80px]">
        <AnimatePresence>
          {items.map((item) => (
            <ItemRow key={item.id} item={item} onAdvance={onAdvance} onDelete={onDelete} onUpdate={onUpdate} />
          ))}
        </AnimatePresence>
        {items.length === 0 && (
          <div className="border p-4 text-center text-[9px] font-mono" style={{ ...PANEL, color: DIMMER }}>EMPTY</div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LootTracker() {
  const queryClient = useQueryClient();
  const [view, setView] = useState('list'); // 'list' | 'pipeline'
  const [formOpen, setFormOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('age'); // 'age' | 'value' | 'condition'

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['loot_tracker_items'],
    queryFn: () => base44.entities.loot_item.list('-created_date', 500),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['loot_tracker_items'] });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.loot_item.create(data),
    onSuccess: () => { invalidate(); setFormOpen(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.loot_item.update(id, data),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.loot_item.delete(id),
    onSuccess: invalidate,
  });

  const handleAdvance = (item, nextStatus) => updateMutation.mutate({ id: item.id, data: { status: nextStatus } });
  const handleUpdate  = (id, data) => updateMutation.mutate({ id, data });
  const handleDelete  = (id) => deleteMutation.mutate(id);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const active = items.filter((i) => !['sold', 'scrapped'].includes(i.status || 'raw'));
    const needsRepair = items.filter((i) => ['raw', 'repairing'].includes(i.status || 'raw'));
    const readyToSell = items.filter((i) => ['repaired', 'listed'].includes(i.status || 'raw'));
    const totalEstValue = readyToSell.reduce((s, i) => s + (i.est_sell_auec || 0), 0);
    const pipelineValue = active.reduce((s, i) => s + (i.est_sell_auec || 0), 0);
    const stale = active.filter((i) => differenceInDays(new Date(), new Date(i.created_date)) >= 7).length;
    return { active: active.length, needsRepair: needsRepair.length, readyToSell: readyToSell.length, totalEstValue, pipelineValue, stale };
  }, [items]);

  // ── Filtered + sorted items ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let out = items.filter((i) => {
      if (filterType !== 'all' && i.item_type !== filterType) return false;
      if (filterStatus !== 'all' && (i.status || 'raw') !== filterStatus) return false;
      return true;
    });
    if (sortBy === 'value') out = [...out].sort((a, b) => (b.est_sell_auec || 0) - (a.est_sell_auec || 0));
    else if (sortBy === 'condition') out = [...out].sort((a, b) => (b.condition_pct || 0) - (a.condition_pct || 0));
    else out = [...out].sort((a, b) => new Date(a.created_date) - new Date(b.created_date)); // oldest first
    return out;
  }, [items, filterType, filterStatus, sortBy]);

  // ── Pipeline grouping ──────────────────────────────────────────────────────
  const byStatus = useMemo(() => {
    const groups = {};
    STATUS_PIPELINE.forEach((s) => { groups[s] = []; });
    items.forEach((i) => { const s = i.status || 'raw'; if (groups[s]) groups[s].push(i); });
    return groups;
  }, [items]);

  return (
    <div className="os-viewport flex flex-col font-mono" style={{ background: '#0D0B09' }}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0"
        style={{ borderColor: '#2A2118', background: '#111009' }}>
        <div className="flex items-center gap-3">
          <Link to="/ops" className="text-[9px] tracking-[0.2em] opacity-40 hover:opacity-70 transition-opacity" style={{ color: AMBER }}>← OPS</Link>
          <span className="text-[9px] opacity-20" style={{ color: DIM }}>|</span>
          <span className="text-sm font-bold tracking-[0.15em]" style={{ color: AMBER }}>LOOT TRACKER</span>
          <span className="text-[9px] tracking-[0.2em]" style={{ color: DIM }}>GEAR · COMPONENTS · CARGO</span>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex border" style={{ borderColor: '#2A2118' }}>
            {[['list', List], ['pipeline', BarChart2]].map(([v, Icon]) => (
              <button key={v} onClick={() => setView(v)}
                className="px-2.5 py-1.5 text-[9px] flex items-center gap-1 transition-colors"
                style={{ background: view === v ? '#2A1E0C' : 'transparent', color: view === v ? AMBER : DIM }}>
                <Icon className="w-3 h-3" />
              </button>
            ))}
          </div>
          <button
            onClick={() => setFormOpen((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold tracking-[0.12em]"
            style={{
              background: formOpen ? '#2A1E0C' : '#1A130A',
              border: `1px solid ${formOpen ? '#B0793A' : '#3A2810'}`,
              color: formOpen ? AMBER : DIM,
              clipPath: 'polygon(8px 0,100% 0,calc(100%-8px) 100%,0 100%)',
            }}
          >
            <Plus className="w-3 h-3" /> LOG ITEM
          </button>
        </div>
      </div>

      {/* ── Stats Row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 px-4 py-3 shrink-0 border-b" style={{ borderColor: '#1E1810' }}>
        <StatTile label="ACTIVE" value={stats.active} color={TEAL} />
        <StatTile label="NEEDS REPAIR" value={stats.needsRepair} color="#C8893B" />
        <StatTile label="READY TO SELL" value={stats.readyToSell} color="#7BA05B" />
        <StatTile label="EST. SELL VALUE" value={`${fmt(stats.totalEstValue)} ¤`} color={AMBER} sub="ready items" />
        <StatTile label="PIPELINE VALUE" value={`${fmt(stats.pipelineValue)} ¤`} color={TEAL} sub="all active" />
        <StatTile label="STALE (7d+)" value={stats.stale} color={stats.stale > 0 ? '#C05050' : DIM} />
      </div>

      {/* ── Add Form ─────────────────────────────────────────────────────── */}
      <div className="px-4 pt-3 shrink-0">
        <AnimatePresence>
          {formOpen && (
            <AddItemForm
              onClose={() => setFormOpen(false)}
              onSave={(data) => createMutation.mutate(data)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ── Filters (list view only) ──────────────────────────────────── */}
      {view === 'list' && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-2 shrink-0">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-7 w-36 text-[10px] font-mono" style={{ borderColor: '#2A2118', background: '#0C0A07' }}>
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs font-mono">ALL TYPES</SelectItem>
              {ITEM_TYPES.map((t) => <SelectItem key={t.value} value={t.value} className="text-xs font-mono">{t.label.toUpperCase()}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-7 w-32 text-[10px] font-mono" style={{ borderColor: '#2A2118', background: '#0C0A07' }}>
              <SelectValue placeholder="All status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs font-mono">ALL STATUS</SelectItem>
              {STATUS_PIPELINE.map((s) => <SelectItem key={s} value={s} className="text-xs font-mono">{s.toUpperCase()}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-7 w-32 text-[10px] font-mono" style={{ borderColor: '#2A2118', background: '#0C0A07' }}>
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="age" className="text-xs font-mono">SORT: OLDEST</SelectItem>
              <SelectItem value="value" className="text-xs font-mono">SORT: VALUE</SelectItem>
              <SelectItem value="condition" className="text-xs font-mono">SORT: CONDITION</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-[9px] font-mono ml-auto" style={{ color: DIMMER }}>
            {filtered.length} ITEM{filtered.length !== 1 ? 'S' : ''}{filterType !== 'all' || filterStatus !== 'all' ? ' (FILTERED)' : ''}
          </span>
        </div>
      )}

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto px-4 pb-4 pt-1">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin" style={{ color: AMBER }} /></div>
        ) : view === 'pipeline' ? (
          /* Pipeline / Kanban view */
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-3 h-full">
            {STATUS_PIPELINE.map((s) => (
              <PipelineColumn key={s} status={s} items={byStatus[s] || []}
                onAdvance={handleAdvance} onDelete={handleDelete} onUpdate={handleUpdate} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="border p-16 text-center" style={{ ...PANEL, color: DIM }}>
            <Package className="w-8 h-8 mx-auto mb-3 opacity-30" style={{ color: TEAL }} />
            <div className="text-[11px] tracking-[0.2em]">NO ITEMS LOGGED</div>
            <div className="text-[9px] mt-1 opacity-60">Use the LOG ITEM button to record looted gear, components, or cargo.</div>
          </div>
        ) : (
          /* List view */
          <div className="space-y-1.5 mt-2">
            <AnimatePresence>
              {filtered.map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.015 }}>
                  <ItemRow item={item} onAdvance={handleAdvance} onDelete={handleDelete} onUpdate={handleUpdate} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div className="px-4 py-2 border-t shrink-0" style={{ borderColor: '#1E1810', background: '#0A0908' }}>
        <p className="text-[8px] font-mono text-center" style={{ color: DIMMER }}>
          Condition grades: New ≥90% · Refurb ≥60% · Used ≥30% · Worn &lt;30% — Repair costs are estimates only · Click status badge to advance pipeline · Click condition to edit
        </p>
      </div>
    </div>
  );
}