import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle } from 'lucide-react';

const AMBER  = '#E0A22E';
const TEAL   = '#6FA08F';
const BLUE   = '#6FA0C8';
const DIM    = '#7A6E60';
const DIMMER = '#3A3028';
const PANEL  = { background: '#0E0C09', borderColor: '#2A2118' };

const LOT_STATUS_FLOW  = { collected: 'processed', processed: 'sold' };
const LOT_STATUS_COLOR = { collected: AMBER, processed: TEAL, sold: DIM };
const LOT_STATUS_LABEL = { collected: 'COLLECTED', processed: 'PROCESSED', sold: 'SOLD' };

const ORDER_STATUS_FLOW  = { confirmed: 'in_fulfillment', in_fulfillment: 'delivered' };
const ORDER_STATUS_COLOR = { confirmed: AMBER, in_fulfillment: TEAL, delivered: '#7BA05B' };
const ORDER_STATUS_LABEL = { confirmed: 'CONFIRMED', in_fulfillment: 'IN FULFILLMENT', delivered: 'DELIVERED' };

export default function HaulerView() {
  const queryClient = useQueryClient();

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

  const advanceLot = useMutation({
    mutationFn: ({ id, status }) => base44.entities.cargo_lot.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['station_cargo_lots'] }),
  });

  const advanceOrder = useMutation({
    mutationFn: ({ id, status }) => base44.entities.order.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['station_orders'] }),
  });

  const awaiting     = lots.filter(l => ['collected', 'processed'].includes(l.status));
  const awaitingScu  = awaiting.reduce((s, l) => s + (l.quantity_scu || 0), 0);
  const deliveries   = orders.filter(o => ['confirmed', 'in_fulfillment'].includes(o.status));
  const totalRevenue = deliveries.reduce((s, o) => s + (o.total_auec || 0), 0);

  return (
    <div className="space-y-4 font-mono">

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'LOTS AWAITING HAUL', value: awaiting.length,                       color: AMBER },
          { label: 'CARGO TO MOVE',      value: `${awaitingScu.toLocaleString()} SCU`,  color: TEAL },
          { label: 'DELIVERIES DUE',     value: deliveries.length,                      color: BLUE },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="border p-3 relative overflow-hidden" style={PANEL}>
            <svg className="absolute top-0 right-0 w-4 h-4 opacity-20" viewBox="0 0 16 16">
              <path d="M16 0 L16 16 L0 0 Z" fill={s.color} />
            </svg>
            <div className="text-[8px] tracking-[0.15em] mb-1" style={{ color: DIMMER }}>{s.label}</div>
            <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Cargo lots — actionable */}
      <div className="border" style={PANEL}>
        <div className="px-3 py-2 border-b text-[9px] tracking-[0.18em] flex items-center justify-between"
          style={{ borderColor: '#2A2118', color: DIM }}>
          <span>▶ CARGO LOTS ({awaiting.length})</span>
          <span className="text-[8px]" style={{ color: DIMMER }}>TAP STATUS TO ADVANCE</span>
        </div>
        {awaiting.length === 0 ? (
          <div className="p-6 text-center text-[10px]" style={{ color: DIMMER }}>
            Nothing waiting — check the Salvage haul board for incoming lots.
          </div>
        ) : awaiting.map((l, i) => {
          const sc       = LOT_STATUS_COLOR[l.status] || DIM;
          const next     = LOT_STATUS_FLOW[l.status];
          return (
            <motion.div key={l.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 px-3 py-2.5 border-b last:border-b-0"
              style={{ borderColor: DIMMER }}>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] truncate" style={{ color: '#D8CFC0' }}>{l.lot_name}</div>
                <div className="text-[8px] mt-0.5 flex items-center gap-1.5" style={{ color: DIM }}>
                  <span>{l.origin || '—'}</span>
                  <ArrowRight className="w-2.5 h-2.5 opacity-40" />
                  <span>{l.destination || 'TBD'}</span>
                  {l.commodity_code && <span style={{ color: TEAL }}>· {l.commodity_code}</span>}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-xs font-bold" style={{ color: TEAL }}>{(l.quantity_scu || 0).toLocaleString()} <span className="text-[9px]">SCU</span></div>
                {l.est_value_auec > 0 && <div className="text-[8px]" style={{ color: DIM }}>~{l.est_value_auec.toLocaleString()}</div>}
              </div>
              {next ? (
                <button onClick={() => advanceLot.mutate({ id: l.id, status: next })}
                  disabled={advanceLot.isPending}
                  className="flex items-center gap-1 px-2 py-1 text-[8px] tracking-[0.1em] border shrink-0 transition-all"
                  style={{ color: sc, borderColor: `${sc}44`, background: `${sc}10` }}>
                  {LOT_STATUS_LABEL[l.status]} <ArrowRight className="w-2.5 h-2.5" />
                </button>
              ) : (
                <span className="text-[8px] shrink-0" style={{ color: sc }}>{LOT_STATUS_LABEL[l.status]}</span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Customer deliveries — actionable */}
      <div className="border" style={PANEL}>
        <div className="px-3 py-2 border-b text-[9px] tracking-[0.18em] flex items-center justify-between"
          style={{ borderColor: '#2A2118', color: DIM }}>
          <span>◆ CUSTOMER DELIVERIES ({deliveries.length})</span>
          {totalRevenue > 0 && <span style={{ color: AMBER }}>{totalRevenue.toLocaleString()} aUEC DUE</span>}
        </div>
        {deliveries.length === 0 ? (
          <div className="p-6 text-center text-[10px]" style={{ color: DIMMER }}>
            No confirmed orders awaiting delivery.
          </div>
        ) : deliveries.map((o, i) => {
          const sc   = ORDER_STATUS_COLOR[o.status] || DIM;
          const next = ORDER_STATUS_FLOW[o.status];
          return (
            <motion.div key={o.id} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 px-3 py-2.5 border-b last:border-b-0"
              style={{ borderColor: DIMMER }}>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] flex items-center gap-2 truncate" style={{ color: '#D8CFC0' }}>
                  <span style={{ color: DIM }}>{o.tracking_code}</span>
                  <span>→</span>
                  <span>{o.customer_handle}</span>
                </div>
                <div className="text-[8px] mt-0.5" style={{ color: DIM }}>
                  {o.delivery_location || 'TBD'}
                  {o.handoff_passphrase && (
                    <span className="ml-2 px-1.5 py-0.5" style={{ color: TEAL, border: `1px solid ${TEAL}30`, background: `${TEAL}0A` }}>
                      ✦ {o.handoff_passphrase}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-sm font-bold shrink-0" style={{ color: AMBER }}>
                {(o.total_auec || 0).toLocaleString()} <span className="text-[9px]">aUEC</span>
              </div>
              {next ? (
                <button onClick={() => advanceOrder.mutate({ id: o.id, status: next })}
                  disabled={advanceOrder.isPending}
                  className="flex items-center gap-1 px-2 py-1 text-[8px] tracking-[0.1em] border shrink-0 transition-all"
                  style={{ color: sc, borderColor: `${sc}44`, background: `${sc}10` }}>
                  {ORDER_STATUS_LABEL[o.status]} <ArrowRight className="w-2.5 h-2.5" />
                </button>
              ) : (
                <span className="flex items-center gap-1 text-[8px] shrink-0" style={{ color: sc }}>
                  <CheckCircle className="w-3 h-3" /> {ORDER_STATUS_LABEL[o.status]}
                </span>
              )}
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
          {routes.map(r => (
            <div key={r.id} className="flex justify-between items-center px-3 py-2 border-b last:border-b-0"
              style={{ borderColor: DIMMER }}>
              <span className="text-[10px]" style={{ color: '#D8CFC0' }}>
                {r.template_name}
                {r.commodity_code && <span style={{ color: DIM }}> · {r.commodity_code}</span>}
              </span>
              <span className="text-[9px]" style={{ color: DIM }}>
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