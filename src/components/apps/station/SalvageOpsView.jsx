import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Anchor, TrendingUp } from 'lucide-react';

const AMBER  = '#E0A22E';
const TEAL   = '#6FA08F';
const DIM    = '#7A6E60';
const DIMMER = '#3A3028';
const PANEL  = { background: '#111009', borderColor: '#2A2118' };
const ACTIVE_STATUSES = ['planning', 'in-progress', 'hauling'];
const COMMODITIES = ['RMC', 'CMR', 'CMS'];

const STATUS_COLOR = { planning: '#6FA08F', 'in-progress': '#E0A22E', hauling: '#5B8EC0' };

function fmt(n) { return n >= 1_000_000 ? `${(n/1_000_000).toFixed(2)}M` : n >= 1_000 ? `${(n/1_000).toFixed(1)}k` : n.toLocaleString(); }

export default function SalvageOpsView() {
  const { data: sessions = [] } = useQuery({ queryKey: ['station_sessions'], queryFn: () => base44.entities.salvage_session.list('-created_date', 100) });
  const { data: prices = [] }   = useQuery({ queryKey: ['commodity_prices'],  queryFn: () => base44.entities.commodity_price.list() });

  const active = sessions.filter(s => ACTIVE_STATUSES.includes(s.status));
  const stock = { RMC: 0, CMR: 0, CMS: 0 };
  active.forEach(s => { stock.RMC += s.rmc_scu||0; stock.CMR += s.cmr_scu||0; stock.CMS += s.cms_scu||0; });

  const best = {};
  prices.forEach(p => { if (p.price_sell && (!best[p.commodity_code] || p.price_sell > best[p.commodity_code].price_sell)) best[p.commodity_code] = p; });

  return (
    <div className="space-y-3 font-mono">
      {/* Stock tiles */}
      <div className="grid grid-cols-3 gap-2">
        {COMMODITIES.map(code => (
          <div key={code} className="border p-3 relative overflow-hidden" style={PANEL}>
            <div className="absolute top-0 left-0 w-0.5 h-full" style={{ background: TEAL, opacity: 0.6 }} />
            <div className="pl-2">
              <div className="text-[8px] tracking-[0.18em]" style={{ color: DIMMER }}>{code} UNCOMMITTED</div>
              <div className="text-lg font-bold" style={{ color: AMBER }}>{stock[code].toLocaleString()}<span className="text-[9px] ml-1" style={{ color: DIM }}>SCU</span></div>
              {best[code] && <div className="text-[8px] mt-0.5" style={{ color: DIM }}>best {fmt(best[code].price_sell)} @ {best[code].terminal_name}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Active runs */}
      <div className="border" style={PANEL}>
        <div className="flex items-center gap-1.5 px-3 py-2 border-b text-[9px] tracking-[0.2em]" style={{ borderColor: '#1E1810', color: '#B0793A' }}>
          <Anchor className="w-3 h-3" /> ACTIVE SALVAGE RUNS ({active.length})
        </div>
        {active.length === 0 ? (
          <p className="text-center py-6 text-[10px]" style={{ color: DIM }}>No active runs. Start a session in the Salvage app.</p>
        ) : active.map((s, i) => {
          const scu = (s.rmc_scu||0)+(s.cmr_scu||0)+(s.cms_scu||0);
          const statusColor = STATUS_COLOR[s.status] || DIM;
          return (
            <motion.div key={s.id} initial={{opacity:0,x:-4}} animate={{opacity:1,x:0}} transition={{delay:i*0.04}}
              className="flex items-center justify-between px-3 py-2.5 border-b last:border-b-0" style={{ borderColor: '#1E1810' }}>
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-1 h-4 shrink-0" style={{ background: statusColor, opacity: 0.8 }} />
                <div className="min-w-0">
                  <div className="text-[10px] font-bold truncate" style={{ color: '#D8CFC0' }}>{s.session_name}</div>
                  <div className="text-[8px]" style={{ color: DIM }}>{s.ship||'—'} · {s.location||'—'} · <span style={{ color: statusColor }}>{s.status.toUpperCase()}</span></div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[11px] font-bold font-mono" style={{ color: AMBER }}>{scu.toLocaleString()} SCU</div>
                {s.estimated_value > 0 && <div className="text-[8px]" style={{ color: DIM }}>~{fmt(s.estimated_value)} ¤</div>}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Best terminals */}
      <div className="border p-3" style={PANEL}>
        <div className="flex items-center gap-1.5 text-[9px] tracking-[0.2em] mb-2" style={{ color: '#B0793A' }}>
          <TrendingUp className="w-3 h-3" /> WHERE TO SELL — CURRENT BEST
        </div>
        {COMMODITIES.filter(c=>best[c]).map(c => (
          <div key={c} className="flex justify-between items-center py-1.5 border-b last:border-b-0" style={{ borderColor: '#1E1810' }}>
            <span className="text-[9px] font-mono" style={{ color: '#D8CFC0' }}>{c} → {best[c].terminal_name}</span>
            <span className="text-[11px] font-bold font-mono" style={{ color: AMBER }}>{fmt(best[c].price_sell)} ¤</span>
          </div>
        ))}
        {COMMODITIES.every(c=>!best[c]) && <p className="text-[9px] text-center py-2" style={{ color: DIM }}>No UEX price data synced.</p>}
      </div>
    </div>
  );
}