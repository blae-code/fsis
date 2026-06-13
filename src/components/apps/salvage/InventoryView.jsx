import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Boxes, AlertCircle, RefreshCw, Search, X } from 'lucide-react';
import CommodityIcon from '@/components/brand/CommodityIcon';
import CargoLotTracker from '@/components/apps/salvage/CargoLotTracker';

const CODES  = ['RMC', 'CMR', 'CMS'];
const FIELD  = { RMC: 'rmc_scu', CMR: 'cmr_scu', CMS: 'cms_scu' };
const ACTIVE = ['planning', 'in-progress', 'hauling'];

const AMBER  = '#E0A22E';
const TEAL   = '#6FA08F';
const DIM    = '#7A6E60';
const DIMMER = '#3A3028';
const PANEL  = { background: '#111009', borderColor: '#2A2118' };
const PANEL_HI = { background: '#141108', borderColor: '#5C4424' };

function fmt(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}k`;
  return n.toLocaleString();
}

function StockGauge({ value, max }) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const color = value === 0 ? '#5A3030' : pct < 0.2 ? '#C8893B' : TEAL;
  return (
    <div className="h-1.5 w-full" style={{ background: '#1A1510', transform: 'skewX(-10deg)' }}>
      <motion.div
        className="h-full"
        style={{ background: color, transformOrigin: 'left' }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: pct }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  );
}

function SectionHead({ children }) {
  return (
    <div className="flex items-center gap-2 font-mono text-[9px] tracking-[0.28em] mb-2" style={{ color: '#B0793A' }}>
      <span className="w-2 h-px shrink-0" style={{ background: '#B0793A' }} />
      {children}
      <span className="flex-1 h-px" style={{ background: 'rgba(90,62,28,0.2)' }} />
    </div>
  );
}

export default function InventoryView({ bestPrices }) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data: sessions = [], isLoading: sessLoading } = useQuery({
    queryKey: ['salvage_sessions_inventory'],
    queryFn: () => base44.entities.salvage_session.list('-updated_date', 200),
  });

  const { data: products = [], isLoading: prodLoading } = useQuery({
    queryKey: ['products_inventory'],
    queryFn: () => base44.entities.product.filter({ available: true }, 'sort_order'),
  });

  // Real-time subscription to product stock changes
  useEffect(() => {
    const unsub = base44.entities.product.subscribe(() => {
      queryClient.invalidateQueries({ queryKey: ['products_inventory'] });
    });
    return unsub;
  }, [queryClient]);

  const isLoading = sessLoading || prodLoading;

  // ── Session-based stock (in-flight SCU) ──────────────────────────────────
  const activeSessions = sessions.filter((s) => ACTIVE.includes(s.status));
  const sessionTotals = CODES.reduce((acc, code) => {
    acc[code] = activeSessions.reduce((sum, s) => sum + (s[FIELD[code]] || 0), 0);
    return acc;
  }, {});
  // 1 SCU = 100 units for commodity pricing
  const sessionValueOf = (code, scu) => Math.round(scu * 100 * (bestPrices?.[code]?.price_sell || 0));
  const sessionTotalValue = CODES.reduce((s, code) => s + sessionValueOf(code, sessionTotals[code]), 0);

  // ── Search filtering ─────────────────────────────────────────────────────
  const q = search.trim().toLowerCase();
  const filteredProducts = useMemo(() => q
    ? products.filter((p) =>
        (p.product_name || '').toLowerCase().includes(q) ||
        (p.code || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
      )
    : products,
  [products, q]);
  const filteredSessions = useMemo(() => q
    ? activeSessions.filter((s) =>
        (s.session_name || '').toLowerCase().includes(q) ||
        (s.ship || '').toLowerCase().includes(q) ||
        (s.location || '').toLowerCase().includes(q) ||
        (s.status || '').toLowerCase().includes(q)
      )
    : activeSessions,
  [activeSessions, q]);

  // ── Product-based stock (storefront listings) ────────────────────────────
  const salvageProds  = filteredProducts.filter((p) => p.category === 'salvage_commodity');
  const otherProds    = filteredProducts.filter((p) => p.category !== 'salvage_commodity');

  const prodValueOf = (p) => (p.stock || 0) * (bestPrices?.[p.code]?.price_sell || p.price_auec || 0);
  const prodTotalValue = products.reduce((s, p) => s + prodValueOf(p), 0);
  const maxStock = Math.max(...products.map((p) => p.stock || 0), 1);

  // ── Grand total ──────────────────────────────────────────────────────────
  const grandTotal = sessionTotalValue + prodTotalValue;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 font-mono text-xs" style={{ color: DIM }}>
        <RefreshCw className="w-4 h-4 animate-spin" style={{ color: AMBER }} />
        Loading inventory…
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5 font-mono">

      {/* ── Global search bar ───────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: DIM }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products, sessions, locations…"
          className="w-full h-8 pl-8 pr-8 bg-transparent border text-[10px] font-mono outline-none"
          style={{ borderColor: '#2A2118', color: '#D8CFC0' }}
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2" style={{ color: DIM }}>
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* ── Grand total banner ──────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
        className="border p-4 flex items-center justify-between"
        style={{ ...PANEL_HI, clipPath: 'polygon(14px 0,100% 0,100% calc(100% - 14px),calc(100% - 14px) 100%,0 100%,0 14px)' }}
      >
        <div className="flex items-center gap-2 text-[10px] tracking-[0.2em]" style={{ color: TEAL }}>
          <Boxes className="w-4 h-4" />
          TOTAL ESTIMATED ASSET VALUE
        </div>
        <div>
          <span className="text-2xl font-bold" style={{ color: AMBER, textShadow: `0 0 20px ${AMBER}44` }}>
            {grandTotal > 0 ? fmt(grandTotal) : '—'}
          </span>
          {grandTotal > 0 && <span className="ml-1.5 text-[10px]" style={{ color: DIM }}>aUEC</span>}
        </div>
      </motion.div>

      {/* ── Storefront product stock ────────────────────────────── */}
      <section>
        <SectionHead>STOREFRONT STOCK — LISTED PRODUCTS</SectionHead>

        {products.length === 0 ? (
          <div className="border p-6 text-center" style={PANEL}>
            <AlertCircle className="w-5 h-5 mx-auto mb-2" style={{ color: DIM }} />
            <p className="text-[10px]" style={{ color: DIM }}>No products listed on the storefront.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {/* Header row */}
            <div className="grid grid-cols-[1fr_80px_80px_100px_80px] gap-2 px-2 text-[8px] tracking-[0.18em]" style={{ color: DIMMER }}>
              <span>PRODUCT</span>
              <span className="text-right">STOCK</span>
              <span className="text-right">UNIT</span>
              <span className="text-right">MKT PRICE</span>
              <span className="text-right">VALUE</span>
            </div>

            {[...salvageProds, ...otherProds].map((p, i) => {
              const mktPrice = bestPrices?.[p.code]?.price_sell;
              const value = prodValueOf(p);
              const isOOS = (p.stock || 0) === 0;
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border"
                  style={{ ...PANEL, borderColor: isOOS ? '#3A1A1A' : '#2A2118' }}
                >
                  <div className="grid grid-cols-[1fr_80px_80px_100px_80px] gap-2 items-center px-2.5 py-2">
                    {/* Name */}
                    <div className="flex items-center gap-2 min-w-0">
                      <CommodityIcon code={p.code} size={20} />
                      <div className="min-w-0">
                        <div className="text-[11px] truncate" style={{ color: isOOS ? DIM : '#D8CFC0' }}>
                          {p.product_name}
                        </div>
                        {p.code && (
                          <div className="text-[8px]" style={{ color: TEAL }}>[{p.code}]</div>
                        )}
                      </div>
                    </div>
                    {/* Stock qty */}
                    <div className="text-right">
                      <span className="text-[13px] font-bold" style={{ color: isOOS ? '#8A3030' : AMBER }}>
                        {(p.stock || 0).toLocaleString()}
                      </span>
                    </div>
                    {/* Unit */}
                    <div className="text-right text-[9px]" style={{ color: DIM }}>{p.unit || 'SCU'}</div>
                    {/* Market price */}
                    <div className="text-right text-[10px]" style={{ color: mktPrice ? '#D8CFC0' : DIMMER }}>
                      {mktPrice ? `${mktPrice.toLocaleString()} aUEC` : 'no data'}
                    </div>
                    {/* Value */}
                    <div className="text-right text-[11px] font-bold" style={{ color: value > 0 ? TEAL : DIMMER }}>
                      {value > 0 ? fmt(value) : '—'}
                    </div>
                  </div>
                  {/* Gauge bar */}
                  <StockGauge value={p.stock || 0} max={maxStock} />
                </motion.div>
              );
            })}

            {/* Subtotal */}
            <div className="border p-2.5 flex justify-between items-center text-[10px]" style={{ ...PANEL, borderColor: '#3A2E1E' }}>
              <span style={{ color: DIM }}>STOREFRONT SUBTOTAL</span>
              <span className="font-bold" style={{ color: TEAL }}>
                {prodTotalValue > 0 ? `${fmt(prodTotalValue)} aUEC` : bestPrices && Object.keys(bestPrices).length > 0 ? '0 aUEC' : 'sync UEX for values'}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* ── In-flight SCU (sessions) ────────────────────────────── */}
      <section>
        <SectionHead>IN-FLIGHT STOCK — ACTIVE SALVAGE SESSIONS</SectionHead>

        <div className="grid grid-cols-3 gap-3 mb-3">
          {CODES.map((code) => {
            const scu   = sessionTotals[code];
            const value = sessionValueOf(code, scu);
            return (
              <motion.div
                key={code}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="border p-3 text-center space-y-1"
                style={PANEL}
              >
                <div className="flex justify-center"><CommodityIcon code={code} size={26} /></div>
                <div className="text-[8px] tracking-[0.18em]" style={{ color: TEAL }}>{code}</div>
                <div className="text-xl font-bold" style={{ color: scu > 0 ? AMBER : DIMMER, textShadow: scu > 0 ? `0 0 12px ${AMBER}33` : 'none' }}>
                  {scu.toLocaleString()}
                </div>
                <div className="text-[8px]" style={{ color: DIM }}>SCU</div>
                <div className="text-[9px] pt-1 border-t" style={{ borderColor: '#2A2118', color: value > 0 ? '#D8CFC0' : DIMMER }}>
                  {value > 0 ? `~${fmt(value)} aUEC` : '—'}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Subtotal */}
        <div className="border p-2.5 flex justify-between items-center text-[10px] mb-3" style={{ ...PANEL, borderColor: '#3A2E1E' }}>
          <span style={{ color: DIM }}>IN-FLIGHT SUBTOTAL</span>
          <span className="font-bold" style={{ color: TEAL }}>
            {sessionTotalValue > 0 ? `${fmt(sessionTotalValue)} aUEC` : '—'}
          </span>
        </div>

        {/* Location breakdown */}
        {filteredSessions.length > 0 && (() => {
          const byLoc = filteredSessions.reduce((acc, s) => {
            const loc = s.location || 'UNASSIGNED';
            if (!acc[loc]) acc[loc] = { RMC: 0, CMR: 0, CMS: 0 };
            CODES.forEach((c) => { acc[loc][c] += s[FIELD[c]] || 0; });
            return acc;
          }, {});
          return (
            <div className="space-y-1.5">
              <div className="text-[9px] tracking-[0.2em]" style={{ color: DIMMER }}>HOLDINGS BY SESSION ({filteredSessions.length} ACTIVE)</div>
              {filteredSessions.map((s) => (
                <div key={s.id} className="border flex items-center gap-3 px-2.5 py-2" style={PANEL}>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] truncate" style={{ color: '#D8CFC0' }}>{s.session_name}</div>
                    <div className="text-[9px]" style={{ color: DIM }}>
                      {s.ship || 'Unknown ship'} · {s.status.toUpperCase()}{s.location ? ` · ${s.location}` : ''}
                    </div>
                  </div>
                  <div className="flex gap-3 shrink-0">
                    {CODES.map((code) => (
                      <div key={code} className="text-right">
                        <div className="text-[8px]" style={{ color: DIMMER }}>{code}</div>
                        <div className="text-[11px] font-bold" style={{ color: (s[FIELD[code]] || 0) > 0 ? AMBER : DIMMER }}>
                          {(s[FIELD[code]] || 0).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {filteredSessions.length === 0 && (
          <div className="border p-6 text-center" style={PANEL}>
            <AlertCircle className="w-5 h-5 mx-auto mb-2" style={{ color: DIM }} />
            <p className="text-[10px]" style={{ color: DIM }}>No active salvage sessions holding stock.</p>
          </div>
        )}
      </section>

      {/* ── Cargo lot tracker ───────────────────────────────── */}
      <section>
        <SectionHead>CARGO LOTS — BULK TRACKER</SectionHead>
        <CargoLotTracker />
      </section>

      <p className="text-[9px]" style={{ color: '#3A3028' }}>
        Storefront stock updates in real-time via WebSocket. Session stock aggregates active (planning / in-progress / hauling) sessions.
        Values use UEX best-sell prices where available, falling back to listed store price. 1 SCU = 100 commodity units.
      </p>
    </div>
  );
}