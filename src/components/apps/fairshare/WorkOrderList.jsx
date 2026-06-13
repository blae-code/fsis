import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, CheckCircle2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

const AMBER  = '#E0A22E';
const TEAL   = '#6FA08F';
const DIM    = '#7A6E60';
const DIMMER = '#3A3028';
const PANEL  = { background: '#0E0C09', borderColor: '#2A2118' };

const OP_COLOR = {
  salvage: AMBER, bounty: '#C05050', cargo: TEAL,
  piracy: '#9B6FC0', escort: '#6FA08F', other: DIM,
};

export function computePayout(order) {
  const gross = order.gross_auec || 0;
  const expensesTotal = (order.expenses || []).reduce((s, e) => s + (e.amount_auec || 0), 0);
  const net = gross - expensesTotal;
  const totalShares = (order.crew_shares || []).reduce((s, c) => s + (c.shares || 0), 0);
  const payouts = (order.crew_shares || []).map((c) => ({
    handle: c.handle,
    shares: c.shares,
    amount: totalShares > 0 ? (net * (c.shares || 0)) / totalShares : 0,
  }));
  return { gross, expensesTotal, net, totalShares, payouts };
}

function OrderCard({ order, onSettle, onDelete, onCopy, copied }) {
  const [expanded, setExpanded] = useState(false);
  const p = computePayout(order);
  const settled = order.status === 'settled';
  const opColor = OP_COLOR[order.op_type || 'other'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      className="border overflow-hidden"
      style={{ ...PANEL, borderColor: settled ? '#2A3A2A' : '#2A2118' }}
    >
      {/* Op-type accent bar */}
      <div className="h-0.5 w-full" style={{ background: opColor }} />

      <div className="px-3 py-2.5">
        {/* Header row */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {order.op_type && (
              <span className="text-[8px] font-bold px-1.5 py-0.5 tracking-[0.15em]"
                style={{ color: opColor, border: `1px solid ${opColor}44`, background: `${opColor}14` }}>
                {order.op_type.toUpperCase()}
              </span>
            )}
            <span className="text-xs font-bold truncate" style={{ color: '#D8CFC0' }}>{order.order_name}</span>
            <span className={`text-[8px] font-bold px-1.5 py-0.5 tracking-[0.1em] ${settled ? 'text-green-400' : ''}`}
              style={settled
                ? { border: '1px solid #4A8A4A55', background: '#4A8A4A18' }
                : { color: AMBER, border: `1px solid ${AMBER}44`, background: `${AMBER}14` }}>
              {settled ? 'SETTLED' : 'OPEN'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button onClick={() => onCopy(order)}
              className="flex items-center gap-1 px-2 py-1 text-[9px] border transition-colors"
              style={{ borderColor: DIMMER, color: copied ? AMBER : DIM }}>
              {copied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
              PAYOUT
            </button>
            {!settled && (
              <button onClick={() => onSettle(order.id)}
                className="flex items-center gap-1 px-2 py-1 text-[9px] border transition-colors"
                style={{ borderColor: `${AMBER}44`, color: AMBER, background: `${AMBER}0E` }}>
                <CheckCircle2 className="w-2.5 h-2.5" /> SETTLE
              </button>
            )}
            <button onClick={() => onDelete(order.id)} style={{ color: DIM }}
              className="hover:text-red-500 transition-colors p-1">
              <Trash2 className="w-3 h-3" />
            </button>
            <button onClick={() => setExpanded(!expanded)} style={{ color: DIM }} className="p-1">
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        {/* Finance summary */}
        <div className="grid grid-cols-3 gap-2 mt-2">
          {[
            { label: 'GROSS', value: p.gross.toLocaleString(), color: '#D8CFC0' },
            { label: 'EXPENSES', value: `-${p.expensesTotal.toLocaleString()}`, color: '#C05050' },
            { label: 'NET', value: p.net.toLocaleString(), color: AMBER },
          ].map(({ label, value, color }) => (
            <div key={label} className="border px-2 py-1.5 text-center"
              style={{ borderColor: DIMMER, background: '#0A0806' }}>
              <div className="text-[7px] tracking-[0.18em]" style={{ color: DIMMER }}>{label}</div>
              <div className="text-[11px] font-bold font-mono mt-0.5" style={{ color }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Expanded: per-crew payouts + expenses */}
      <AnimatePresence>
        {expanded && p.payouts.length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
            className="border-t overflow-hidden" style={{ borderColor: '#2A2118' }}>
            <div className="px-3 py-2 space-y-1">
              <div className="text-[8px] tracking-[0.18em] mb-1.5" style={{ color: DIMMER }}>CREW PAYOUT BREAKDOWN</div>
              {p.payouts.map((x, i) => (
                <div key={i} className="flex justify-between items-center px-2 py-1"
                  style={{ background: '#0A0806', borderLeft: `2px solid ${AMBER}44` }}>
                  <span className="text-[10px]" style={{ color: '#D8CFC0' }}>
                    {x.handle} <span style={{ color: DIM }}>({x.shares} sh)</span>
                  </span>
                  <span className="text-[11px] font-bold font-mono" style={{ color: AMBER }}>
                    {Math.round(x.amount).toLocaleString()} aUEC
                  </span>
                </div>
              ))}
              {(order.expenses || []).length > 0 && (
                <div className="mt-2 space-y-0.5">
                  <div className="text-[8px] tracking-[0.18em]" style={{ color: DIMMER }}>EXPENSES</div>
                  {order.expenses.map((e, i) => (
                    <div key={i} className="flex justify-between text-[9px]" style={{ color: DIM }}>
                      <span>{e.label}</span>
                      <span style={{ color: '#C05050' }}>-{(e.amount_auec || 0).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function WorkOrderList() {
  const queryClient = useQueryClient();
  const [copiedId, setCopiedId] = useState(null);

  const { data: orders = [] } = useQuery({
    queryKey: ['work_orders'],
    queryFn: () => base44.entities.work_order.list('-created_date', 50),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.work_order.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['work_orders'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.work_order.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['work_orders'] }),
  });

  const copyPayout = (order) => {
    const p = computePayout(order);
    const lines = [
      `FSIS FairShare Payout — ${order.order_name}`,
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      `Gross: ${p.gross.toLocaleString()} aUEC`,
      ...((order.expenses || []).map((e) => `Expense — ${e.label}: -${(e.amount_auec || 0).toLocaleString()} aUEC`)),
      `Net: ${p.net.toLocaleString()} aUEC`,
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      ...p.payouts.map((x) => `${x.handle} (${x.shares} sh): ${Math.round(x.amount).toLocaleString()} aUEC`),
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
      '"Every credit accounted for."',
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedId(order.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openOrders    = orders.filter((o) => o.status !== 'settled');
  const settledOrders = orders.filter((o) => o.status === 'settled');

  return (
    <div className="space-y-3 font-mono">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'TOTAL ORDERS', value: orders.length, color: '#D8CFC0' },
          { label: 'OPEN', value: openOrders.length, color: AMBER },
          { label: 'SETTLED', value: settledOrders.length, color: '#7BA05B' },
        ].map((s) => (
          <div key={s.label} className="border px-3 py-2 text-center" style={PANEL}>
            <div className="text-[8px] tracking-[0.15em]" style={{ color: DIM }}>{s.label}</div>
            <div className="text-lg font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="text-[9px] tracking-[0.18em]" style={{ color: DIM }}>
        WORK ORDERS ({orders.length})
      </div>

      {orders.length === 0 ? (
        <div className="border py-10 text-center" style={PANEL}>
          <div className="text-[10px]" style={{ color: DIM }}>No work orders logged yet.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              copied={copiedId === order.id}
              onCopy={copyPayout}
              onSettle={(id) => updateMutation.mutate({ id, data: { status: 'settled' } })}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}