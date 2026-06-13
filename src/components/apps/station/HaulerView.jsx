import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';

const AMBER  = '#E0A22E';
const TEAL   = '#6FA08F';
const BLUE   = '#6FA0C8';
const DIM    = '#7A6E60';
const DIMMER = '#3A3028';
const PANEL  = { background: '#0E0C09', borderColor: '#2A2118' };

const LOT_STATUS_COLOR = { collected: AMBER, processed: TEAL, sold: DIM };
const ORDER_STATUS_COLOR = { confirmed: AMBER, in_fulfillment: TEAL };

export default function HaulerView() {
  const { data: lots = [] } = useQuery({
    queryKey: ['station_cargo_lots'],
    queryFn: () => base44.entities.cargo_lot.list('-created_date', 100),
  });
  const { data: orders = [] } = useQuery({
    queryKey: ['station_orders'],
    queryFn: () => base44.entities.order.list('-created_date', 100),
  });
  const { data: routes = [] } = useQuery({
    queryKey: ['station_routes'],
    queryFn: () => base44.entities.route_template.list('-created_date', 20),
  });

  const awaiting    = lots.filter((l) => ['collected', 'processed'].includes(l.status));
  const awaitingScu = awaiting.reduce((s, l) => s + (l.quantity_scu || 0), 0);
  const deliveries  = orders.filter((o) => ['confirmed', 'in_fulfillment'].includes(o.status));

  return (
    <div className="space-y-4 font-mono">
      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'LOTS AWAITING HAUL', value: awaiting.length, color: AMBER },
          { label: 'CARGO TO MOVE',      value: `${awaitingScu.toLocaleString()} SCU`, color: TEAL },
          { label: 'DELIVERIES DUE',     value: deliveries.length, color: BLUE },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="border p-3 text-center relative overflow-hidden"
            style={PANEL}
          >
            <svg className="absolute top-0 right-0 w-4 h-4 opacity-20" viewBox="0 0 16 16">
              <path d="M16 0 L16 16 L0 0 Z" fill={s.color} />
            </svg>
            <div className="text-[8px] tracking-[0.15em] mb-1" style={{ color: DIMMER }}>{s.label}</div>
            <div className="text-xl font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Cargo lots */}
      <div className="border" style={PANEL}>
        <div className="px-3 py-2 border-b text-[9px] tracking-[0.18em]" style={{ borderColor: '#2A2118', color: DIM }}>
          ▶ CARGO LOTS AWAITING HAUL ({awaiting.length})
        </div>
        {awaiting.length === 0 ? (
          <div className="p-6 text-center text-[10px]" style={{ color: DIMMER }}>
            Nothing waiting — check the Salvage haul board for incoming lots.
          </div>
        ) : awaiting.map((l, i) => {
          const sc = LOT_STATUS_COLOR[l.status] || DIM;
          return (
            <motion.div
              key={l.id}
              initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center justify-between px-3 py-2.5 border-b last:border-b-0"
              style={{ borderColor: DIMMER }}
            >
              <div>
                <div className="text-[11px]" style={{ color: '#D8CFC0' }}>{l.lot_name}</div>
                <div className="text-[8px] mt-0.5" style={{ color: DIM }}>
                  {l.origin || '—'} <span style={{ color: DIMMER }}>→</span> {l.destination || 'TBD'}
                  <span className="ml-2 px-1.5 py-0.5" style={{ color: sc, border: `1px solid ${sc}44`, background: `${sc}14` }}>
                    {l.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold" style={{ color: TEAL }}>
                  {(l.quantity_scu || 0).toLocaleString()} <span className="text-[9px]">SCU</span>
                  {l.commodity_code && <span className="ml-1 text-[9px]">{l.commodity_code}</span>}
                </div>
                {l.est_value_auec > 0 && (
                  <div className="text-[8px]" style={{ color: DIM }}>~{l.est_value_auec.toLocaleString()} aUEC</div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Deliveries */}
      <div className="border" style={PANEL}>
        <div className="px-3 py-2 border-b text-[9px] tracking-[0.18em]" style={{ borderColor: '#2A2118', color: DIM }}>
          ◆ CUSTOMER DELIVERIES ({deliveries.length})
        </div>
        {deliveries.length === 0 ? (
          <div className="p-6 text-center text-[10px]" style={{ color: DIMMER }}>
            No confirmed orders awaiting delivery.
          </div>
        ) : deliveries.map((o, i) => {
          const sc = ORDER_STATUS_COLOR[o.status] || DIM;
          return (
            <motion.div
              key={o.id}
              initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center justify-between px-3 py-2.5 border-b last:border-b-0"
              style={{ borderColor: DIMMER }}
            >
              <div>
                <div className="text-[11px]" style={{ color: '#D8CFC0' }}>
                  {o.tracking_code} — {o.customer_handle}
                </div>
                <div className="text-[8px] mt-0.5 flex items-center gap-2" style={{ color: DIM }}>
                  {o.delivery_location || 'TBD'}
                  <span className="px-1.5 py-0.5" style={{ color: sc, border: `1px solid ${sc}44`, background: `${sc}14` }}>
                    {o.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="text-sm font-bold" style={{ color: AMBER }}>
                {(o.total_auec || 0).toLocaleString()} <span className="text-[9px]">aUEC</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Saved routes */}
      {routes.length > 0 && (
        <div className="border" style={PANEL}>
          <div className="px-3 py-2 border-b text-[9px] tracking-[0.18em]" style={{ borderColor: '#2A2118', color: DIM }}>
            ◉ SAVED ROUTES
          </div>
          {routes.map((r) => (
            <div key={r.id} className="flex justify-between px-3 py-2 border-b last:border-b-0 text-[10px]"
              style={{ borderColor: DIMMER }}>
              <span style={{ color: '#D8CFC0' }}>{r.template_name} <span style={{ color: DIM }}>({r.commodity_code || '—'})</span></span>
              <span style={{ color: DIM }}>
                {r.origin || '—'} → {r.destination || '—'}
                {r.expected_payout_auec > 0 && (
                  <span className="ml-2" style={{ color: AMBER }}>~{r.expected_payout_auec.toLocaleString()}</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}