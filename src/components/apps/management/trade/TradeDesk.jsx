import React from 'react';
import ConsoleFold from '@/components/console/ConsoleFold';
import ProductManager from '@/components/apps/management/ProductManager';
import OrdersContent from '@/components/apps/OrdersContent';
import RestockInbox from '@/components/apps/management/RestockInbox';
import AdminRestockControls from '@/components/store/AdminRestockControls';
import DiscountManager from '@/components/apps/management/DiscountManager';
import PricingAdvisorPanel from '@/components/apps/management/pricing/PricingAdvisorPanel';
import MarketPriceComparator from '@/components/apps/management/MarketPriceComparator';

/** Only the desk in hand is mounted — the rest of the shop costs nothing while it waits. */
export default function TradeDesk({ desk }) {
  if (desk === 'catalogue') return <ProductManager />;
  if (desk === 'orders') return <OrdersContent />;
  if (desk === 'inbox') return <RestockInbox />;
  if (desk === 'restock') return <AdminRestockControls />;
  if (desk === 'discounts') return <DiscountManager />;
  return (
    <div className="space-y-4">
      <PricingAdvisorPanel />
      <ConsoleFold label="MARKET COMPARATOR — TERMINAL PRICES SIDE BY SIDE">
        <MarketPriceComparator />
      </ConsoleFold>
    </div>
  );
}