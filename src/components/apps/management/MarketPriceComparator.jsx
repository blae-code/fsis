import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2, TrendingUp, TrendingDown, Minus, Star } from 'lucide-react';

const AMBER  = '#E0A22E';
const TEAL   = '#5F9A8C';
const GREEN  = '#4EBF7A';
const RED    = '#C05050';
const DIM    = '#7A6E60';
const DIMMER = '#3A3028';
const PANEL  = { background: '#0E0C09', borderColor: '#2A2118' };

const SALVAGE_CODES = ['RMC', 'CMR', 'CMS'];

const STAR_SYSTEMS = ['All Systems', 'Stanton', 'Pyro', 'Nyx'];

function fmt(n) {
  if (!n) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

function DeltaBadge({ myPrice, marketPrice }) {
  if (!myPrice || !marketPrice) return <span style={{ color: DIMMER }}>—</span>;
  const delta = ((myPrice - marketPrice) / marketPrice) * 100;
  const color  = delta > 5 ? GREEN : delta < -5 ? RED : AMBER;
  const Icon   = delta > 5 ? TrendingUp : delta < -5 ? TrendingDown : Minus;
  return (
    <span className="flex items-center gap-0.5 text-[10px] font-bold" style={{ color }}>
      <Icon className="w-3 h-3" />
      {delta > 0 ? '+' : ''}{delta.toFixed(1)}%
    </span>
  );
}

export default function MarketPriceComparator() {
  const [system, setSystem] = useState('Stanton');
  const [selectedCode, setSelectedCode] = useState('RMC');

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['mpc_products'],
    queryFn: () => base44.entities.product.filter({ category: 'salvage_commodity' }),
  });

  const { data: prices = [], isLoading: loadingPrices } = useQuery({
    queryKey: ['mpc_commodity_prices', selectedCode, system],
    queryFn: () => base44.entities.commodity_price.filter({ commodity_code: selectedCode }),
  });

  const isLoading = loadingProducts || loadingPrices;

  // My listed price for the selected commodity
  const myProduct = useMemo(() =>
    products.find(p => p.code?.toUpperCase() === selectedCode),
    [products, selectedCode]
  );
  const myPrice = myProduct?.price_auec ?? null;

  // Filter terminals by star system
  const terminalRows = useMemo(() => {
    const filtered = system === 'All Systems' ? prices : prices.filter(p => p.star_system === system);
    return [...filtered].sort((a, b) => (b.price_sell || 0) - (a.price_sell || 0));
  }, [prices, system]);

  const bestTerminal = terminalRows[0];
  const avgSell = terminalRows.length
    ? terminalRows.reduce((s, t) => s + (t.price_sell || 0), 0) / terminalRows.length
    : null;

  return (
    <div className="space-y-4 font-mono">

      {/* Header */}
      <div className="flex items-center gap-2 pb-1 border-b" style={{ borderColor: '#2A2118' }}>
        <span style={{ color: AMBER }}>◈</span>
        <span className="text-[9px] tracking-[0.25em]" style={{ color: DIM }}>MARKET PRICE COMPARATOR</span>
      </div>

      {/* Controls row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Commodity selector */}
        <div className="flex items-center gap-1">
          {SALVAGE_CODES.map(code => (
            <button
              key={code}
              onClick={() => setSelectedCode(code)}
              className="px-3 py-1 text-[9px] tracking-[0.14em] font-bold transition-colors"
              style={{
                background: selectedCode === code ? '#2A1E0A' : 'transparent',
                border: `1px solid ${selectedCode === code ? AMBER + '60' : '#2A2118'}`,
                color: selectedCode === code ? AMBER : DIM,
              }}
            >
              {code}
            </button>
          ))}
        </div>

        {/* Star system filter */}
        <div className="flex items-center gap-1 ml-auto">
          {STAR_SYSTEMS.map(s => (
            <button
              key={s}
              onClick={() => setSystem(s)}
              className="px-2.5 py-1 text-[9px] tracking-[0.1em] transition-colors"
              style={{
                background: system === s ? '#1A1A2A' : 'transparent',
                border: `1px solid ${system === s ? TEAL + '60' : '#2A2118'}`,
                color: system === s ? TEAL : DIM,
              }}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-4 h-4 animate-spin" style={{ color: AMBER }} />
        </div>
      ) : (
        <>
          {/* My price vs market summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="border p-3" style={PANEL}>
              <div className="text-[8px] tracking-[0.18em] mb-1" style={{ color: DIMMER }}>MY LISTED PRICE</div>
              <div className="text-xl font-bold" style={{ color: myPrice ? AMBER : DIMMER }}>
                {myPrice ? `${fmt(myPrice)} ¤` : 'Not Listed'}
              </div>
              {myProduct?.unit && <div className="text-[8px] mt-0.5" style={{ color: DIM }}>per {myProduct.unit}</div>}
            </div>
            <div className="border p-3" style={PANEL}>
              <div className="text-[8px] tracking-[0.18em] mb-1" style={{ color: DIMMER }}>AVG MARKET SELL</div>
              <div className="text-xl font-bold" style={{ color: TEAL }}>
                {avgSell ? `${fmt(avgSell)} ¤` : '—'}
              </div>
              <div className="text-[8px] mt-0.5" style={{ color: DIM }}>{terminalRows.length} terminal{terminalRows.length !== 1 ? 's' : ''}</div>
            </div>
            <div className="border p-3" style={PANEL}>
              <div className="text-[8px] tracking-[0.18em] mb-1" style={{ color: DIMMER }}>VS AVG MARKET</div>
              <div className="text-xl font-bold">
                <DeltaBadge myPrice={myPrice} marketPrice={avgSell} />
              </div>
              <div className="text-[8px] mt-0.5" style={{ color: DIM }}>your margin vs avg</div>
            </div>
          </div>

          {/* Best terminal callout */}
          {bestTerminal && (
            <motion.div
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="border p-3 flex items-center gap-3"
              style={{ background: '#0A1209', borderColor: GREEN + '40' }}
            >
              <Star className="w-4 h-4 shrink-0" style={{ color: GREEN }} />
              <div className="flex-1 min-w-0">
                <div className="text-[8px] tracking-[0.18em]" style={{ color: GREEN }}>BEST TERMINAL — {system === 'All Systems' ? bestTerminal.star_system?.toUpperCase() : system.toUpperCase()}</div>
                <div className="text-[13px] font-bold mt-0.5" style={{ color: '#D8CFC0' }}>
                  {bestTerminal.terminal_name}
                  {bestTerminal.terminal_code && <span className="text-[9px] ml-2" style={{ color: DIM }}>{bestTerminal.terminal_code}</span>}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xl font-bold" style={{ color: GREEN }}>{fmt(bestTerminal.price_sell)} ¤</div>
                <div className="text-[8px]" style={{ color: DIM }}>sell price / unit</div>
              </div>
            </motion.div>
          )}

          {/* Terminal table */}
          {terminalRows.length > 0 ? (
            <div className="border" style={PANEL}>
              <div className="px-3 py-2 border-b text-[8px] tracking-[0.18em]" style={{ borderColor: '#2A2118', color: DIM }}>
                ALL TERMINALS — {selectedCode}
              </div>
              {/* Column headers */}
              <div className="grid grid-cols-[1fr_80px_80px_80px_80px] gap-2 px-3 py-1.5 text-[8px] tracking-[0.14em]" style={{ color: DIMMER, borderBottom: '1px solid #1A1208' }}>
                <span>TERMINAL</span>
                <span className="text-right">SELL</span>
                <span className="text-right">BUY</span>
                <span className="text-right">VS MINE</span>
                <span className="text-right">PATCH</span>
              </div>
              {terminalRows.map((t, i) => {
                const isBest = t.id === bestTerminal?.id;
                return (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="grid grid-cols-[1fr_80px_80px_80px_80px] gap-2 px-3 py-2 border-b last:border-b-0 items-center"
                    style={{
                      borderColor: '#1A1208',
                      background: isBest ? '#0A1209' : 'transparent',
                    }}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        {isBest && <Star className="w-2.5 h-2.5 shrink-0" style={{ color: GREEN }} />}
                        <span className="text-[10px] truncate" style={{ color: isBest ? '#D8CFC0' : '#A09080' }}>
                          {t.terminal_name}
                        </span>
                      </div>
                      {t.star_system && (
                        <span className="text-[8px]" style={{ color: DIMMER }}>{t.star_system}</span>
                      )}
                    </div>
                    <div className="text-right text-[11px] font-bold" style={{ color: isBest ? GREEN : AMBER }}>
                      {fmt(t.price_sell)}
                    </div>
                    <div className="text-right text-[10px]" style={{ color: DIM }}>
                      {t.price_buy ? fmt(t.price_buy) : '—'}
                    </div>
                    <div className="text-right">
                      <DeltaBadge myPrice={myPrice} marketPrice={t.price_sell} />
                    </div>
                    <div className="text-right text-[8px]" style={{ color: DIMMER }}>
                      {t.patch_version || '—'}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="border p-8 text-center text-[10px]" style={{ ...PANEL, color: DIM }}>
              No market data for {selectedCode} in {system}. Run a UEX sync to populate prices.
            </div>
          )}
        </>
      )}
    </div>
  );
}