import React from 'react';
import ConsoleFold from '@/components/console/ConsoleFold';
import ScanDesk from '@/components/apps/management/scan/ScanDesk';
import RapidLootIntakePanel from '@/components/apps/management/proprietor/RapidLootIntakePanel';
import WarehouseCommandLayer from '@/components/apps/management/proprietor/WarehouseCommandLayer';
import StationSweepPanel from '@/components/apps/management/inventory/StationSweepPanel';
import StockByClassPanel from '@/components/apps/management/inventory/StockByClassPanel';
import StockBySizePanel from '@/components/apps/management/inventory/StockBySizePanel';
import InventoryManager from '@/components/apps/management/InventoryManager';
import SalvageProfitDashboard from '@/components/apps/management/SalvageProfitDashboard';
import SalvageCommodityDashboard from '@/components/apps/management/SalvageCommodityDashboard';
import LootSummaryTab from '@/components/loot/LootSummaryTab';
import RefineryConsole from '@/components/apps/management/processing/RefineryConsole';
import FabQueueConsole from '@/components/apps/management/fab/FabQueueConsole';

/** Only the desk in hand is mounted — the rest of the floor costs nothing while it waits. */
export default function YardDesk({ desk }) {
  if (desk === 'scan') return <ScanDesk />;
  if (desk === 'intake') return <RapidLootIntakePanel />;
  if (desk === 'warehouse') return <WarehouseCommandLayer />;
  if (desk === 'inventory') {
    return (
      <div className="space-y-4">
        <StationSweepPanel />
        <ConsoleFold label="STOCK ROLLUPS — BY CLASS & SIZE">
          <StockByClassPanel />
          <StockBySizePanel />
        </ConsoleFold>
        <InventoryManager />
      </div>
    );
  }
  if (desk === 'salvage') {
    return (
      <div className="space-y-4">
        <SalvageProfitDashboard />
        <ConsoleFold label="COMMODITY YIELD — SCU HARVESTED & SESSIONS">
          <SalvageCommodityDashboard />
        </ConsoleFold>
        <ConsoleFold label="LOOT SUMMARY — WHAT THE HAULS ADDED UP TO">
          <LootSummaryTab />
        </ConsoleFold>
      </div>
    );
  }
  if (desk === 'refining') return <RefineryConsole />;
  return <FabQueueConsole />;
}