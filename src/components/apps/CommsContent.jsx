import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NetPlan from '@/components/apps/comms/NetPlan';
import ConnectGuide from '@/components/apps/comms/ConnectGuide';

// COMMS — FSIS communications run over the OD3ICA Spacecomms Relay Service (SRS).
export default function CommsContent() {
  return (
    <div className="h-full flex flex-col industrial-interior">
      <Tabs defaultValue="netplan" className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto" style={{ borderColor: 'hsl(170, 25%, 18%)' }}>
          <TabsTrigger
            value="netplan"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs font-mono"
          >
            NET PLAN
          </TabsTrigger>
          <TabsTrigger
            value="relay"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs font-mono"
          >
            OD3ICA RELAY
          </TabsTrigger>
        </TabsList>

        <TabsContent value="netplan" className="flex-1 overflow-auto m-0">
          <NetPlan />
        </TabsContent>

        <TabsContent value="relay" className="flex-1 overflow-auto m-0">
          <ConnectGuide />
        </TabsContent>
      </Tabs>
    </div>
  );
}