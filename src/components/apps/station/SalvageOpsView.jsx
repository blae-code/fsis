import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const AMBER  = '#E0A22E';
const TEAL   = '#6FA08F';
const DIM    = '#7A6E60';
const DIMMER = '#3A3028';
const PANEL  = { background: '#0E0C09', borderColor: '#2A2118' };

const ACTIVE_STATUSES = ['planning', 'in-progress', 'hauling'];
const COMMODITIES = ['RMC', 'CMR', 'CMS'];

const COMMODITY_META = {
  RMC: { label: 'Recycled Material Composite',      color: AMBER,  key: 'rmc_scu' },
  CMR: { label: 'Construction Mat. (Reclaimed)',     color: TEAL,   key: 'cmr_scu' },
  CMS: { label: 'Construction Mat. (Salvaged)',      color: '#6FA0C8', key: 'cms_scu' },
};

const STATUS_FLOW  = { planning: 'in-progress', 'in-progress': 'hauling', hauling: 'sold' };
const STATUS_COLOR = { planning: DIM, 'in-progress': AMBER, hauling: TEAL, sold: '#7BA05B', archived: DIMMER };
const STATUS_LABEL = { planning: 'PLANNING', 'in-progress': 'IN PROGRESS', hauling: 'HAULING', sold: 'SOLD', archived: 'ARCHIVED' };

export default function SalvageOpsView() {
  const queryClient = useQueryClient();

  const { data: sessions = [] } = useQuery({
    queryKey: ['station_sessions'],
    queryFn: () => base44.entities.salvage_session.list('-created_date', 100),
  });
  const { data: prices = [] } = useQuery({
    queryKey: ['commodity_prices'],
    queryFn: () => base44.entities.commodity_price.list(),
  });

  const advanceMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.salvage_session.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['station_sessions'] }),
  });

  const active = sessions.filter(s => ACTIVE_STATUSES.includes(s.status));

  const stock = { RMC: 0, CMR: 0, CMS: 0 };
  active.forEach(s => {
    stock.RMC += s.rmc_scu || 0;
    stock.CMR += s.cmr_scu || 0;
    stock.CMS += s.cms_scu || 0;
  });

  const best = {};
  prices.forEach(p => {
    if (p.price_sell && (!best[p.commodity_code] || p.price_sell > best[p.commodity_code].price_sell)) {
      best[p.commodity_code] = p;
    }
  });

  const totalScu = stock.RMC + stock.CMR + stock.CMS;
  const estValue = COMMODITIES.reduce((sum, c) => {
    return sum + (stock[c] * (best[c]?.price_sell || 0));
  }, 0);

  return (
    <div className="space-y-4 font-mono">

      {/* Stock tiles */}
      <div className="grid grid-cols-3 gap-2">
        {COMMODITIES.map((code, i) => {
          const meta = COMMODITY_META[code];
          const b = best[code];
          const val = stock[code];
          return (
            <motion.div key={code} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="border p-3 relative overflow-hidden" style={PANEL}>
              <svg className="absolute top-0 right-0 w-5 h-5 opacity-20" viewBox="0 0 20 20">
                <path d="M20 0 L20 20 L0 0 Z" fill={meta.color} />
              </svg>
              <div className="text-[8px] tracking-[0.18em] mb-1" style={{ color: DIMMER }}>{code}</div>
              <div className="text-xl font-bold" style={{ color: meta.color }}>
                {val.toLocaleString()} <span className="text-[9px]">SCU</span>
              </div>
              {b && (
                <div className="text-[8px] mt-1 leading-tight" style={{ color: DIM }}>
                  <span style={{ color: meta.color }}>{b.price_sell.toLocaleString()} ¤</span>
                  <span className="ml-1">@ {b.terminal_name}</span>
                </div>
              )}
              {b && val > 0 && (
                <div className="text-[8px] mt-0.5 font-bold" style={{ color: meta.color }}>
                  ~{(val * b.price_sell).toLocaleString()} aUEC
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Totals strip */}
      <div className="border px-3 py-2 grid grid-cols-2 gap-4" style={PANEL}>
        <div>
          <div className="text-[8px] tracking-[0.15em] mb-0.5" style={{ color: DIMMER }}>TOTAL UNCOMMITTED</div>
          <div className="text-lg font-bold" style={{ color: AMBER }}>{totalScu.toLocaleString()} <span className="text-[9px]">SCU</span></div>
        </div>
        {estValue > 0 && (
          <div>
            <div className="text-[8px] tracking-[0.15em] mb-0.5" style={{ color: DIMMER }}>EST. YIELD</div>
            <div className="text-lg font-bold" style={{ color: TEAL }}>{estValue.toLocaleString()} <span className="text-[9px]">aUEC</span></div>
          </div>
        )}
      </div>

      {/* Active runs — actionable */}
      <div className="border" style={PANEL}>
        <div className="px-3 py-2 border-b text-[9px] tracking-[0.18em] flex items-center justify-between"
          style={{ borderColor: '#2A2118', color: DIM }}>
          <span>⬡ ACTIVE RUNS ({active.length})</span>
          <span className="text-[8px]" style={{ color: DIMMER }}>TAP STATUS TO ADVANCE</span>
        </div>
        {active.length === 0 ? (
          <div className="p-6 text-center text-[10px]" style={{ color: DIMMER }}>
            No active runs — start a session in the Salvage app.
          </div>
        ) : active.map((s, i) => {
          const scu = (s.rmc_scu || 0) + (s.cmr_scu || 0) + (s.cms_scu || 0);
          const sc = STATUS_COLOR[s.status] || DIM;
          const nextStatus = STATUS_FLOW[s.status];
          return (
            <motion.div key={s.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center justify-between px-3 py-2.5 border-b last:border-b-0"
              style={{ borderColor: DIMMER }}>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] truncate" style={{ color: '#D8CFC0' }}>{s.session_name}</div>
                <div className="text-[8px] flex items-center gap-2 mt-0.5" style={{ color: DIM }}>
                  <span>{s.ship || '—'}</span>
                  <span style={{ color: DIMMER }}>·</span>
                  <span>{s.location || '—'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <div className="text-xs font-bold" style={{ color: AMBER }}>{scu.toLocaleString()} <span className="text-[9px]">SCU</span></div>
                  {s.estimated_value > 0 && <div className="text-[8px]" style={{ color: DIM }}>~{s.estimated_value.toLocaleString()}</div>}
                </div>
                {nextStatus && (
                  <button
                    onClick={() => advanceMutation.mutate({ id: s.id, status: nextStatus })}
                    disabled={advanceMutation.isPending}
                    className="flex items-center gap-1 px-2 py-1 text-[8px] tracking-[0.1em] border transition-all"
                    style={{ color: sc, borderColor: `${sc}44`, background: `${sc}10` }}
                    title={`Advance to ${nextStatus}`}
                  >
                    {STATUS_LABEL[s.status]} <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                )}
                {!nextStatus && (
                  <span className="px-2 py-1 text-[8px] tracking-[0.1em]" style={{ color: sc }}>{STATUS_LABEL[s.status]}</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Best sell terminals */}
      {COMMODITIES.some(c => best[c]) && (
        <div className="border" style={PANEL}>
          <div className="px-3 py-2 border-b text-[9px] tracking-[0.18em]" style={{ borderColor: '#2A2118', color: DIM }}>
            ▸ BEST SELL TERMINALS
          </div>
          {COMMODITIES.filter(c => best[c]).map(c => (
            <div key={c} className="flex justify-between items-center px-3 py-2 border-b last:border-b-0"
              style={{ borderColor: DIMMER }}>
              <span className="text-[10px]" style={{ color: '#D8CFC0' }}>
                <span style={{ color: COMMODITY_META[c].color }}>{c}</span>
                <span style={{ color: DIM }}> → {best[c].terminal_name}</span>
                {best[c].star_system && <span style={{ color: DIMMER }}> ({best[c].star_system})</span>}
              </span>
              <span className="text-[10px] font-bold" style={{ color: COMMODITY_META[c].color }}>
                {best[c].price_sell.toLocaleString()} ¤/SCU
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}