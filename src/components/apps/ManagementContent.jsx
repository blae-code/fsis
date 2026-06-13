import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldAlert, Briefcase } from 'lucide-react';
import ManagementCommandDeck from '@/components/apps/management/ManagementCommandDeck';
import WorkOrderDeck from '@/components/apps/fairshare/WorkOrderDeck';
import ProductManager from '@/components/apps/management/ProductManager';
import DiscountManager from '@/components/apps/management/DiscountManager';
import JobBoardAdmin from '@/components/apps/fairshare/JobBoardAdmin';
import CrewRosterDeck from '@/components/apps/fairshare/CrewRosterDeck';
import OrdersContent from '@/components/apps/OrdersContent';

const tabCls =
  'rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs font-mono whitespace-nowrap';

/** Management console — admin-only space with all storefront & operations tools */
export default function ManagementContent() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  if (isLoading) {
    return <div className="text-center py-12 text-xs font-mono text-muted-foreground">Verifying clearance…</div>;
  }

  if (user?.role !== 'admin') {
    return (
      <div className="h-full flex items-center justify-center industrial-interior" style={{ background: 'hsl(30, 8%, 9%)' }}>
        <div className="text-center font-mono">
          <ShieldAlert className="w-8 h-8 mx-auto mb-3 text-destructive" />
          <div className="text-xs text-foreground tracking-[0.2em]">MANAGEMENT CLEARANCE REQUIRED</div>
          <p className="text-[10px] text-muted-foreground mt-2">This console is restricted to FSIS management personnel.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col industrial-interior font-mono" style={{ background: 'hsl(30, 8%, 9%)' }}>
      <div className="p-3 border-b flex items-center gap-2" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 7%)' }}>
        <Briefcase className="w-3.5 h-3.5 text-primary" />
        <span className="text-[10px] tracking-[0.2em] text-muted-foreground">MANAGEMENT CONSOLE — STOREFRONT & OPERATIONS</span>
      </div>

      <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto p-0 overflow-x-auto flex-nowrap shrink-0" style={{ borderColor: 'hsl(33, 18%, 18%)' }}>
          <TabsTrigger value="overview" className={tabCls}>OVERVIEW</TabsTrigger>
          <TabsTrigger value="store" className={tabCls}>STORE</TabsTrigger>
          <TabsTrigger value="discounts" className={tabCls}>DISCOUNTS</TabsTrigger>
          <TabsTrigger value="orders" className={tabCls}>ORDERS</TabsTrigger>
          <TabsTrigger value="jobs" className={tabCls}>JOB BOARD</TabsTrigger>
          <TabsTrigger value="crew" className={tabCls}>CREW</TabsTrigger>
          <TabsTrigger value="work_orders" className={tabCls}>WORK ORDERS</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="flex-1 overflow-auto m-0 p-4">
          <ManagementCommandDeck />
        </TabsContent>
        <TabsContent value="store" className="flex-1 overflow-auto m-0 p-4">
          <ProductManager />
        </TabsContent>
        <TabsContent value="discounts" className="flex-1 overflow-auto m-0 p-4">
          <DiscountManager />
        </TabsContent>
        <TabsContent value="orders" className="flex-1 overflow-hidden m-0">
          <OrdersContent />
        </TabsContent>
        <TabsContent value="jobs" className="flex-1 overflow-auto m-0">
          <JobBoardAdmin />
        </TabsContent>
        <TabsContent value="crew" className="flex-1 overflow-auto m-0">
          <CrewRosterDeck />
        </TabsContent>
        <TabsContent value="work_orders" className="flex-1 overflow-auto m-0">
          <WorkOrderDeck />
        </TabsContent>
      </Tabs>
    </div>
  );
}