import React from 'react';
import { base44 } from '@/api/base44Client';
import { publishLootItem } from '@/functions/publishLootItem';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import GearLogForm from '@/components/apps/loot/dashboard/GearLogForm';
import GearItemRow from '@/components/apps/loot/dashboard/GearItemRow';
import GearMetrics from '@/components/apps/loot/dashboard/GearMetrics';

export default function LootGearDashboard() {
  const queryClient = useQueryClient();
  const { data: items = [], isLoading } = useQuery({ queryKey: ['loot_gear_dashboard'], queryFn: () => base44.entities.loot_item.list('-created_date', 500) });
  const invalidate = () => { queryClient.invalidateQueries({ queryKey: ['loot_gear_dashboard'] }); queryClient.invalidateQueries({ queryKey: ['loot_items_queue'] }); };
  const create = useMutation({ mutationFn: (data) => base44.entities.loot_item.create(data), onSuccess: invalidate });
  const publish = useMutation({ mutationFn: (item) => publishLootItem({ loot_item_id: item.id, price_auec: item.est_sell_auec, quantity: item.quantity || 1 }), onSuccess: () => { invalidate(); queryClient.invalidateQueries({ queryKey: ['products'] }); } });
  return (
    <div className="h-full overflow-y-auto p-4 space-y-4 font-mono" style={{ background: '#0C0B0A' }}>
      <div>
        <p className="text-[9px] tracking-[0.28em]" style={{ color: '#8A8F45' }}>// RECOVERED ITEM SALES DESK</p>
        <h2 className="text-lg font-bold tracking-[0.16em]" style={{ color: '#EDE5D6' }}>LOOTED GEAR DASHBOARD</h2>
        <p className="text-[10px]" style={{ color: '#9C9080' }}>Log type, condition, and estimated market value, then publish ready items to the storefront.</p>
      </div>
      <GearMetrics items={items} />
      <GearLogForm onCreate={(data) => create.mutate(data)} pending={create.isPending} />
      <div className="space-y-1.5">
        <div className="text-[9px] tracking-[0.2em]" style={{ color: '#C8A05B' }}>GEAR INVENTORY</div>
        {isLoading ? <div className="text-[10px]" style={{ color: '#7A6E60' }}>Loading recovered gear...</div> : items.length === 0 ? <div className="border p-8 text-center text-[10px]" style={{ borderColor: '#2A2118', color: '#7A6E60' }}>No recovered gear logged yet.</div> : items.map((item) => <GearItemRow key={item.id} item={item} onPublish={(row) => publish.mutate(row)} publishing={publish.isPending} />)}
      </div>
    </div>
  );
}