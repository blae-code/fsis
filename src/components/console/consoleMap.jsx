import React from 'react';
import { Command, Scale, Store, Boxes, HardHat } from 'lucide-react';

import ProprietorCommandCenter from '@/components/apps/management/proprietor/ProprietorCommandCenter';
import CouncilReviewQueue from '@/components/apps/management/review/CouncilReviewQueue';
import OpsCommandDeck from '@/components/apps/management/OpsCommandDeck';
import OpsAuditLog from '@/components/apps/management/OpsAuditLog';
import ManagementView from '@/components/apps/station/ManagementView';
import TradeConsole from '@/components/apps/management/trade/TradeConsole';
import YardConsole from '@/components/apps/management/yard/YardConsole';
import TaskWorkOrderConsole from '@/components/apps/management/tasks/TaskWorkOrderConsole';
import LabourCostPanel from '@/components/apps/management/tasks/LabourCostPanel';
import RunConsole from '@/components/apps/management/runs/RunConsole';
import RunProfitChart from '@/components/apps/management/runs/RunProfitChart';
import PaydayManagementPanel from '@/components/apps/management/PaydayManagementPanel';
import AccessConsole from '@/components/apps/management/access/AccessConsole';
import CollectionsPanel from '@/components/apps/management/hall/CollectionsPanel';
import HallDisputePanel from '@/components/apps/management/hall/HallDisputePanel';
import BuybackDesk from '@/components/apps/management/hall/BuybackDesk';
import AssetLibraryPanel from '@/components/apps/management/assets/AssetLibraryPanel';
import ConsoleFold from '@/components/console/ConsoleFold';

/**
 * The whole council console, grouped by what the work actually is rather than
 * one flat rail of 24 tabs. Every group is council standing; the one owner-only
 * act (granting standing) is enforced inside the STANDING section itself.
 */
export const CONSOLE_GROUPS = [
  {
    id: 'command', label: 'COMMAND', icon: Command,
    blurb: 'The state of the yard, and everything waiting on an answer.',
    sections: [
      { id: 'centre',   label: 'COMMAND CENTRE', glyph: '◈', bare: true, render: () => <ProprietorCommandCenter /> },
      { id: 'review',   label: 'REVIEW QUEUE',   glyph: '⚖', bare: true, render: () => <CouncilReviewQueue /> },
      {
        id: 'opsdeck', label: 'OPS DECK', glyph: '◉', bare: true,
        render: () => (
          <div className="h-full flex flex-col min-h-0">
            <div className="flex-1 min-h-0"><OpsCommandDeck /></div>
            <div className="shrink-0 px-3 pb-3 space-y-2 max-h-[45%] overflow-auto">
              <ConsoleFold label="YARD OVERVIEW — KPIs & STATUS ALERTS"><ManagementView /></ConsoleFold>
              <ConsoleFold label="AUDIT LOG — EVERY ACT ON THE RECORD"><OpsAuditLog /></ConsoleFold>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: 'trade', label: 'TRADE', icon: Store,
    blurb: 'The storefront side of the house — catalogue, orders and market.',
    sections: [
      { id: 'desk', label: 'TRADE DESK', glyph: '⬡', bare: true, render: () => <TradeConsole /> },
    ],
  },
  {
    id: 'yard', label: 'YARD', icon: Boxes,
    blurb: 'What comes in, where it sits, and what it is worth.',
    sections: [
      { id: 'floor', label: 'YARD FLOOR', glyph: '▦', bare: true, render: () => <YardConsole /> },
    ],
    links: [
      { to: '/loot', label: 'LOOT TRACKER ↗' },
    ],
  },
  {
    id: 'labour', label: 'LABOUR', icon: HardHat,
    blurb: 'Work posted, runs flown, shares paid, standing held.',
    sections: [
      { id: 'tasks',    label: 'TASKS',    glyph: '⌗', bare: true, render: () => <div className="space-y-4"><div className="p-4 pb-0"><ConsoleFold label="LABOUR COST — OUTSTANDING PAYOUT OBLIGATIONS"><LabourCostPanel /></ConsoleFold></div><TaskWorkOrderConsole /></div> },
      { id: 'runs',     label: 'RUNS',     glyph: '◎', bare: true, render: () => <div className="space-y-4"><div className="p-4 pb-0"><ConsoleFold label="RUN PROFIT — HAUL VALUE & MARGINS"><RunProfitChart /></ConsoleFold></div><RunConsole /></div> },
      { id: 'payday',   label: 'PAYDAY',   glyph: '◉', bare: true, render: () => <PaydayManagementPanel /> },
      { id: 'standing', label: 'STANDING', glyph: '✶', bare: true, render: () => <AccessConsole /> },
    ],
    links: [
      { to: '/work', label: 'WORK BOARD ↗' },
    ],
  },
  {
    id: 'hall', label: 'HALL', icon: Scale,
    blurb: 'The trading hall — settlements, disputes, buybacks and the site itself.',
    sections: [
      { id: 'collections', label: 'COLLECTIONS', glyph: '⚖', render: () => <CollectionsPanel /> },
      { id: 'disputes',    label: 'DISPUTES',    glyph: '⚑', render: () => <HallDisputePanel /> },
      { id: 'buyback',     label: 'BUYBACK',     glyph: '◆', render: () => <BuybackDesk /> },
      { id: 'assets',      label: 'ASSETS',      glyph: '▨', render: () => <AssetLibraryPanel /> },
    ],
    links: [
      { to: '/hall', label: 'PUBLIC HALL ↗' },
    ],
  },
];