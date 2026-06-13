import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Loader2, ArrowRight, Shield, Zap, Package, Sword, Box } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const AMBER  = '#E0A22E';
const TEAL   = '#6FA08F';
const DIM    = '#7A6E60';
const DIMMER = '#3A3028';
const PANEL  = { background: '#111009', borderColor: '#2A2118' };

const ITEM_TYPES = [
  { value: 'ship_component', label: 'Ship Component', icon: Shield },
  { value: 'fps_gear',       label: 'FPS Gear',        icon: Package },
  { value: 'weapon',         label: 'Weapon',           icon: Sword },
  { value: 'vehicle_component', label: 'Vehicle Comp', icon: Zap },
  { value: 'bulk_cargo',     label: 'Bulk Cargo',       icon: Box },
];

const SIZE_CLASSES = ['S1','S2','S3','S4','S5','M','L','XL','N/A'];

const STATUS_PIPELINE = ['raw','repairing','repaired','listed','sold','scrapped'];
const STATUS_COLOR = {
  raw: '#7A6E60', repairing: '#C8893B', repaired: '#6FA08F',
  listed: '#E0A22E', sold: '#7BA05B', scrapped: '#C05050',
};

function conditionToGrade(pct) {
  if (pct >= 90) return 'new';
  if (pct >= 60) return 'refurb';
  if (pct >= 30) return 'used';
  return 'worn';
}

const GRADE_COLOR = { new: '#7BA05B', refurb: '#6FA08F', used: '#C8893B', worn: '#C05050' };

function GradePip({ pct }) {
  const grade = conditionToGrade(pct);
  return (
    <span className="font-bold text-[9px] px-1.5 py-0.5 font-mono" style={{
      color: GRADE_COLOR[grade], border: `1px solid ${GRADE_COLOR[grade]}55`,
      background: `${GRADE_COLOR[grade]}18`,
    }}>
      {grade.toUpperCase()} {pct}%
    </span>
  );
}

const EMPTY_FORM = {
  item_name: '', item_type: 'ship_component', condition_pct: 80,
  size_class: 'N/A', manufacturer: '', quantity: 1,
  source_op: '', source_location: '', crew_handle: '', notes: '',
};

export default function LootManifest() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['loot_items'],
    queryFn: () => base44.entities.loot_item.list('-created_date', 200),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['loot_items'] });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.loot_item.create({
      ...data,
      condition_grade: conditionToGrade(Number(data.condition_pct)),
    }),
    onSuccess: () => { invalidate(); setFormOpen(false); setForm(EMPTY_FORM); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.loot_item.update(id, data),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.loot_item.delete(id),
    onSuccess: invalidate,
  });

  const cycleStatus = (item) => {
    const idx = STATUS_PIPELINE.indexOf(item.status || 'raw');
    const next = STATUS_PIPELINE[(idx + 1) % STATUS_PIPELINE.length];
    updateMutation.mutate({ id: item.id, data: { status: next } });
  };

  const filtered = items.filter((i) => {
    if (filterType !== 'all' && i.item_type !== filterType) return false;
    if (filterStatus !== 'all' && i.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="p-4 space-y-4 font-mono">

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex gap-2 flex-wrap">
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
        </div>
        <button
          onClick={() => setFormOpen((v) => !v)}
          className="flex items-center gap-1 px-3 py-1 text-[9px] tracking-[0.12em] font-bold"
          style={{ background: formOpen ? '#2A1E0C' : '#111009', border: `1px solid ${formOpen ? '#B0793A' : '#2A2118'}`, color: formOpen ? AMBER : DIM, clipPath: 'polygon(6px 0,100% 0,calc(100%-6px) 100%,0 100%)' }}
        >
          <Plus className="w-2.5 h-2.5" /> LOG ITEM
        </button>
      </div>

      {/* Add form */}
      <AnimatePresence>
        {formOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="border p-3 space-y-2" style={{ ...PANEL, borderColor: '#5C4424' }}>
              <p className="text-[9px] tracking-[0.2em]" style={{ color: '#B0793A' }}>LOG LOOTED / RECOVERED ITEM</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <Input placeholder="Item name *" value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })}
                  className="h-8 text-xs font-mono bg-transparent col-span-2 md:col-span-1" style={{ borderColor: '#2A2118' }} />
                <Select value={form.item_type} onValueChange={(v) => setForm({ ...form, item_type: v })}>
                  <SelectTrigger className="h-8 text-xs font-mono" style={{ borderColor: '#2A2118' }}><SelectValue /></SelectTrigger>
                  <SelectContent>{ITEM_TYPES.map((t) => <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>)}</SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Input type="number" min="0" max="100" placeholder="Condition %" value={form.condition_pct}
                    onChange={(e) => setForm({ ...form, condition_pct: e.target.value })}
                    className="h-8 text-xs font-mono bg-transparent flex-1" style={{ borderColor: '#2A2118' }} />
                  <GradePip pct={Number(form.condition_pct)} />
                </div>
                <Select value={form.size_class} onValueChange={(v) => setForm({ ...form, size_class: v })}>
                  <SelectTrigger className="h-8 text-xs font-mono" style={{ borderColor: '#2A2118' }}><SelectValue /></SelectTrigger>
                  <SelectContent>{SIZE_CLASSES.map((s) => <SelectItem key={s} value={s} className="text-xs font-mono">{s}</SelectItem>)}</SelectContent>
                </Select>
                <Input placeholder="Manufacturer" value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })}
                  className="h-8 text-xs font-mono bg-transparent" style={{ borderColor: '#2A2118' }} />
                <Input type="number" min="1" placeholder="Qty" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="h-8 text-xs font-mono bg-transparent" style={{ borderColor: '#2A2118' }} />
                <Input placeholder="Source op (e.g. Aaron Halo bounty)" value={form.source_op} onChange={(e) => setForm({ ...form, source_op: e.target.value })}
                  className="h-8 text-xs font-mono bg-transparent col-span-2 md:col-span-1" style={{ borderColor: '#2A2118' }} />
                <Input placeholder="Crew handle" value={form.crew_handle} onChange={(e) => setForm({ ...form, crew_handle: e.target.value })}
                  className="h-8 text-xs font-mono bg-transparent" style={{ borderColor: '#2A2118' }} />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setFormOpen(false)} className="px-3 py-1 text-[10px]" style={{ color: DIM }}>CANCEL</button>
                <button
                  disabled={!form.item_name || createMutation.isPending}
                  onClick={() => createMutation.mutate({ ...form, condition_pct: Number(form.condition_pct), quantity: Number(form.quantity) })}
                  className="flex items-center gap-1 px-3 py-1 text-[10px] font-bold disabled:opacity-40"
                  style={{ background: '#3A2810', border: '1px solid #B0793A', color: AMBER }}
                >
                  {createMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  LOG ITEM
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Count */}
      <div className="text-[9px] tracking-[0.2em]" style={{ color: DIMMER }}>
        {filtered.length} ITEM{filtered.length !== 1 ? 'S' : ''} {filterType !== 'all' || filterStatus !== 'all' ? '(FILTERED)' : ''}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-4 h-4 animate-spin" style={{ color: AMBER }} /></div>
      ) : filtered.length === 0 ? (
        <div className="border p-10 text-center text-[10px]" style={{ ...PANEL, color: DIM }}>
          No looted items logged yet.
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((item, i) => {
            const TypeIcon = ITEM_TYPES.find((t) => t.value === item.item_type)?.icon || Box;
            const statusColor = STATUS_COLOR[item.status] || DIM;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.025 }}
                className="border"
                style={{ ...PANEL }}
              >
                <div className="grid grid-cols-[28px_1fr_auto_auto_auto] gap-2 px-2.5 py-2 items-center">
                  {/* Type icon */}
                  <TypeIcon className="w-4 h-4" style={{ color: TEAL }} />

                  {/* Name + meta */}
                  <div className="min-w-0">
                    <div className="text-[11px] truncate font-bold" style={{ color: '#D8CFC0' }}>
                      {item.item_name}
                      {item.quantity > 1 && <span className="ml-1.5 text-[9px]" style={{ color: AMBER }}>×{item.quantity}</span>}
                    </div>
                    <div className="text-[9px] flex flex-wrap gap-x-2" style={{ color: DIM }}>
                      {item.manufacturer && <span>{item.manufacturer}</span>}
                      {item.size_class && item.size_class !== 'N/A' && <span style={{ color: TEAL }}>{item.size_class}</span>}
                      {item.source_op && <span>from {item.source_op}</span>}
                      {item.crew_handle && <span style={{ color: '#B0793A' }}>@{item.crew_handle}</span>}
                    </div>
                  </div>

                  {/* Condition */}
                  <GradePip pct={item.condition_pct || 0} />

                  {/* Status cycle */}
                  <button
                    onClick={() => cycleStatus(item)}
                    title="Click to advance status"
                    className="flex items-center gap-1 px-2 py-0.5 text-[8px] tracking-[0.14em] font-bold"
                    style={{ color: statusColor, border: `1px solid ${statusColor}55`, background: `${statusColor}14`, clipPath: 'polygon(4px 0,100% 0,calc(100%-4px) 100%,0 100%)' }}
                  >
                    {(item.status || 'raw').toUpperCase()} <ArrowRight className="w-2 h-2" />
                  </button>

                  {/* Delete */}
                  <button onClick={() => deleteMutation.mutate(item.id)} className="opacity-30 hover:opacity-80 transition-opacity" style={{ color: '#FF6B6B' }}>
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}