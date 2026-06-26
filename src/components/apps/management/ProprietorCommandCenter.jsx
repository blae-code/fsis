import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { updateOrderStatus } from '@/functions/updateOrderStatus';
import { publishLootItem } from '@/functions/publishLootItem';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import CommandKpiStrip from '@/components/apps/management/proprietor/CommandKpiStrip';
import FulfillmentQueue from '@/components/apps/management/proprietor/FulfillmentQueue';
import LootAppraisalDesk from '@/components/apps/management/proprietor/LootAppraisalDesk';
import BuyerLedger from '@/components/apps/management/proprietor/BuyerLedger';
import DemandIntelligence from '@/components/apps/management/proprietor/DemandIntelligence';
import ProprietorAlerts from '@/components/apps/management/proprietor/ProprietorAlerts';
import HandoffSchedulerConsole from '@/components/apps/management/proprietor/HandoffSchedulerConsole';
import InventoryReconciliationPanel from '@/components/apps/management/proprietor/InventoryReconciliationPanel';
import ProfitLifecyclePanel from '@/components/apps/management/proprietor/ProfitLifecyclePanel';
import ProprietorQuickActions from '@/components/apps/management/proprietor/ProprietorQuickActions';
import DailyCloseoutPanel from '@/components/apps/management/proprietor/DailyCloseoutPanel';
import MarginWatchPanel from '@/components/apps/management/proprietor/MarginWatchPanel';
import PrivateCodeConsole from '@/components/apps/management/proprietor/PrivateCodeConsole';
import OpsAuditMini from '@/components/apps/management/proprietor/OpsAuditMini';
import ProprietorTriageBoard from '@/components/apps/management/proprietor/ProprietorTriageBoard';
import LedgerSyncPanel from '@/components/apps/management/proprietor/LedgerSyncPanel';
import RouteClusterPanel from '@/components/apps/management/proprietor/RouteClusterPanel';
import DemandRelistPanel from '@/components/apps/management/proprietor/DemandRelistPanel';
import RapidLootIntakePanel from '@/components/apps/management/proprietor/RapidLootIntakePanel';
import MarketSyncHealthPanel from '@/components/apps/management/proprietor/MarketSyncHealthPanel';

export default function ProprietorCommandCenter() {
  const qc = useQueryClient();
  const { data: orders = [] } = useQuery({ queryKey: ['all_orders'], queryFn: () => base44.entities.order.list('-created_date', 100) });
  const { data: products = [] } = useQuery({ queryKey: ['products_admin'], queryFn: () => base44.entities.product.list('-updated_date', 300) });
  const { data: loot = [] } = useQuery({ queryKey: ['loot_command'], queryFn: () => base44.entities.loot_item.list('-created_date', 300) });
  const { data: restocks = [] } = useQuery({ queryKey: ['restock_command'], queryFn: () => base44.entities.restock_notify.list('-created_date', 100) });
  const { data: messages = [] } = useQuery({ queryKey: ['order_messages_command'], queryFn: () => base44.entities.order_message.list('-created_date', 50) });
  const { data: prices = [] } = useQuery({ queryKey: ['price_command'], queryFn: () => base44.entities.commodity_price.list('-synced_at', 100) });
  const { data: repairs = [] } = useQuery({ queryKey: ['repair_command'], queryFn: () => base44.entities.repair_log.list('-created_date', 200) });
  const { data: codes = [] } = useQuery({ queryKey: ['discount_codes_command'], queryFn: () => base44.entities.discount_code.list('-updated_date', 100) });
  const { data: logs = [] } = useQuery({ queryKey: ['ops_logs_command'], queryFn: () => base44.entities.ops_log.list('-created_date', 50) });
  const { data: ledger = [] } = useQuery({ queryKey: ['ledger_command'], queryFn: () => base44.entities.ledger_entry.list('-entry_date', 300) });
  const refresh = () => { qc.invalidateQueries({ queryKey: ['all_orders'] }); qc.invalidateQueries({ queryKey: ['loot_command'] }); qc.invalidateQueries({ queryKey: ['products_admin'] }); qc.invalidateQueries({ queryKey: ['products'] }); qc.invalidateQueries({ queryKey: ['repair_command'] }); qc.invalidateQueries({ queryKey: ['discount_codes_command'] }); qc.invalidateQueries({ queryKey: ['ops_logs_command'] }); };
  useEffect(() => {
    const unsubs = [base44.entities.order.subscribe(refresh), base44.entities.loot_item.subscribe(refresh), base44.entities.product.subscribe(refresh)];
    return () => unsubs.forEach((u) => u?.());
  }, []);
  const status = useMutation({ mutationFn: ({ id, next }) => updateOrderStatus({ order_id: id, status: next }), onSuccess: refresh });
  const price = useMutation({ mutationFn: ({ id, value }) => base44.entities.loot_item.update(id, { est_sell_auec: value }), onSuccess: refresh });
  const stock = useMutation({ mutationFn: ({ id, value }) => base44.entities.product.update(id, { stock: value }), onSuccess: refresh });
  const handoff = useMutation({ mutationFn: (o) => base44.entities.order.update(o.id, { handoff_status: 'confirmed', handoff_confirmed_time: o.handoff_proposed_time || '', handoff_confirmed_location: o.handoff_location || o.delivery_location || '', handoff_proprietor_note: 'Confirmed by proprietor command center.' }), onSuccess: refresh });
  const codeToggle = useMutation({ mutationFn: (code) => base44.entities.discount_code.update(code.id, { active: !code.active }), onSuccess: refresh });
  const publish = useMutation({ mutationFn: (item) => publishLootItem({ loot_item_id: item.id, price_auec: item.est_sell_auec, quantity: item.quantity || 1 }), onSuccess: refresh });
  return (
    <div className="h-full overflow-auto p-4 space-y-4 font-mono" style={{ background: '#080604' }}>
      <div className="border p-4" style={{ borderColor: '#5C4424', background: 'linear-gradient(135deg,#14110D,#0C0A07)', clipPath: 'polygon(16px 0,100% 0,100% calc(100% - 16px),calc(100% - 16px) 100%,0 100%,0 16px)' }}><p className="text-[9px] tracking-[0.3em]" style={{ color: '#8A8F45' }}>// SOLO PROPRIETOR OPERATING SYSTEM</p><h2 className="text-xl font-bold tracking-[0.16em]" style={{ color: '#EDE5D6' }}>PROPRIETOR COMMAND CENTER</h2><p className="text-[10px] mt-1" style={{ color: '#9C9080' }}>One desk for fulfillment, resale appraisal, inventory demand, buyer history, pricing rules, and alerts.</p></div>
      <CommandKpiStrip orders={orders} products={products} loot={loot} />
      <RapidLootIntakePanel />
      <div className="grid xl:grid-cols-[1fr_1fr] gap-4"><ProprietorTriageBoard orders={orders} messages={messages} loot={loot} products={products} /><DailyCloseoutPanel orders={orders} messages={messages} /></div>
      <div className="grid xl:grid-cols-[1fr_1fr] gap-4"><MarginWatchPanel products={products} prices={prices} /><LedgerSyncPanel entries={ledger} /></div>
      <div className="grid xl:grid-cols-[1.1fr_1fr] gap-4"><FulfillmentQueue orders={orders} onStatus={(id, next) => status.mutate({ id, next })} pending={status.isPending} /><ProprietorAlerts orders={orders} loot={loot} messages={messages} products={products} prices={prices} /></div>
      <div className="grid xl:grid-cols-[1fr_1fr] gap-4"><HandoffSchedulerConsole orders={orders} onConfirm={(o) => handoff.mutate(o)} pending={handoff.isPending} /><RouteClusterPanel orders={orders} /></div>
      <div className="grid xl:grid-cols-[1fr_1fr] gap-4"><InventoryReconciliationPanel products={products} onAdjust={(id, value) => stock.mutate({ id, value })} pending={stock.isPending} /><DemandRelistPanel restocks={restocks} loot={loot} /></div>
      <div className="grid xl:grid-cols-[1.2fr_0.8fr] gap-4"><LootAppraisalDesk loot={loot} onApplyPrice={(id, value) => price.mutate({ id, value })} onPublish={(item) => publish.mutate(item)} pricing={price.isPending} publishing={publish.isPending} /><BuyerLedger orders={orders} /></div>
      <div className="grid xl:grid-cols-[1fr_1fr] gap-4"><ProfitLifecyclePanel loot={loot} repairs={repairs} products={products} /><div className="space-y-4"><MarketSyncHealthPanel prices={prices} /><ProprietorQuickActions /></div></div>
      <div className="grid xl:grid-cols-[1fr_1fr] gap-4"><PrivateCodeConsole codes={codes} onToggle={(code) => codeToggle.mutate(code)} pending={codeToggle.isPending} /><OpsAuditMini logs={logs} /></div>
      <DemandIntelligence products={products} restocks={restocks} />
    </div>
  );
}