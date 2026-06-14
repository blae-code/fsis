import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Loader2, Check, PackageSearch, CheckCircle, Wrench, Skull, Layers } from 'lucide-react';

const AMBER  = '#E0A22E';
const GREEN  = '#4EBF7A';
const YELLOW = '#D4A830';
const RED    = '#C05050';
const TEAL   = '#5F9A8C';
const DIM    = '#3A2A14';

const panel  = { background: 'hsl(30, 10%, 8%)',  borderColor: 'hsl(33, 18%, 18%)' };
const border = { borderColor: 'hsl(33, 18%, 18%)' };

// Thresholds (SCU) for stock status
const THRESHOLDS = { critical: 10, low: 50, healthy: 200 };

function stockColor(stock) {
  if (stock === 0)                       return RED;
  if (stock < THRESHOLDS.critical)       return RED;
  if (stock < THRESHOLDS.low)            return YELLOW;
  if (stock < THRESHOLDS.healthy)        return AMBER;
  return GREEN;
}

function stockLabel(stock) {
  if (stock === 0)                       return 'EMPTY';
  if (stock < THRESHOLDS.critical)       return 'CRITICAL';
  if (stock < THRESHOLDS.low)            return 'LOW';
  if (stock < THRESHOLDS.healthy)        return 'NOMINAL';
  return 'STOCKED';
}

// Bar fill % — capped at 100, log-scaled so small changes near zero are visible
function stockFill(stock) {
  if (stock <= 0) return 0;
  const max = 500; // "full tank" reference
  return Math.min(100, (stock / max) * 100);
}

function StockBar({ stock, color }) {
  const fill = stockFill(stock);
  return (
    <div className="relative h-2 rounded-sm overflow-hidden" style={{ background: '#1A1208', width: '100%' }}>
      <motion.div
        className="h-full rounded-sm"
        style={{ background: color, boxShadow: `0 0 6px ${color}60` }}
        initial={{ width: 0 }}
        animate={{ width: `${fill}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
      {/* Tick marks */}
      {[25, 50, 75].map((pct) => (
        <div
          key={pct}
          className="absolute top-0 bottom-0 w-px opacity-20"
          style={{ left: `${pct}%`, background: '#E0A22E' }}
        />
      ))}
    </div>
  );
}

function StockRow({ product }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(product.stock ?? 0));

  const update = useMutation({
    mutationFn: (stock) => base44.entities.product.update(product.id, { stock }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inv_products'] });
      setEditing(false);
    },
  });

  const color = stockColor(product.stock ?? 0);
  const label = stockLabel(product.stock ?? 0);

  return (
    <motion.div
      className="p-3 rounded border"
      style={panel}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="flex items-center gap-3 mb-2">
        {/* Commodity identity */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-foreground truncate">{product.product_name}</span>
            {product.code && (
              <span className="font-mono text-[9px] px-1 rounded" style={{ background: DIM, color: AMBER }}>
                {product.code}
              </span>
            )}
          </div>
          <div className="text-[9px] mt-0.5" style={{ color: '#6A5A40' }}>
            {product.unit || 'SCU'} · {product.category?.replace(/_/g, ' ').toUpperCase()}
          </div>
        </div>

        {/* Status badge */}
        <div className="font-mono text-[8px] tracking-[0.2em] px-2 py-0.5 rounded-sm shrink-0"
          style={{ background: `${color}18`, color, border: `1px solid ${color}40` }}>
          {label}
        </div>

        {/* Stock number / edit */}
        <div className="flex items-center gap-1.5 shrink-0">
          {editing ? (
            <>
              <Input
                type="number" min="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="h-6 w-16 text-[10px] font-mono px-1.5"
                style={border}
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') update.mutate(parseFloat(value) || 0); if (e.key === 'Escape') setEditing(false); }}
              />
              <button onClick={() => update.mutate(parseFloat(value) || 0)} disabled={update.isPending}>
                {update.isPending ? <Loader2 className="w-3 h-3 animate-spin" style={{ color: AMBER }} /> : <Check className="w-3 h-3" style={{ color: GREEN }} />}
              </button>
            </>
          ) : (
            <button
              className="font-mono text-sm font-bold transition-colors"
              style={{ color: AMBER }}
              onClick={() => { setValue(String(product.stock ?? 0)); setEditing(true); }}
              title="Click to edit stock"
            >
              {(product.stock ?? 0).toLocaleString()}
            </button>
          )}
          <span className="font-mono text-[9px]" style={{ color: '#6A5A40' }}>{product.unit || 'SCU'}</span>
        </div>
      </div>

      {/* Stock bar */}
      <StockBar stock={product.stock ?? 0} color={color} />

      {/* Sub-row: price + market ref */}
      <div className="flex items-center gap-4 mt-1.5">
        <span className="font-mono text-[9px]" style={{ color: '#6A5A40' }}>
          PRICE <span style={{ color: AMBER }}>{(product.price_auec ?? 0).toLocaleString()} aUEC</span>
        </span>
        {product.market_ref_auec > 0 && (
          <span className="font-mono text-[9px]" style={{ color: '#6A5A40' }}>
            MKT REF <span style={{ color: TEAL }}>{(product.market_ref_auec ?? 0).toLocaleString()}</span>
          </span>
        )}
        <span className="font-mono text-[8px] ml-auto" style={{ color: product.available ? '#4EBF7A40' : '#6A5A4080' }}>
          {product.available ? '● LISTED' : '○ HIDDEN'}
        </span>
      </div>
    </motion.div>
  );
}

const DIAG_FILTERS = [
  {
    id: 'all',
    label: 'ALL ITEMS',
    icon: Layers,
    color: '#E0A22E',
    desc: 'Full inventory',
    match: () => true,
  },
  {
    id: 'resale',
    label: 'READY FOR RESALE',
    icon: CheckCircle,
    color: '#4EBF7A',
    desc: 'New or refurb · listed or repaired',
    match: (p) => p.condition_grade === 'new' || p.condition_grade === 'refurb',
  },
  {
    id: 'repair',
    label: 'NEEDS REPAIR',
    icon: Wrench,
    color: '#D4A830',
    desc: 'Used condition · repair recommended',
    match: (p) => p.condition_grade === 'used',
  },
  {
    id: 'scrap',
    label: 'SCRAP ONLY',
    icon: Skull,
    color: '#C05050',
    desc: 'Worn · salvage or scrap value only',
    match: (p) => p.condition_grade === 'worn',
  },
];

const CATEGORY_GROUPS = [
  { key: 'salvage_commodity', label: 'SALVAGE COMMODITIES' },
  { key: 'fabricated',        label: 'FABRICATED' },
  { key: 'ship_component',    label: 'SHIP COMPONENTS' },
  { key: 'vehicle_component', label: 'VEHICLE COMPONENTS' },
  { key: 'fps_gear',          label: 'FPS GEAR' },
  { key: 'weapon',            label: 'WEAPONS' },
  { key: 'service',           label: 'SERVICES' },
];

export default function InventoryManager() {
  const [filter, setFilter] = useState('salvage_commodity');
  const [search, setSearch] = useState('');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['inv_products'],
    queryFn: () => base44.entities.product.list('sort_order'),
  });

  const visible = products.filter((p) => {
    const matchCat = filter === 'all' || p.category === filter;
    const matchSearch = !search || p.product_name?.toLowerCase().includes(search.toLowerCase()) || p.code?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // Summary stats
  const total   = products.length;
  const empty   = products.filter((p) => !p.stock || p.stock === 0).length;
  const low     = products.filter((p) => p.stock > 0 && p.stock < THRESHOLDS.low).length;
  const healthy = products.filter((p) => (p.stock ?? 0) >= THRESHOLDS.healthy).length;

  return (
    <div className="space-y-4 font-mono">
      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'TOTAL WARES',  value: total,   color: AMBER },
          { label: 'EMPTY',        value: empty,   color: RED },
          { label: 'LOW STOCK',    value: low,     color: YELLOW },
          { label: 'WELL STOCKED', value: healthy, color: GREEN },
        ].map(({ label, value, color }) => (
          <div key={label} className="p-2.5 rounded border text-center" style={panel}>
            <div className="text-lg font-bold" style={{ color }}>{value}</div>
            <div className="text-[8px] tracking-[0.18em] mt-0.5" style={{ color: '#6A5A40' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Category filter rail */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          key="all"
          onClick={() => setFilter('all')}
          className="shrink-0 px-3 py-1 rounded-sm text-[9px] tracking-[0.15em] transition-colors"
          style={{ background: filter === 'all' ? DIM : 'transparent', color: filter === 'all' ? AMBER : '#6A5A40', border: `1px solid ${filter === 'all' ? AMBER + '40' : '#2A2018'}` }}
        >
          ALL
        </button>
        {CATEGORY_GROUPS.map(({ key, label }) => {
          const count = products.filter((p) => p.category === key).length;
          if (count === 0) return null;
          return (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="shrink-0 px-3 py-1 rounded-sm text-[9px] tracking-[0.12em] transition-colors"
              style={{ background: filter === key ? DIM : 'transparent', color: filter === key ? AMBER : '#6A5A40', border: `1px solid ${filter === key ? AMBER + '40' : '#2A2018'}` }}
            >
              {label} <span style={{ color: filter === key ? AMBER : '#3A2A14' }}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <Input
        placeholder="Search by name or code…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="h-8 text-xs"
        style={border}
      />

      {/* Stock rows */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: AMBER }} />
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <PackageSearch className="w-8 h-8" style={{ color: '#3A2A14' }} />
          <p className="text-[10px] tracking-[0.2em]" style={{ color: '#5A4A34' }}>NO WARES MATCH FILTER</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {visible.map((p) => <StockRow key={p.id} product={p} />)}
        </div>
      )}

      <p className="text-[9px] text-center pb-2" style={{ color: '#3A2A14' }}>
        Click any stock number to edit in-line · Bars reference 500 SCU max
      </p>
    </div>
  );
}