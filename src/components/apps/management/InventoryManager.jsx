import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Loader2, Check, PackageSearch, CheckCircle, Wrench, Skull, Layers, ChevronDown, ClipboardCheck } from 'lucide-react';
import ProductReservePanel from '@/components/apps/management/ProductReservePanel';
import InventoryAuditMode from '@/components/apps/management/InventoryAuditMode';
import InventorySheetSync from '@/components/apps/management/InventorySheetSync';

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
  const [expanded, setExpanded] = useState(false);
  const [value, setValue] = useState(String(product.stock ?? 0));

  const update = useMutation({
    mutationFn: (stock) => base44.entities.product.update(product.id, { stock }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inv_products'] });
      // Restocks trigger automatic reserve allocation — refresh after it runs
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ['product_reserves', product.id] }), 2500);
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
      <div className="flex items-center gap-3 mb-2 cursor-pointer" onClick={() => setExpanded((v) => !v)} title="Click to view reserve requests">
        <ChevronDown className="w-3 h-3 shrink-0 transition-transform" style={{ color: '#6A5A40', transform: expanded ? 'rotate(180deg)' : 'none' }} />
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
        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
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

      {expanded && <ProductReservePanel product={product} />}
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
  const [filter, setFilter]     = useState('salvage_commodity');
  const [diagFilter, setDiag]   = useState('all');
  const [search, setSearch]     = useState('');
  const [auditMode, setAuditMode] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['inv_products'],
    queryFn: () => base44.entities.product.list('sort_order'),
  });

  const activeDiag = DIAG_FILTERS.find((f) => f.id === diagFilter) || DIAG_FILTERS[0];

  const visible = products.filter((p) => {
    const matchCat    = filter === 'all' || p.category === filter;
    const matchSearch = !search || p.product_name?.toLowerCase().includes(search.toLowerCase()) || p.code?.toLowerCase().includes(search.toLowerCase());
    const matchDiag   = activeDiag.match(p);
    return matchCat && matchSearch && matchDiag;
  });

  // Summary stats
  const total   = products.length;
  const empty   = products.filter((p) => !p.stock || p.stock === 0).length;
  const low     = products.filter((p) => p.stock > 0 && p.stock < THRESHOLDS.low).length;
  const healthy = products.filter((p) => (p.stock ?? 0) >= THRESHOLDS.healthy).length;

  return (
    <div className="flex gap-4 font-mono h-full">

      {/* ── Diagnostic sidebar ── */}
      <div className="shrink-0 w-48 space-y-1">
        <div className="text-[8px] tracking-[0.25em] mb-3 flex items-center gap-1.5" style={{ color: '#6A5A40' }}>
          <span style={{ color: AMBER }}>◈</span> DIAGNOSTIC FILTER
        </div>
        {DIAG_FILTERS.map((f) => {
          const Icon    = f.icon;
          const active  = diagFilter === f.id;
          const count   = f.id === 'all' ? products.length : products.filter(f.match).length;
          return (
            <motion.button
              key={f.id}
              onClick={() => setDiag(f.id)}
              whileHover={{ x: 2 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="w-full text-left p-2.5 rounded border transition-colors"
              style={{
                background:   active ? `${f.color}12` : 'hsl(30,10%,7%)',
                borderColor:  active ? `${f.color}50` : 'hsl(33,18%,14%)',
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-3 h-3 shrink-0" style={{ color: active ? f.color : '#5A4A34' }} />
                <span className="text-[8px] tracking-[0.15em] font-bold leading-tight"
                  style={{ color: active ? f.color : '#8A7A60' }}>
                  {f.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[7px]" style={{ color: '#4A3A28' }}>{f.desc}</span>
                <span className="text-[9px] font-bold ml-1 shrink-0" style={{ color: active ? f.color : '#5A4A34' }}>
                  {count}
                </span>
              </div>
              {active && (
                <motion.div
                  layoutId="diag-indicator"
                  className="mt-1.5 h-px w-full"
                  style={{ background: `linear-gradient(90deg, ${f.color}80, transparent)` }}
                />
              )}
            </motion.button>
          );
        })}

        {/* Divider */}
        <div className="pt-3 border-t" style={{ borderColor: 'hsl(33,18%,14%)' }}>
          <div className="text-[8px] tracking-[0.2em] mb-2" style={{ color: '#4A3A28' }}>STOCK STATUS</div>
          {[
            { label: 'EMPTY',   value: empty,   color: RED },
            { label: 'LOW',     value: low,     color: YELLOW },
            { label: 'HEALTHY', value: healthy, color: GREEN },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex justify-between items-center py-1">
              <span className="text-[8px]" style={{ color: '#5A4A34' }}>{label}</span>
              <span className="text-[9px] font-bold font-mono" style={{ color }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main panel ── */}
      <div className="flex-1 min-w-0 space-y-3">
        {/* Category filter rail */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setAuditMode((v) => !v)}
            className="shrink-0 px-3 py-1 rounded-sm text-[9px] font-bold tracking-[0.15em] transition-colors flex items-center gap-1.5"
            style={{ background: auditMode ? '#4EBF7A18' : 'transparent', color: auditMode ? GREEN : '#6A5A40', border: `1px solid ${auditMode ? GREEN + '60' : '#2A2018'}` }}
            title="Count physical stock and sync storefront records"
          >
            <ClipboardCheck className="w-3 h-3" /> {auditMode ? 'EXIT AUDIT' : 'AUDIT MODE'}
          </button>
          <InventorySheetSync />
          <button
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

        {/* Active filter label */}
        {diagFilter !== 'all' && (
          <div className="flex items-center gap-2 text-[9px]" style={{ color: activeDiag.color }}>
            <span>▸</span>
            <span className="tracking-[0.15em]">SHOWING: {activeDiag.label}</span>
            <span style={{ color: '#4A3A28' }}>· {visible.length} item{visible.length !== 1 ? 's' : ''}</span>
            <button
              onClick={() => setDiag('all')}
              className="ml-auto text-[8px] tracking-[0.12em] transition-colors"
              style={{ color: '#5A4A34' }}
            >
              CLEAR ×
            </button>
          </div>
        )}

        {/* Stock rows / audit count sheet */}
        {auditMode && !isLoading ? (
          <InventoryAuditMode products={visible} />
        ) : isLoading ? (
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
          Click a row to view its reserve requests · Click any stock number to edit in-line · Bars reference 500 SCU max
        </p>
      </div>
    </div>
  );
}