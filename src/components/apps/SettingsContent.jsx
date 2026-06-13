import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OperatorProfile from './settings/OperatorProfile';
import AppManager from './settings/AppManager';
import WorkOrderSheetConfig from './settings/WorkOrderSheetConfig';
import OpsLog from './settings/OpsLog';

export default function SettingsContent() {
  const [tab, setTab] = useState('profile');

  return (
    <div className="h-full flex flex-col industrial-interior" style={{ background: 'hsl(28, 8%, 9%)' }}>
      <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto" style={{ borderColor: 'hsl(33, 18%, 17%)' }}>
          <TabsTrigger
            value="profile"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs font-mono"
          >
            OPERATOR
          </TabsTrigger>
          <TabsTrigger
            value="apps"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs font-mono"
          >
            APPS
          </TabsTrigger>
          <TabsTrigger
            value="integrations"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs font-mono"
          >
            INTEGRATIONS
          </TabsTrigger>
          <TabsTrigger
            value="audit"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs font-mono"
          >
            AUDIT LOG
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="flex-1 overflow-auto m-0">
          <OperatorProfile />
        </TabsContent>
        <TabsContent value="apps" className="flex-1 overflow-auto m-0">
          <AppManager />
        </TabsContent>
        <TabsContent value="integrations" className="flex-1 overflow-auto m-0 p-4 space-y-4">
          <WorkOrderSheetConfig />
        </TabsContent>
        <TabsContent value="audit" className="flex-1 overflow-auto m-0 p-4">
          <OpsLog />
        </TabsContent>
      </Tabs>
    </div>
  );
}