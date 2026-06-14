import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import CommodityTrendChart from '@/components/apps/station/CommodityTrendChart';

const AMBER  = '#E0A22E';
const TEAL   = '#6FA08F';
const RED    = '#C05050';
const DIM    = '#7A6E60';
const DIMMER = '#3A3028';
const PANEL  = { background: '#0E0C09', borderColor: '#2A2118' };

const OP_TYPE_COLOR = {
  salvage: AMBER, bounty: RED, cargo: TEAL,
  piracy: '#9B6FC0', escort: TEAL, other: DIM,
};

const ORDER_STATUS_COLOR = { new: RED, confirmed: AMBER, in_fulfillment: TEAL };
const ORDER_STATUS_URGENCY = { new: 3, confirmed: 2, in_fulfillment: 1 };

function fmt(n) {
  if (!n) return '0';
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return Number(n).toLocaleString();
}

function StatTile({ label, value, sub, color = AMBER, alert = false, delay = 0 }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="border p-3 relative overflow-hidden"
      style={{ ...PANEL, borderColor: alert ? `${RED}60` : '#2A2118' }}>
      <svg className="absolute top-0 right-0 w-5 h-5 opacity-25" viewBox="0 0 20 20">
        <path d="M20 0 L20 20 L0 0 Z" fill={color} />
      </svg>
      {alert && <AlertTriangle className="absolute top-2 right-2 w-3 h-3 opacity-60" style={{ color: RED }} />}
      <div className="text-[8px] tracking-[0.2em] mb-1" style={{ color: DIMMER }}>{label}</div>
      <div className="text-2xl font-bold font-mono" style={{ color }}>{value}</div>
      {sub && <div className="text-[9px] mt-0.5" style={{ color: DIM }}>{sub}</div>}
    </motion.div>
  );
}

export default function ManagementView() {
  const { data: sessions    = [] } = useQuery({ queryKey: ['station_sessions'],    queryFn: () => base44.entities.salvage_session.list('-created_date', 100) });
  const { data: orders      = [] } = useQuery({ queryKey: ['station_orders'],      queryFn: () => base44.entities.order.list('-created_date', 100) });
  const { data: lots        = [] } = useQuery({ queryKey: ['station_cargo_lots'],  queryFn: () => base44.entities.cargo_lot.list('-created_date', 100) });
  const { data: workOrders  = [] } = useQuery({ queryKey: ['station_work_orders'], queryFn: () => base44.entities.work_order.filter({ status: 'open' }) });
  const { data: ledger      = [] } = useQuery({ queryKey: ['mgmt_ledger_7d'],      queryFn: () => base44.entities.ledger_entry.list('-entry_date', 200) });

  const activeSessions = sessions.filter(s => ['planning', 'in-progress', 'hauling'].includes(s.status)).length;
  const openOrders     = orders.filter(o => ['new', 'confirmed', 'in_fulfillment'].includes(o.status));
  const newOrders      = openOrders.filter(o => o.status === 'new').length;
  const lotsInMotion   = lots.filter(l => l.status !== 'sold').length;

  // 7-day financials
  const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 7);
  const recent    = ledger.filter(e => new Date(e.entry_date || e.created_date) >= cutoff);
  const income7d  = recent.filter(e => e.entry_type === 'income').reduce((s, e)  => s + (e.amount_auec || 0), 0);
  const expense7d = recent.filter(e => e.entry_type === 'expense').reduce((s, e) => s + (e.amount_auec || 0), 0);
  const net7d     = income7d - expense7d;

  // Crew obligations
  const totalOwed = workOrders.reduce((sum, o) => {
    const gross = o.gross_auec || 0;
    const exp   = (o.expenses || []).reduce((s, e) => s + (e.amount_auec || 0), 0);
    return sum + Math.max(0, gross - exp);
  }, 0);

  // Op type breakdown
  const opBreakdown = {};
  workOrders.forEach(o => {
    const t = o.op_type || 'other';
    opBreakdown[t] = (opBreakdown[t] || 0) + 1;
  });

  // Urgent orders sorted by urgency
  const urgentOrders = [...openOrders]
    .sort((a, b) => (ORDER_STATUS_URGENCY[b.status] || 0) - (ORDER_STATUS_URGENCY[a.status] || 0))
    .slice(0, 5);

  return (
    <div className="space-y-4 font-mono">

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <StatTile label="ACTIVE SALVAGE RUNS"  value={activeSessions}       color={AMBER}    delay={0} />
        <StatTile label="OPEN ORDERS"           value={openOrders.length}   color="#6FA0C8"  delay={0.04}
          alert={newOrders > 0} sub={newOrders > 0 ? `${newOrders} NEW — needs action` : undefined} />
        <StatTile label="CARGO IN MOTION"       value={lotsInMotion}         color={TEAL}     delay={0.08} />
        <StatTile label="UNSETTLED WORK ORDERS" value={workOrders.length}    color="#C8893B"  delay={0.12}
          sub={totalOwed > 0 ? `${fmt(totalOwed)} aUEC owed` : undefined} />
      </div>

      {/* 7-day financial strip */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.16 }}
        className="border p-3 grid grid-cols-3 gap-4" style={PANEL}>
        <div>
          <div className="text-[8px] tracking-[0.2em] mb-1 flex items-center gap-1" style={{ color: DIMMER }}>
            <TrendingUp className="w-2.5 h-2.5" /> 7D INCOME
          </div>
          <div className="text-lg font-bold" style={{ color: AMBER }}>{fmt(income7d)} <span className="text-[9px]">aUEC</span></div>
        </div>
        <div>
          <div className="text-[8px] tracking-[0.2em] mb-1 flex items-center gap-1" style={{ color: DIMMER }}>
            <TrendingDown className="w-2.5 h-2.5" /> 7D EXPENSES
          </div>
          <div className="text-lg font-bold" style={{ color: RED }}>{fmt(expense7d)} <span className="text-[9px]">aUEC</span></div>
        </div>
        <div>
          <div className="text-[8px] tracking-[0.2em] mb-1" style={{ color: DIMMER }}>7D NET</div>
          <div className="text-lg font-bold" style={{ color: net7d >= 0 ? '#7BA05B' : RED }}>
            {net7d >= 0 ? '+' : ''}{fmt(net7d)} <span className="text-[9px]">aUEC</span>
          </div>
        </div>
      </motion.div>

      {/* Orders needing attention */}
      {urgentOrders.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="border" style={{ ...PANEL, borderColor: newOrders > 0 ? `${RED}40` : '#2A2118' }}>
          <div className="px-3 py-2 border-b text-[9px] tracking-[0.18em] flex items-center justify-between"
            style={{ borderColor: '#2A2118', color: DIM }}>
            <span>▸ ORDERS NEEDING ATTENTION</span>
            {newOrders > 0 && (
              <span className="flex items-center gap-1 animate-pulse" style={{ color: RED }}>
                <AlertTriangle className="w-3 h-3" /> {newOrders} UNCONFIRMED
              </span>
            )}
          </div>
          {urgentOrders.map((o, i) => {
            const sc = ORDER_STATUS_COLOR[o.status] || DIM;
            return (
              <div key={o.id} className="flex items-center justify-between px-3 py-2 border-b last:border-b-0"
                style={{ borderColor: DIMMER }}>
                <div>
                  <span className="text-[10px]" style={{ color: '#D8CFC0' }}>{o.tracking_code || 'ORDER'}</span>
                  <span className="text-[10px] ml-2" style={{ color: DIM }}>— {o.customer_handle}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[9px]" style={{ color: AMBER }}>{fmt(o.total_auec)} ¤</span>
                  <span className="text-[8px] px-2 py-0.5 tracking-[0.1em]"
                    style={{ color: sc, border: `1px solid ${sc}44`, background: `${sc}10` }}>
                    {o.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Op type breakdown */}
      {Object.keys(opBreakdown).length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.24 }}
          className="border p-3" style={PANEL}>
          <div className="text-[8px] tracking-[0.2em] mb-2" style={{ color: DIMMER }}>OPEN WORK ORDERS BY TYPE</div>
          <div className="flex flex-wrap gap-3">
            {Object.entries(opBreakdown).map(([type, count]) => (
              <div key={type} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-sm" style={{ background: OP_TYPE_COLOR[type] || DIM }} />
                <span className="text-[10px]" style={{ color: OP_TYPE_COLOR[type] || DIM }}>{type.toUpperCase()}</span>
                <span className="text-[10px] font-bold" style={{ color: '#D8CFC0' }}>{count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      <CommodityTrendChart />

      <div className="border p-2.5 text-[9px] flex items-start gap-2" style={PANEL}>
        <span style={{ color: AMBER }}>◈</span>
        <span style={{ color: DIM }}>Full detail → Management Console: Store · Orders · FairShare · Salvage · Ledger · Performance</span>
      </div>
    </div>
  );
}