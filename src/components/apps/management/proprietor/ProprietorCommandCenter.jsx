import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { updateOrderStatus } from '@/functions/updateOrderStatus';
import { publishLootItem } from '@/functions/publishLootItem';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import ProprietorAtmosphere from '@/components/apps/management/proprietor/ProprietorAtmosphere';
import MobileCommandRail from '@/components/apps/management/proprietor/MobileCommandRail';
import DayLoopRail from '@/components/apps/management/proprietor/watchfloor/DayLoopRail';
import SituationBoard from '@/components/apps/management/proprietor/watchfloor/SituationBoard';
import GaugeColumn from '@/components/apps/management/proprietor/watchfloor/GaugeColumn';
import WorkingPane from '@/components/apps/management/proprietor/watchfloor/WorkingPane';
import { buildSignals, gaugeModel } from '@/components/apps/management/proprietor/watchfloor/signals';

const STAGES = [
  { id: 'intake',  label: 'INTAKE',   glyph: '⬒' },
  { id: 'appraise',label: 'APPRAISE', glyph: '◈' },
  { id: 'list',    label: 'LIST',     glyph: '▤' },
  { id: 'fulfil',  label: 'FULFIL',   glyph: '➤', tone: 'hot' },
  { id: 'handoff', label: 'HAND OFF', glyph: '⇌', tone: 'hot' },
  { id: 'close',   label: 'CLOSE OUT',glyph: '⬛' },
  { id: 'systems', label: 'SYSTEMS',  glyph: '⚙' },
];

/**
 * The Watchfloor. One screen, no page scroll: the working day as a track along the top,
 * what is actually waiting on a decision down the left, the yard's vitals down the right,
 * and only the stage in hand mounted in the middle.
 */
export default function ProprietorCommandCenter() {
  const qc = useQueryClient();
  const [stage, setStage] = useState('fulfil');

  const { data: orders = [] } = useQuery({ queryKey: ['all_orders'], queryFn: async () => {
    const fresh = await base44.entities.order.list('-created_date', 100);
    // Keep the newer cached version of any order so stale list reads never
    // revert a status transition already confirmed by the server.
    const prev = qc.getQueryData(['all_orders']) || [];
    const prevMap = new Map(prev.map((o) => [o.id, o]));
    return fresh.map((o) => { const p = prevMap.get(o.id); return p && new Date(p.updated_date) > new Date(o.updated_date) ? p : o; });
  } });
  const { data: products = [] } = useQuery({ queryKey: ['products_admin'], queryFn: () => base44.entities.product.list('-updated_date', 300) });
  const { data: loot = [] } = useQuery({ queryKey: ['loot_command'], queryFn: () => base44.entities.loot_item.list('-created_date', 300) });
  const { data: restocks = [] } = useQuery({ queryKey: ['restock_command'], queryFn: () => base44.entities.restock_notify.list('-created_date', 100) });
  const { data: messages = [] } = useQuery({ queryKey: ['order_messages_command'], queryFn: () => base44.entities.order_message.list('-created_date', 50) });
  const { data: prices = [] } = useQuery({ queryKey: ['price_command'], queryFn: () => base44.entities.commodity_price.list('-synced_at', 100) });
  const { data: repairs = [] } = useQuery({ queryKey: ['repair_command'], queryFn: () => base44.entities.repair_log.list('-created_date', 200) });
  const { data: codes = [] } = useQuery({ queryKey: ['discount_codes_command'], queryFn: () => base44.entities.discount_code.list('-updated_date', 100) });
  const { data: logs = [] } = useQuery({ queryKey: ['ops_logs_command'], queryFn: () => base44.entities.ops_log.list('-created_date', 50) });
  const { data: ledger = [] } = useQuery({ queryKey: ['ledger_command'], queryFn: () => base44.entities.ledger_entry.list('-entry_date', 300) });
  const { data: invoices = [] } = useQuery({ queryKey: ['invoice_command'], queryFn: () => base44.entities.invoice.list('-created_date', 100) });

  const refresh = () => { qc.invalidateQueries({ queryKey: ['all_orders'] }); qc.invalidateQueries({ queryKey: ['loot_command'] }); qc.invalidateQueries({ queryKey: ['products_admin'] }); qc.invalidateQueries({ queryKey: ['products'] }); qc.invalidateQueries({ queryKey: ['repair_command'] }); qc.invalidateQueries({ queryKey: ['discount_codes_command'] }); qc.invalidateQueries({ queryKey: ['ops_logs_command'] }); qc.invalidateQueries({ queryKey: ['invoice_command'] }); };
  useEffect(() => {
    const unsubs = [base44.entities.order.subscribe(refresh), base44.entities.invoice.subscribe(refresh), base44.entities.loot_item.subscribe(refresh), base44.entities.product.subscribe(refresh)];
    return () => unsubs.forEach((u) => u?.());
  }, []);

  const status = useMutation({
    mutationFn: ({ id, next, trackingCode }) => updateOrderStatus({ order_id: id, status: next, tracking_code: trackingCode }),
    onSuccess: (res) => {
      // Write the server-returned order straight into the cache so the queue
      // updates instantly even if a list refetch races with stale reads.
      const updated = res?.data?.order;
      if (updated?.id) qc.setQueryData(['all_orders'], (old = []) => old.map((o) => (o.id === updated.id ? updated : o)));
      qc.invalidateQueries({ queryKey: ['loot_command'] }); qc.invalidateQueries({ queryKey: ['products_admin'] }); qc.invalidateQueries({ queryKey: ['products'] }); qc.invalidateQueries({ queryKey: ['invoice_command'] }); qc.invalidateQueries({ queryKey: ['ops_logs_command'] });
    },
    onError: (err, vars) => {
      const msg = err?.response?.data?.error || err?.message || '';
      if (msg.toLowerCase().includes('not found')) {
        qc.setQueryData(['all_orders'], (old = []) => old.filter((o) => o.id !== vars.id));
      }
      refresh();
    },
  });
  const price = useMutation({ mutationFn: ({ id, value }) => base44.entities.loot_item.update(id, { est_sell_auec: value }), onSuccess: refresh });
  const stock = useMutation({ mutationFn: ({ id, value }) => base44.entities.product.update(id, { stock: value }), onSuccess: refresh });
  const handoff = useMutation({ mutationFn: (o) => base44.entities.order.update(o.id, { handoff_status: 'confirmed', handoff_confirmed_time: o.handoff_proposed_time || '', handoff_confirmed_location: o.handoff_location || o.delivery_location || '', handoff_proprietor_note: 'Confirmed by proprietor command center.' }), onSuccess: refresh });
  const codeToggle = useMutation({ mutationFn: (code) => base44.entities.discount_code.update(code.id, { active: !code.active }), onSuccess: refresh });
  const publish = useMutation({ mutationFn: (item) => publishLootItem({ loot_item_id: item.id, price_auec: item.est_sell_auec, quantity: item.quantity || 1 }), onSuccess: refresh });

  const signals = useMemo(() => buildSignals({ orders, loot, products, restocks, messages, prices }), [orders, loot, products, restocks, messages, prices]);
  const gauges = useMemo(() => gaugeModel({ orders, ledger, products, loot, invoices }), [orders, ledger, products, loot, invoices]);
  const counts = useMemo(() => signals.reduce((acc, s) => ({ ...acc, [s.stage]: (acc[s.stage] || 0) + s.count }), {}), [signals]);

  const d = {
    orders, products, loot, restocks, messages, prices, repairs, codes, logs, ledger, invoices,
    onStatus: (id, next, trackingCode) => status.mutate({ id, next, trackingCode }),
    statusPending: status.isPending,
    statusError: status.error,
    lastSuccess: status.data?.data?.order ? `ORDER ${status.data.data.order.tracking_code || status.data.data.order.id} → ${(status.data.data.order.status || '').replace('_', ' ').toUpperCase()}${status.data.data.order.status === 'delivered' ? ' — INVOICE MARKED PAID' : ''}` : null,
    onApplyPrice: (id, value) => price.mutate({ id, value }),
    pricing: price.isPending,
    onPublish: (item) => publish.mutate(item),
    publishing: publish.isPending,
    onAdjustStock: (id, value) => stock.mutate({ id, value }),
    stockPending: stock.isPending,
    onConfirmHandoff: (o) => handoff.mutate(o),
    handoffPending: handoff.isPending,
    onToggleCode: (code) => codeToggle.mutate(code),
    codePending: codeToggle.isPending,
  };

  const activeStage = STAGES.find((s) => s.id === stage);

  return (
    <div className="relative h-full flex flex-col min-h-0 font-mono" style={{ background: '#080604' }}>
      <ProprietorAtmosphere />
      <div className="relative z-10 flex flex-col min-h-0 h-full p-3 gap-3">
        <DayLoopRail stages={STAGES} active={stage} onSelect={setStage} counts={counts} />

        <div className="flex-1 min-h-0 grid gap-3 lg:grid-cols-[260px_minmax(0,1fr)_210px]">
          <div className="hidden lg:block min-h-0">
            <SituationBoard signals={signals} onGo={setStage} activeStage={stage} />
          </div>

          <div
            className="min-h-0 flex flex-col"
            style={{ clipPath: 'polygon(9px 0, 100% 0, 100% calc(100% - 9px), calc(100% - 9px) 100%, 0 100%, 0 9px)', background: '#090705', boxShadow: 'inset 0 0 0 1px #2E2519' }}
          >
            <div className="flex items-center gap-2 px-3 py-2 shrink-0" style={{ background: 'linear-gradient(180deg,#1B1309,#0D0A07)', boxShadow: 'inset 0 -1px 0 #3A2F20' }}>
              <span className="text-[12px]" style={{ color: '#E0A22E', filter: 'drop-shadow(0 0 8px rgba(224,162,46,.5))' }}>{activeStage?.glyph}</span>
              <span className="text-[9px] font-bold tracking-[0.3em]" style={{ color: '#F0E7D6', textShadow: '0 0 12px rgba(224,162,46,.25)' }}>{activeStage?.label}</span>
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg,#3A2F20,transparent)' }} />
              <span className="text-[7px] tracking-[0.22em] tabular-nums" style={{ color: '#5F564A' }}>{counts[stage] || 0} WAITING</span>
            </div>
            <div className="flex-1 min-h-0 overflow-auto p-3">
              <WorkingPane stage={stage} d={d} />
            </div>
          </div>

          <div className="hidden lg:block min-h-0">
            <GaugeColumn g={gauges} />
          </div>
        </div>
      </div>
      <MobileCommandRail />
    </div>
  );
}