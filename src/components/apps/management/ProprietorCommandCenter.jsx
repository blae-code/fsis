import React from 'react';
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

export default function ProprietorCommandCenter() {
  const qc = useQueryClient();
  const { data: orders = [] } = useQuery({ queryKey: ['all_orders'], queryFn: () => base44.entities.order.list('-created_date', 100) });
  const { data: products = [] } = useQuery({ queryKey: ['products_admin'], queryFn: () => base44.entities.product.list('-updated_date', 300) });
  const { data: loot = [] } = useQuery({ queryKey: ['loot_command'], queryFn: () => base44.entities.loot_item.list('-created_date', 300) });
  const { data: restocks = [] } = useQuery({ queryKey: ['restock_command'], queryFn: () => base44.entities.restock_notify.list('-created_date', 100) });
  const { data: messages = [] } = useQuery({ queryKey: ['order_messages_command'], queryFn: () => base44.entities.order_message.list('-created_date', 50) });
  const { data: prices = [] } = useQuery({ queryKey: ['price_command'], queryFn: () => base44.entities.commodity_price.list('-synced_at', 100) });
  const refresh = () => { qc.invalidateQueries({ queryKey: ['all_orders'] }); qc.invalidateQueries({ queryKey: ['loot_command'] }); qc.invalidateQueries({ queryKey: ['products_admin'] }); qc.invalidateQueries({ queryKey: ['products'] }); };
  const status = useMutation({ mutationFn: ({ id, next }) => updateOrderStatus({ order_id: id, status: next }), onSuccess: refresh });
  const price = useMutation({ mutationFn: ({ id, value }) => base44.entities.loot_item.update(id, { est_sell_auec: value }), onSuccess: refresh });
  const publish = useMutation({ mutationFn: (item) => publishLootItem({ loot_item_id: item.id, price_auec: item.est_sell_auec, quantity: item.quantity || 1 }), onSuccess: refresh });
  return (
    <div className="h-full overflow-auto p-4 space-y-4 font-mono" style={{ background: '#080604' }}>
      <div className="border p-4" style={{ borderColor: '#5C4424', background: 'linear-gradient(135deg,#14110D,#0C0A07)', clipPath: 'polygon(16px 0,100% 0,100% calc(100% - 16px),calc(100% - 16px) 100%,0 100%,0 16px)' }}><p className="text-[9px] tracking-[0.3em]" style={{ color: '#8A8F45' }}>// SOLO PROPRIETOR OPERATING SYSTEM</p><h2 className="text-xl font-bold tracking-[0.16em]" style={{ color: '#EDE5D6' }}>PROPRIETOR COMMAND CENTER</h2><p className="text-[10px] mt-1" style={{ color: '#9C9080' }}>One desk for fulfillment, resale appraisal, inventory demand, buyer history, pricing rules, and alerts.</p></div>
      <CommandKpiStrip orders={orders} products={products} loot={loot} />
      <div className="grid xl:grid-cols-[1.1fr_1fr] gap-4"><FulfillmentQueue orders={orders} onStatus={(id, next) => status.mutate({ id, next })} pending={status.isPending} /><ProprietorAlerts orders={orders} loot={loot} messages={messages} products={products} prices={prices} /></div>
      <div className="grid xl:grid-cols-[1.2fr_0.8fr] gap-4"><LootAppraisalDesk loot={loot} onApplyPrice={(id, value) => price.mutate({ id, value })} onPublish={(item) => publish.mutate(item)} pricing={price.isPending} publishing={publish.isPending} /><BuyerLedger orders={orders} /></div>
      <DemandIntelligence products={products} restocks={restocks} />
    </div>
  );
}