import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Square, ChevronDown, MapPin, ArrowRight, Trash2, Loader2, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

const AMBER  = '#E0A22E';
const TEAL   = '#6FA08F';
const DIM    = '#7A6E60';
const DIMMER = '#3A3028';
const PANEL  = { background: '#111009', borderColor: '#2A2118' };

const STATUS_OPTS = ['collected', 'processed', 'sold'];
const STATUS_COLOR = { collected: '#6FA08F', processed: '#E0A22E', sold: '#8FBFAE' };

const DESTINATIONS = [
  'TDD Orison', 'TDD New Babbage', 'TDD Lorville', 'TDD Area18',
  'GrimHex', 'Port Tressler', 'Everus Harbor', 'Seraphim Station',
  'Custom…',
];

function StatusBadge({ status }) {
  const color = STATUS_COLOR[status] || DIM;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-[8px] tracking-[0.16em] font-bold font-mono"
      style={{
        color,
        border: `1px solid ${color}55`,
        background: `${color}14`,
        clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)',
      }}
    >
      {status.toUpperCase()}
    </span>
  );
}

export default function CargoLotTracker() {
  const queryClient = useQueryClient();
  const [selected, setSelected]       = useState(new Set());
  const [bulkStatus, setBulkStatus]   = useState('');
  const [bulkDest, setBulkDest]       = useState('');
  const [customDest, setCustomDest]   = useState('');
  const [destOpen, setDestOpen]       = useState(false);
  const [applying, setApplying]       = useState(false);
  const [addOpen, setAddOpen]         = useState(false);
  const [newLot, setNewLot]           = useState({ lot_name: '', commodity_code: '', quantity_scu: '', origin: '', destination: '', status: 'collected' });

  const { data: lots = [], isLoading } = useQuery({
    queryKey: ['cargo_lots'],
    queryFn: () => base44.entities.cargo_lot.list('-created_date', 200),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['cargo_lots'] });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.cargo_lot.create(data),
    onSuccess: () => { invalidate(); setAddOpen(false); setNewLot({ lot_name: '', commodity_code: '', quantity_scu: '', origin: '', destination: '', status: 'collected' }); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.cargo_lot.update(id, data),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.cargo_lot.delete(id),
    onSuccess: () => { invalidate(); setSelected((s) => { const n = new Set(s); return n; }); },
  });

  const toggleAll = useCallback(() => {
    if (selected.size === lots.length && lots.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(lots.map((l) => l.id)));
    }
  }, [lots, selected.size]);

  const toggleOne = useCallback((id) => {
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }, []);

  const applyBulk = async () => {
    if (selected.size === 0) return;
    const patch = {};
    if (bulkStatus) patch.status = bulkStatus;
    const dest = bulkDest === 'Custom…' ? customDest : bulkDest;
    if (dest) patch.destination = dest;
    if (!Object.keys(patch).length) return;

    setApplying(true);
    await Promise.all([...selected].map((id) => updateMutation.mutateAsync({ id, data: patch })));
    setSelected(new Set());
    setBulkStatus('');
    setBulkDest('');
    setCustomDest('');
    setApplying(false);
  };

  const allSelected = lots.length > 0 && selected.size === lots.length;
  const someSelected = selected.size > 0 && selected.size < lots.length;

  return (
    <div className="space-y-3 font-mono">

      {/* ── Header row ───────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div className="text-[9px] tracking-[0.2em]" style={{ color: DIM }}>
          {lots.length} LOT{lots.length !== 1 ? 'S' : ''} TRACKED
          {selected.size > 0 && (
            <span style={{ color: AMBER }}> · {selected.size} SELECTED</span>
          )}
        </div>
        <button
          onClick={() => setAddOpen((v) => !v)}
          className="flex items-center gap-1 px-2.5 py-1 text-[9px] tracking-[0.12em] font-bold"
          style={{
            background: addOpen ? '#2A1E0C' : '#111009',
            border: `1px solid ${addOpen ? '#B0793A' : '#2A2118'}`,
            color: addOpen ? AMBER : DIM,
            clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)',
          }}
        >
          <Plus className="w-2.5 h-2.5" /> ADD LOT
        </button>
      </div>

      {/* ── Add lot form ─────────────────────────────────────── */}
      <AnimatePresence>
        {addOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="border p-3 space-y-2" style={{ ...PANEL, borderColor: '#5C4424' }}>
              <p className="text-[9px] tracking-[0.2em]" style={{ color: '#B0793A' }}>NEW CARGO LOT</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <Input placeholder="Lot name *" value={newLot.lot_name} onChange={(e) => setNewLot({ ...newLot, lot_name: e.target.value })}
                  className="h-8 text-xs font-mono bg-transparent" style={{ borderColor: '#2A2118' }} />
                <Input placeholder="Commodity code" value={newLot.commodity_code} onChange={(e) => setNewLot({ ...newLot, commodity_code: e.target.value.toUpperCase() })}
                  className="h-8 text-xs font-mono bg-transparent" style={{ borderColor: '#2A2118' }} />
                <Input type="number" placeholder="SCU" value={newLot.quantity_scu} onChange={(e) => setNewLot({ ...newLot, quantity_scu: e.target.value })}
                  className="h-8 text-xs font-mono bg-transparent" style={{ borderColor: '#2A2118' }} />
                <Input placeholder="Origin" value={newLot.origin} onChange={(e) => setNewLot({ ...newLot, origin: e.target.value })}
                  className="h-8 text-xs font-mono bg-transparent" style={{ borderColor: '#2A2118' }} />
                <Input placeholder="Destination" value={newLot.destination} onChange={(e) => setNewLot({ ...newLot, destination: e.target.value })}
                  className="h-8 text-xs font-mono bg-transparent" style={{ borderColor: '#2A2118' }} />
                <Select value={newLot.status} onValueChange={(v) => setNewLot({ ...newLot, status: v })}>
                  <SelectTrigger className="h-8 text-xs font-mono" style={{ borderColor: '#2A2118' }}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTS.map((s) => <SelectItem key={s} value={s} className="text-xs font-mono">{s.toUpperCase()}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setAddOpen(false)} className="px-3 py-1 text-[10px]" style={{ color: DIM }}>CANCEL</button>
                <button
                  disabled={!newLot.lot_name || createMutation.isPending}
                  onClick={() => createMutation.mutate({ ...newLot, quantity_scu: parseFloat(newLot.quantity_scu) || 0 })}
                  className="flex items-center gap-1 px-3 py-1 text-[10px] font-bold disabled:opacity-40"
                  style={{ background: '#3A2810', border: '1px solid #B0793A', color: AMBER }}
                >
                  {createMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                  CREATE
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bulk action bar — only when something is selected ─── */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            className="border p-2.5 flex flex-wrap items-center gap-3"
            style={{ background: '#1A130A', borderColor: '#8A6430' }}
          >
            <span className="text-[9px] tracking-[0.15em] font-bold shrink-0" style={{ color: AMBER }}>
              BULK: {selected.size} LOT{selected.size !== 1 ? 'S' : ''}
            </span>

            {/* Status picker */}
            <Select value={bulkStatus} onValueChange={setBulkStatus}>
              <SelectTrigger className="h-7 w-36 text-[10px] font-mono shrink-0" style={{ borderColor: '#3A2A18', background: '#0C0A07' }}>
                <SelectValue placeholder="Set status…" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTS.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs font-mono">{s.toUpperCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Destination picker */}
            <div className="relative shrink-0">
              <Select value={bulkDest} onValueChange={(v) => { setBulkDest(v); if (v !== 'Custom…') setCustomDest(''); }}>
                <SelectTrigger className="h-7 w-40 text-[10px] font-mono" style={{ borderColor: '#3A2A18', background: '#0C0A07' }}>
                  <SelectValue placeholder="Set destination…" />
                </SelectTrigger>
                <SelectContent>
                  {DESTINATIONS.map((d) => (
                    <SelectItem key={d} value={d} className="text-xs font-mono">{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Custom dest input */}
            {bulkDest === 'Custom…' && (
              <Input
                placeholder="Enter destination…"
                value={customDest}
                onChange={(e) => setCustomDest(e.target.value)}
                className="h-7 w-40 text-[10px] font-mono bg-transparent shrink-0"
                style={{ borderColor: '#3A2A18' }}
              />
            )}

            {/* Apply */}
            <button
              onClick={applyBulk}
              disabled={applying || (!bulkStatus && !bulkDest && !customDest)}
              className="flex items-center gap-1 px-3 py-1 text-[10px] font-bold tracking-[0.12em] shrink-0 disabled:opacity-40"
              style={{ background: '#3A2810', border: '1px solid #C8893B', color: AMBER }}
            >
              {applying ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
              APPLY
            </button>

            <button onClick={() => setSelected(new Set())} className="ml-auto text-[9px] shrink-0" style={{ color: DIM }}>
              CLEAR
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Lot table ────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: AMBER }} />
        </div>
      ) : lots.length === 0 ? (
        <div className="border p-8 text-center text-[10px]" style={{ ...PANEL, color: DIM }}>
          No cargo lots logged. Add one above.
        </div>
      ) : (
        <div className="space-y-1">
          {/* Column headers + select-all */}
          <div className="grid grid-cols-[24px_1fr_60px_70px_120px_90px_28px] gap-2 px-2 items-center text-[8px] tracking-[0.16em]" style={{ color: DIMMER }}>
            <button onClick={toggleAll} className="flex items-center justify-center" title="Select all">
              {allSelected
                ? <CheckSquare className="w-3.5 h-3.5" style={{ color: AMBER }} />
                : someSelected
                  ? <CheckSquare className="w-3.5 h-3.5 opacity-50" style={{ color: AMBER }} />
                  : <Square className="w-3.5 h-3.5" style={{ color: DIMMER }} />}
            </button>
            <span>LOT</span>
            <span className="text-right">SCU</span>
            <span>CODE</span>
            <span>DESTINATION</span>
            <span>STATUS</span>
            <span />
          </div>

          {lots.map((lot, i) => {
            const isSel = selected.has(lot.id);
            return (
              <motion.div
                key={lot.id}
                initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.025 }}
                className="border"
                style={{
                  ...PANEL,
                  borderColor: isSel ? '#8A6430' : '#2A2118',
                  background: isSel ? '#1A130A' : '#111009',
                  boxShadow: isSel ? '0 0 0 1px rgba(212,146,11,0.12) inset' : 'none',
                }}
              >
                <div className="grid grid-cols-[24px_1fr_60px_70px_120px_90px_28px] gap-2 px-2 py-2 items-center">
                  {/* Checkbox */}
                  <button onClick={() => toggleOne(lot.id)} className="flex items-center justify-center">
                    {isSel
                      ? <CheckSquare className="w-3.5 h-3.5" style={{ color: AMBER }} />
                      : <Square className="w-3.5 h-3.5" style={{ color: DIMMER }} />}
                  </button>

                  {/* Name */}
                  <div className="min-w-0">
                    <div className="text-[11px] truncate" style={{ color: '#D8CFC0' }}>{lot.lot_name}</div>
                    {lot.origin && (
                      <div className="text-[8px] truncate" style={{ color: DIM }}>from {lot.origin}</div>
                    )}
                  </div>

                  {/* SCU */}
                  <div className="text-right text-[12px] font-bold" style={{ color: AMBER }}>
                    {(lot.quantity_scu || 0).toLocaleString()}
                  </div>

                  {/* Code */}
                  <div className="text-[9px] font-bold" style={{ color: TEAL }}>
                    {lot.commodity_code || '—'}
                  </div>

                  {/* Destination inline edit */}
                  <div className="flex items-center gap-1 min-w-0">
                    <MapPin className="w-2.5 h-2.5 shrink-0" style={{ color: DIMMER }} />
                    <input
                      value={lot.destination || ''}
                      onChange={(e) => updateMutation.mutate({ id: lot.id, data: { destination: e.target.value } })}
                      placeholder="—"
                      className="w-full bg-transparent text-[10px] outline-none border-b border-transparent focus:border-current transition-colors truncate"
                      style={{ color: lot.destination ? '#D8CFC0' : DIMMER }}
                    />
                  </div>

                  {/* Status inline cycle */}
                  <button
                    onClick={() => {
                      const idx = STATUS_OPTS.indexOf(lot.status);
                      const next = STATUS_OPTS[(idx + 1) % STATUS_OPTS.length];
                      updateMutation.mutate({ id: lot.id, data: { status: next } });
                    }}
                    title="Click to cycle status"
                  >
                    <StatusBadge status={lot.status || 'collected'} />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => deleteMutation.mutate(lot.id)}
                    className="flex items-center justify-center opacity-30 hover:opacity-80 transition-opacity"
                    style={{ color: '#FF6B6B' }}
                  >
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