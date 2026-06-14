import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const AMBER = '#E0A22E';
const TEAL  = '#5F9A8C';
const DIM   = '#7A6E60';
const RED   = '#C05050';
const PANEL = { background: '#0E0C09', borderColor: '#2A2118' };

function fmt(n) {
  if (!n) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

export default function HaulStrategyMapper() {
  const [loadout, setLoadout] = useState({ RMC: 0, CMR: 0, CMS: 0 });

  const { data: prices = [] } = useQuery({
    queryKey: ['commodity_prices'],
    queryFn: () => base44.entities.commodity_price.list(),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.product.filter({ available: true }),
  });

  // Best sell prices grouped by commodity + terminal
  const byTerminal = {};
  prices.filter(p => ['RMC', 'CMR', 'CMS'].includes(p.commodity_code)).forEach(p => {
    const key = p.terminal_name;
    if (!byTerminal[key]) byTerminal[key] = { terminal: p.terminal_name, system: p.star_system, prices: {} };
    byTerminal[key].prices[p.commodity_code] = p.price_sell;
  });

  // Score each terminal for current loadout
  const scored = Object.values(byTerminal).map(t => {
    const value =
      (loadout.RMC || 0) * (t.prices.RMC || 0) +
      (loadout.CMR || 0) * (t.prices.CMR || 0) +
      (loadout.CMS || 0) * (t.prices.CMS || 0);
    return { ...t, value };
  }).filter(t => t.value > 0).sort((a, b) => b.value - a.value);

  const best = scored[0];
  const totalScu = (loadout.RMC || 0) + (loadout.CMR || 0) + (loadout.CMS || 0);

  // Current stock from products
  const stock = {};
  products.forEach(p => {
    if (['RMC', 'CMR', 'CMS'].includes(p.code)) stock[p.code] = p.stock || 0;
  });

  return (
    <div className="space-y-4 font-mono p-4">
      <div className="text-[9px] tracking-[0.2em]" style={{ color: DIM }}>◈ HAUL STRATEGY MAPPER</div>

      {/* Current stock hint */}
      {Object.keys(stock).length > 0 && (
        <div className="border px-3 py-2 flex gap-4" style={PANEL}>
          <span className="text-[8px] tracking-[0.15em]" style={{ color: DIM }}>CURRENT STOCK:</span>
          {['RMC', 'CMR', 'CMS'].map(code => (
            <span key={code} className="text-[9px]">
              <span style={{ color: AMBER }}>{code}</span>
              <span style={{ color: DIM }}> {stock[code] ?? 0} SCU</span>
            </span>
          ))}
          <button
            className="ml-auto text-[8px] px-2 py-0.5 border"
            style={{ borderColor: TEAL, color: TEAL }}
            onClick={() => setLoadout({ RMC: stock.RMC || 0, CMR: stock.CMR || 0, CMS: stock.CMS || 0 })}
          >
            USE STOCK
          </button>
        </div>
      )}

      {/* Loadout inputs */}
      <div className="border p-3 space-y-3" style={PANEL}>
        <div className="text-[8px] tracking-[0.18em]" style={{ color: DIM }}>CURRENT CARGO LOADOUT (SCU)</div>
        <div className="grid grid-cols-3 gap-3">
          {['RMC', 'CMR', 'CMS'].map(code => (
            <div key={code}>
              <div className="text-[8px] mb-1" style={{ color: AMBER }}>{code}</div>
              <input
                type="number" min="0" value={loadout[code]}
                onChange={e => setLoadout(prev => ({ ...prev, [code]: Math.max(0, parseInt(e.target.value) || 0) }))}
                className="w-full bg-transparent border px-2 py-1.5 text-[11px] outline-none text-center"
                style={{ borderColor: '#2A2118', color: AMBER }}
              />
            </div>
          ))}
        </div>
        {totalScu > 0 && (
          <div className="text-[9px] text-right" style={{ color: DIM }}>
            Total: <span style={{ color: AMBER }}>{totalScu} SCU</span>
          </div>
        )}
      </div>

      {/* Recommendation */}
      {best && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="border p-3 space-y-2"
          style={{ ...PANEL, borderColor: `${AMBER}60` }}
        >
          <div className="text-[8px] tracking-[0.18em]" style={{ color: DIM }}>RECOMMENDED DESTINATION</div>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[13px] font-bold" style={{ color: AMBER }}>{best.terminal}</div>
              <div className="text-[9px]" style={{ color: DIM }}>{best.system}</div>
            </div>
            <div className="text-right">
              <div className="text-[18px] font-bold" style={{ color: TEAL }}>{fmt(best.value)}</div>
              <div className="text-[8px]" style={{ color: DIM }}>aUEC for this load</div>
            </div>
          </div>
          <div className="pt-2 border-t grid grid-cols-3 gap-2" style={{ borderColor: '#2A2118' }}>
            {['RMC', 'CMR', 'CMS'].map(code => best.prices[code] && (
              <div key={code} className="text-center">
                <div className="text-[8px]" style={{ color: DIM }}>{code}/SCU</div>
                <div className="text-[11px] font-bold" style={{ color: AMBER }}>{fmt(best.prices[code])}</div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Full leaderboard */}
      {scored.length > 1 && (
        <div className="border" style={PANEL}>
          <div className="px-3 py-2 border-b text-[8px] tracking-[0.18em]" style={{ borderColor: '#2A2118', color: DIM }}>
            TERMINAL RANKINGS FOR THIS LOAD
          </div>
          {scored.slice(0, 8).map((t, i) => (
            <div key={t.terminal}
              className="flex items-center justify-between px-3 py-2 border-b last:border-b-0"
              style={{ borderColor: '#2A2118' }}
            >
              <div className="flex items-center gap-2">
                <span className="text-[8px] w-4" style={{ color: i === 0 ? AMBER : DIM }}>#{i + 1}</span>
                <div>
                  <div className="text-[10px]" style={{ color: i === 0 ? AMBER : '#D8CFC0' }}>{t.terminal}</div>
                  <div className="text-[8px]" style={{ color: DIM }}>{t.system}</div>
                </div>
              </div>
              <div className="text-[11px] font-bold" style={{ color: i === 0 ? TEAL : DIM }}>{fmt(t.value)} ¤</div>
            </div>
          ))}
        </div>
      )}

      {totalScu === 0 && (
        <div className="border p-4 text-center text-[9px]" style={{ ...PANEL, color: DIM }}>
          Enter your cargo quantities above to see destination recommendations
        </div>
      )}
    </div>
  );
}