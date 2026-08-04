import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ConsoleFold from '@/components/console/ConsoleFold';
import RapidLootIntakePanel from '@/components/apps/management/proprietor/RapidLootIntakePanel';
import InventoryReconciliationPanel from '@/components/apps/management/proprietor/InventoryReconciliationPanel';
import LootAppraisalDesk from '@/components/apps/management/proprietor/LootAppraisalDesk';
import ProfitLifecyclePanel from '@/components/apps/management/proprietor/ProfitLifecyclePanel';
import MarginWatchPanel from '@/components/apps/management/proprietor/MarginWatchPanel';
import DemandIntelligence from '@/components/apps/management/proprietor/DemandIntelligence';
import DemandRelistPanel from '@/components/apps/management/proprietor/DemandRelistPanel';
import PrivateCodeConsole from '@/components/apps/management/proprietor/PrivateCodeConsole';
import MaintenanceModePanel from '@/components/apps/management/proprietor/MaintenanceModePanel';
import FulfillmentQueue from '@/components/apps/management/proprietor/FulfillmentQueue';
import OrderSlaPanel from '@/components/apps/management/proprietor/OrderSlaPanel';
import CommandInboxPanel from '@/components/apps/management/proprietor/CommandInboxPanel';
import ProprietorAlerts from '@/components/apps/management/proprietor/ProprietorAlerts';
import HandoffSchedulerConsole from '@/components/apps/management/proprietor/HandoffSchedulerConsole';
import RouteClusterPanel from '@/components/apps/management/proprietor/RouteClusterPanel';
import WarehouseCommandLayer from '@/components/apps/management/proprietor/WarehouseCommandLayer';
import LedgerSyncPanel from '@/components/apps/management/proprietor/LedgerSyncPanel';
import InvoiceLedgerPanel from '@/components/apps/management/proprietor/InvoiceLedgerPanel';
import WeeklyPerformanceSummaryPanel from '@/components/apps/management/proprietor/WeeklyPerformanceSummaryPanel';
import PaydayManagementPanel from '@/components/apps/management/PaydayManagementPanel';
import BuyerLedger from '@/components/apps/management/proprietor/BuyerLedger';
import ClientHistoryPanel from '@/components/apps/management/proprietor/ClientHistoryPanel';
import DailyCloseoutPanel from '@/components/apps/management/proprietor/DailyCloseoutPanel';
import OpsAuditMini from '@/components/apps/management/proprietor/OpsAuditMini';
import PatchTransitionPanel from '@/components/apps/management/proprietor/PatchTransitionPanel';
import MarketSyncHealthPanel from '@/components/apps/management/proprietor/MarketSyncHealthPanel';
import OpsAssistantPanel from '@/components/apps/management/proprietor/OpsAssistantPanel';
import ProprietorTriageBoard from '@/components/apps/management/proprietor/ProprietorTriageBoard';
import ProprietorQuickActions from '@/components/apps/management/proprietor/ProprietorQuickActions';
import LaunchReadinessPanel from '@/components/apps/management/proprietor/LaunchReadinessPanel';
import DebugLogPanel from '@/components/apps/management/proprietor/DebugLogPanel';

/** Only the stage in hand is mounted — the deck holds forty tools, the screen holds six. */
export default function WorkingPane({ stage, d }) {
  const body = () => {
    switch (stage) {
      case 'intake':
        return (
          <>
            <RapidLootIntakePanel />
            <InventoryReconciliationPanel products={d.products} onAdjust={d.onAdjustStock} pending={d.stockPending} />
            <ConsoleFold label="DEMAND — WHAT BUYERS ARE ASKING FOR"><DemandIntelligence products={d.products} restocks={d.restocks} /></ConsoleFold>
          </>
        );
      case 'appraise':
        return (
          <>
            <LootAppraisalDesk loot={d.loot} onApplyPrice={d.onApplyPrice} onPublish={d.onPublish} pricing={d.pricing} publishing={d.publishing} />
            <ConsoleFold label="MARGIN WATCH — PRICE AGAINST THE MARKET"><MarginWatchPanel products={d.products} prices={d.prices} /></ConsoleFold>
            <ConsoleFold label="PROFIT LIFECYCLE — RECOVERY TO SALE"><ProfitLifecyclePanel loot={d.loot} repairs={d.repairs} products={d.products} /></ConsoleFold>
          </>
        );
      case 'list':
        return (
          <>
            <DemandRelistPanel restocks={d.restocks} loot={d.loot} />
            <div className="grid xl:grid-cols-2 gap-3">
              <PrivateCodeConsole codes={d.codes} onToggle={d.onToggleCode} pending={d.codePending} />
              <MaintenanceModePanel />
            </div>
          </>
        );
      case 'fulfil':
        return (
          <>
            <FulfillmentQueue orders={d.orders} onStatus={d.onStatus} pending={d.statusPending} error={d.statusError} lastSuccess={d.lastSuccess} />
            <OrderSlaPanel orders={d.orders} />
            <ConsoleFold label="INBOX & ALERTS — WHAT BUYERS AND THE YARD ARE SAYING">
              <div className="grid xl:grid-cols-2 gap-3">
                <CommandInboxPanel orders={d.orders} products={d.products} loot={d.loot} messages={d.messages} restocks={d.restocks} prices={d.prices} />
                <ProprietorAlerts orders={d.orders} loot={d.loot} messages={d.messages} products={d.products} prices={d.prices} />
              </div>
            </ConsoleFold>
          </>
        );
      case 'handoff':
        return (
          <>
            <HandoffSchedulerConsole orders={d.orders} onConfirm={d.onConfirmHandoff} pending={d.handoffPending} />
            <RouteClusterPanel orders={d.orders} />
            <ConsoleFold label="WAREHOUSE & CARGO — BAYS, CRATES, SCU FIT"><WarehouseCommandLayer orders={d.orders} /></ConsoleFold>
          </>
        );
      case 'close':
        return (
          <>
            <DailyCloseoutPanel orders={d.orders} messages={d.messages} />
            <div className="grid xl:grid-cols-2 gap-3">
              <LedgerSyncPanel entries={d.ledger} />
              <BuyerLedger orders={d.orders} />
            </div>
            <ConsoleFold label="INVOICES ISSUED"><InvoiceLedgerPanel invoices={d.invoices} /></ConsoleFold>
            <ConsoleFold label="WEEKLY PERFORMANCE"><WeeklyPerformanceSummaryPanel /></ConsoleFold>
            <ConsoleFold label="PAYDAY CYCLE"><PaydayManagementPanel /></ConsoleFold>
            <ConsoleFold label="CLIENT HISTORY"><ClientHistoryPanel orders={d.orders} products={d.products} /></ConsoleFold>
            <ConsoleFold label="AUDIT — RECENT ACTS"><OpsAuditMini logs={d.logs} /></ConsoleFold>
          </>
        );
      case 'systems':
      default:
        return (
          <>
            <PatchTransitionPanel />
            <div className="grid xl:grid-cols-2 gap-3">
              <OpsAssistantPanel />
              <ProprietorTriageBoard orders={d.orders} messages={d.messages} loot={d.loot} products={d.products} />
            </div>
            <div className="grid xl:grid-cols-2 gap-3">
              <MarketSyncHealthPanel prices={d.prices} />
              <ProprietorQuickActions />
            </div>
            <ConsoleFold label="LAUNCH READINESS"><LaunchReadinessPanel orders={d.orders} products={d.products} loot={d.loot} prices={d.prices} messages={d.messages} /></ConsoleFold>
            <ConsoleFold label="DIAGNOSTICS"><DebugLogPanel /></ConsoleFold>
          </>
        );
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={stage}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.16 }}
        className="space-y-3"
      >
        {body()}
      </motion.div>
    </AnimatePresence>
  );
}