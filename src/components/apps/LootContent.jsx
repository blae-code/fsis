import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LootManifest from '@/components/apps/loot/LootManifest';
import RepairROI from '@/components/apps/loot/RepairROI';
import LootInventoryAging from '@/components/apps/loot/LootInventoryAging';
import ProcessingQueue from '@/components/apps/loot/ProcessingQueue';

const TAB_STYLE = "rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs font-mono whitespace-nowrap";

export default function LootContent() {
  const [tab, setTab] = useState('queue');

  return (
    <div className="h-full flex flex-col industrial-interior" style={{ background: 'hsl(30, 8%, 9%)' }}>
      <div className="p-3 border-b flex items-center gap-2" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 7%)' }}>
        <span className="font-mono text-xs text-muted-foreground">LOOT & RECOVERY — Gear, Components, Weapons</span>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto flex-nowrap overflow-x-auto" style={{ borderColor: 'hsl(33, 18%, 18%)' }}>
          <TabsTrigger value="queue"    className={TAB_STYLE}>PROCESSING QUEUE</TabsTrigger>
          <TabsTrigger value="manifest" className={TAB_STYLE}>MANIFEST</TabsTrigger>
          <TabsTrigger value="repair"   className={TAB_STYLE}>REPAIR ROI</TabsTrigger>
          <TabsTrigger value="aging"    className={TAB_STYLE}>AGING</TabsTrigger>
        </TabsList>
        <TabsContent value="queue"    className="flex-1 overflow-auto m-0 p-0"><ProcessingQueue /></TabsContent>
        <TabsContent value="manifest" className="flex-1 overflow-auto m-0"><LootManifest /></TabsContent>
        <TabsContent value="repair"   className="flex-1 overflow-auto m-0"><RepairROI /></TabsContent>
        <TabsContent value="aging"    className="flex-1 overflow-auto m-0"><LootInventoryAging /></TabsContent>
      </Tabs>

      <div className="p-2 border-t text-center" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 6%)' }}>
        <p className="text-[9px] font-mono text-muted-foreground">
          Repair cost estimates are approximations — verify actual costs in-game. Condition grades: New ≥90% · Refurb ≥60% · Used ≥30% · Worn &lt;30%.
        </p>
      </div>
    </div>
  );
}