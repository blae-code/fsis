import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

const AMBER  = '#E0A22E';
const TEAL   = '#6FA08F';
const DIM    = '#7A6E60';
const DIMMER = '#3A3028';
const PANEL  = { background: '#0E0C09', borderColor: '#2A2118' };

const ACTIVE_STATUSES = ['planning', 'in-progress', 'hauling'];
const COMMODITIES = ['RMC', 'CMR', 'CMS'];

const COMMODITY_META = {
  RMC: { label: 'Recycled Material Composite', color: AMBER },
  CMR: { label: 'Construction Mat. (Reclaimed)', color: TEAL },
  CMS: { label: 'Construction Mat. (Salvaged)', color: '#C8893B' },
};

const STATUS_COLOR = {
  'planning': DIM, 'in-progress': AMBER, 'hauling': TEAL,
};

export default function SalvageOpsView() {
  const { data: sessions = [] } = useQuery({
    queryKey: ['station_sessions'],
    queryFn: () => base44.entities.salvage_session.list('-created_date', 100),
  });
  const { data: prices = [] } = useQuery({
    queryKey: ['commodity_prices'],
    queryFn: () => base44.entities.commodity_price.list(),
  });

  const active = sessions.filter((s) => ACTIVE_STATUSES.includes(s.status));
  const stock = { RMC: 0, CMR: 0, CMS: 0 };
  active.forEach((s) => {
    stock.RMC += s.rmc_scu || 0;
    stock.CMR += s.cmr_scu || 0;
    stock.CMS += s.cms_scu || 0;
  });

  const best = {};
  prices.forEach((p) => {
    if (p.price_sell && (!best[p.commodity_code] || p.price_sell > best[p.commodity_code].price_sell)) {
      best[p.commodity_code] = p;
    }
  });

  const totalScu = stock.RMC + stock.CMR + stock.CMS;

  return (
    <div className="space-y-4 font-mono">
      {/* Stock tiles */}
      <div className="grid grid-cols-3 gap-2">
        {COMMODITIES.map((code, i) => {
          const meta = COMMODITY_META[code];
          const b = best[code];
          return (
            <motion.div
              key={code}
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="border p-3 relative overflow-hidden"
              style={PANEL}
            >
              <svg className="absolute top-0 right-0 w-5 h-5 opacity-20" viewBox="0 0 20 20">
                <path d="M20 0 L20 20 L0 0 Z" fill={meta.color} />
              </svg>
              <div className="text-[8px] tracking-[0.18em] mb-1" style={{ color: DIMMER }}>{code} UNCOMMITTED</div>
              <div className="text-xl font-bold" style={{ color: meta.color }}>
                {stock[code].toLocaleString()} <span className="text-[10px]">SCU</span>
              </div>
              {b && (
                <div className="text-[8px] mt-1" style={{ color: DIM }}>
                  Best: <span style={{ color: meta.color }}>{b.price_sell.toLocaleString()}</span> @ {b.terminal_name}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Total uncommitted */}
      <div className="border px-3 py-2 flex items-center justify-between" style={PANEL}>
        <span className="text-[9px] tracking-[0.15em]" style={{ color: DIM }}>TOTAL UNCOMMITTED STOCK</span>
        <span className="text-lg font-bold font-mono" style={{ color: AMBER }}>{totalScu.toLocaleString()} SCU</span>
      </div>

      {/* Active runs */}
      <div className="border" style={PANEL}>
        <div className="px-3 py-2 border-b text-[9px] tracking-[0.18em]" style={{ borderColor: '#2A2118', color: DIM }}>
          ⬡ ACTIVE SALVAGE RUNS ({active.length})
        </div>
        {active.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-[10px]" style={{ color: DIMMER }}>No active runs — start a session in the Salvage app.</div>
          </div>
        ) : active.map((s, i) => {
          const scu = (s.rmc_scu || 0) + (s.cmr_scu || 0) + (s.cms_scu || 0);
          const statusColor = STATUS_COLOR[s.status] || DIM;
          return (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center justify-between px-3 py-2.5 border-b last:border-b-0"
              style={{ borderColor: DIMMER }}
            >
              <div>
                <div className="text-[11px]" style={{ color: '#D8CFC0' }}>{s.session_name}</div>
                <div className="text-[8px] flex items-center gap-2 mt-0.5" style={{ color: DIM }}>
                  <span style={{ color: statusColor }}>● {s.status.toUpperCase()}</span>
                  <span>{s.ship || '—'}</span>
                  <span>{s.location || '—'}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold" style={{ color: AMBER }}>{scu.toLocaleString()} <span className="text-[9px]">SCU</span></div>
                {s.estimated_value > 0 && (
                  <div className="text-[8px]" style={{ color: DIM }}>~{s.estimated_value.toLocaleString()} aUEC</div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Best sell terminals */}
      <div className="border" style={PANEL}>
        <div className="px-3 py-2 border-b text-[9px] tracking-[0.18em]" style={{ borderColor: '#2A2118', color: DIM }}>
          ▸ WHERE TO SELL — CURRENT BEST
        </div>
        {COMMODITIES.every((c) => !best[c]) ? (
          <div className="p-4 text-center text-[10px]" style={{ color: DIMMER }}>No UEX price data synced yet.</div>
        ) : (
          COMMODITIES.filter((c) => best[c]).map((c) => (
            <div key={c} className="flex justify-between items-center px-3 py-2 border-b last:border-b-0 text-[10px]"
              style={{ borderColor: DIMMER }}>
              <span style={{ color: '#D8CFC0' }}>
                <span style={{ color: COMMODITY_META[c].color }}>{c}</span> → {best[c].terminal_name}
              </span>
              <span className="font-bold" style={{ color: COMMODITY_META[c].color }}>
                {best[c].price_sell.toLocaleString()} aUEC
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}