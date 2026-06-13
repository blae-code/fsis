import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Truck, PackageCheck, Route } from 'lucide-react';

const AMBER  = '#E0A22E';
const TEAL   = '#6FA08F';
const DIM    = '#7A6E60';
const DIMMER = '#3A3028';
const PANEL  = { background: '#111009', borderColor: '#2A2118' };

const LOT_STATUS_COLOR = { collected: '#C8893B', processed: '#6FA08F', sold: '#7BA05B' };

function fmt(n) { return n >= 1_000_000 ? `${(n/1_000_000).toFixed(2)}M` : n >= 1_000 ? `${(n/1_000).toFixed(1)}k` : n.toLocaleString(); }

export default function HaulerView() {
  const { data: lots = [] }   = useQuery({ queryKey: ['station_cargo_lots'], queryFn: () => base44.entities.cargo_lot.list('-created_date', 100) });
  const { data: orders = [] } = useQuery({ queryKey: ['station_orders'],     queryFn: () => base44.entities.order.list('-created_date', 100) });
  const { data: routes = [] } = useQuery({ queryKey: ['station_routes'],     queryFn: () => base44.entities.route_template.list('-created_date', 20) });

  const awaiting  = lots.filter(l => ['collected','processed'].includes(l.status));
  const awaitingScu = awaiting.reduce((s,l) => s+(l.quantity_scu||0), 0);
  const deliveries = orders.filter(o => ['confirmed','in_fulfillment'].includes(o.status));

  return (
    <div className="space-y-3 font-mono">
      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'LOTS AWAITING HAUL', value: awaiting.length, color: '#C8893B' },
          { label: 'CARGO TO MOVE', value: `${awaitingScu.toLocaleString()} SCU`, color: AMBER },
          { label: 'DELIVERIES DUE', value: deliveries.length, color: '#5B8EC0' },
        ].map(t => (
          <div key={t.label} className="border p-3 relative overflow-hidden" style={PANEL}>
            <div className="absolute top-0 left-0 w-0.5 h-full" style={{ background: t.color, opacity: 0.7 }} />
            <div className="pl-2">
              <div className="text-xl font-bold font-mono" style={{ color: t.color }}>{t.value}</div>
              <div className="text-[8px] tracking-[0.16em] mt-0.5" style={{ color: DIMMER }}>{t.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Lots */}
      <div className="border" style={PANEL}>
        <div className="flex items-center gap-1.5 px-3 py-2 border-b text-[9px] tracking-[0.2em]" style={{ borderColor: '#1E1810', color: '#B0793A' }}>
          <Truck className="w-3 h-3" /> CARGO LOTS AWAITING HAUL ({awaiting.length})
        </div>
        {awaiting.length === 0 ? (
          <p className="text-center py-6 text-[10px]" style={{ color: DIM }}>Nothing waiting. Check Salvage haul board for incoming lots.</p>
        ) : awaiting.map((l,i) => {
          const statusColor = LOT_STATUS_COLOR[l.status] || DIM;
          return (
            <motion.div key={l.id} initial={{opacity:0,x:-4}} animate={{opacity:1,x:0}} transition={{delay:i*0.04}}
              className="flex items-center justify-between px-3 py-2.5 border-b last:border-b-0" style={{ borderColor: '#1E1810' }}>
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-1 h-4 shrink-0" style={{ background: statusColor, opacity: 0.8 }} />
                <div className="min-w-0">
                  <div className="text-[10px] font-bold truncate" style={{ color: '#D8CFC0' }}>{l.lot_name}</div>
                  <div className="text-[8px]" style={{ color: DIM }}>
                    {l.origin||'—'} → {l.destination||'TBD'} · <span style={{ color: statusColor }}>{l.status.toUpperCase()}</span>
                  </div>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[11px] font-bold font-mono" style={{ color: AMBER }}>{(l.quantity_scu||0).toLocaleString()} SCU {l.commodity_code||''}</div>
                {l.est_value_auec > 0 && <div className="text-[8px]" style={{ color: DIM }}>~{fmt(l.est_value_auec)} ¤</div>}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Deliveries */}
      <div className="border" style={PANEL}>
        <div className="flex items-center gap-1.5 px-3 py-2 border-b text-[9px] tracking-[0.2em]" style={{ borderColor: '#1E1810', color: '#B0793A' }}>
          <PackageCheck className="w-3 h-3" /> CUSTOMER DELIVERIES ({deliveries.length})
        </div>
        {deliveries.length === 0 ? (
          <p className="text-center py-6 text-[10px]" style={{ color: DIM }}>No confirmed orders awaiting delivery.</p>
        ) : deliveries.map((o,i) => (
          <motion.div key={o.id} initial={{opacity:0,x:-4}} animate={{opacity:1,x:0}} transition={{delay:i*0.04}}
            className="flex items-center justify-between px-3 py-2.5 border-b last:border-b-0" style={{ borderColor: '#1E1810' }}>
            <div className="min-w-0">
              <div className="text-[10px] font-bold" style={{ color: '#D8CFC0' }}>{o.tracking_code} — {o.customer_handle}</div>
              <div className="text-[8px]" style={{ color: DIM }}>{o.delivery_location||'TBD'} · {o.status.replace('_',' ').toUpperCase()}</div>
            </div>
            <div className="text-[11px] font-bold font-mono shrink-0" style={{ color: AMBER }}>{(o.total_auec||0).toLocaleString()} ¤</div>
          </motion.div>
        ))}
      </div>

      {/* Saved routes */}
      {routes.length > 0 && (
        <div className="border p-3" style={PANEL}>
          <div className="flex items-center gap-1.5 text-[9px] tracking-[0.2em] mb-2" style={{ color: '#B0793A' }}>
            <Route className="w-3 h-3" /> SAVED ROUTES
          </div>
          {routes.map(r => (
            <div key={r.id} className="flex justify-between items-center py-1.5 border-b last:border-b-0 text-[9px]" style={{ borderColor: '#1E1810' }}>
              <span style={{ color: '#D8CFC0' }}>{r.template_name} <span style={{ color: DIM }}>({r.commodity_code||'—'})</span></span>
              <span style={{ color: DIM }}>
                {r.origin||'—'} → {r.destination||'—'}
                {r.expected_payout_auec > 0 && <span className="font-mono font-bold ml-2" style={{ color: AMBER }}>~{fmt(r.expected_payout_auec)} ¤</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}