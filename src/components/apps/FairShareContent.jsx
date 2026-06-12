import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WorkOrderForm from '@/components/apps/fairshare/WorkOrderForm';
import WorkOrderList from '@/components/apps/fairshare/WorkOrderList';
import CrewRoster from '@/components/apps/fairshare/CrewRoster';
import PayrollTable from '@/components/apps/fairshare/PayrollTable';
import PayrollTracker from '@/components/apps/fairshare/PayrollTracker';
import TimeLogs from '@/components/apps/fairshare/TimeLogs';
import PaydayCycles from '@/components/apps/fairshare/PaydayCycles';
import JobBoardAdmin from '@/components/apps/fairshare/JobBoardAdmin';
import ContractorDashboard from '@/components/apps/fairshare/ContractorDashboard';

// FairShare: Regolith-style work orders with crew profit-sharing.
// Gross sale − expenses = net, split by share weight across the crew.
export default function FairShareContent() {
  const [activeTab, setActiveTab] = useState('orders');

  return (
    <div className="h-full flex flex-col industrial-interior" style={{ background: 'hsl(30, 8%, 9%)' }}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto" style={{ borderColor: 'hsl(33, 18%, 18%)' }}>
          <TabsTrigger
            value="orders"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs font-mono"
          >
            WORK ORDERS
          </TabsTrigger>
          <TabsTrigger
            value="contractors"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs font-mono"
          >
            CONTRACTORS
          </TabsTrigger>
          <TabsTrigger
            value="crew"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs font-mono"
          >
            CREW ROSTER
          </TabsTrigger>
          <TabsTrigger
            value="payroll"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs font-mono"
          >
            PAYROLL
          </TabsTrigger>
          <TabsTrigger
            value="time"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs font-mono"
          >
            TIME &amp; SHARES
          </TabsTrigger>
          <TabsTrigger
            value="payday"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs font-mono"
          >
            PAY DAY
          </TabsTrigger>
          <TabsTrigger
            value="jobs"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs font-mono"
          >
            JOB BOARD
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="flex-1 overflow-auto m-0">
          <div className="p-4 space-y-4">
            <WorkOrderForm />
            <WorkOrderList />
          </div>
        </TabsContent>

        <TabsContent value="contractors" className="flex-1 overflow-auto m-0">
          <ContractorDashboard />
        </TabsContent>

        <TabsContent value="crew" className="flex-1 overflow-auto m-0">
          <CrewRoster />
        </TabsContent>

        <TabsContent value="payroll" className="flex-1 overflow-auto m-0">
          <div className="p-4 pb-0">
            <PayrollTracker />
          </div>
          <PayrollTable />
        </TabsContent>

        <TabsContent value="time" className="flex-1 overflow-auto m-0">
          <TimeLogs />
        </TabsContent>

        <TabsContent value="payday" className="flex-1 overflow-auto m-0">
          <PaydayCycles />
        </TabsContent>

        <TabsContent value="jobs" className="flex-1 overflow-auto m-0">
          <JobBoardAdmin />
        </TabsContent>
      </Tabs>

      <div className="p-2 border-t text-center" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 6%)' }}>
        <p className="text-[9px] font-mono text-muted-foreground">
          "Every credit accounted for." — Net payout = gross − expenses, split by crew share weight.
        </p>
      </div>
    </div>
  );
}