import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OperatorProfile from './settings/OperatorProfile';
import AppManager from './settings/AppManager';

export default function SettingsContent() {
  const [tab, setTab] = useState('profile');

  return (
    <div className="h-full flex flex-col industrial-interior" style={{ background: 'hsl(200, 10%, 10%)' }}>
      <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto" style={{ borderColor: 'hsl(170, 25%, 18%)' }}>
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
        </TabsList>

        <TabsContent value="profile" className="flex-1 overflow-auto m-0">
          <OperatorProfile />
        </TabsContent>
        <TabsContent value="apps" className="flex-1 overflow-auto m-0">
          <AppManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}