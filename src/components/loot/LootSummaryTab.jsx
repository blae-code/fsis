import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import LootSummaryDashboard from '@/components/loot/LootSummaryDashboard';

/** Management Console tab wrapper — fetches loot items and renders the
 *  LootTracker Summary dashboard (Space Utilization, sales, values). */
export default function LootSummaryTab() {
  const { data: items = [] } = useQuery({
    queryKey: ['loot_tracker_items'],
    queryFn: () => base44.entities.loot_item.list('-created_date', 500),
  });
  return (
    <div className="p-4 font-mono">
      <div className="flex items-center gap-2 text-[10px] tracking-[0.22em]" style={{ color: '#E0A22E' }}>
        <span>◔</span> LOOTTRACKER SUMMARY
        <span className="text-[8px]" style={{ color: '#7A6E60' }}>WAREHOUSE VALUE · TOP SELLERS · SPACE UTILIZATION</span>
      </div>
      <LootSummaryDashboard lootItems={items} />
    </div>
  );
}