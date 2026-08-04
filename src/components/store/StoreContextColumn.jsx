import React from 'react';
import OrderPanel from '@/components/store/OrderPanel';
import TradeStandingNotice from '@/components/store/TradeStandingNotice';
import ExchangeBoard from '@/components/store/ExchangeBoard';
import StoreLiveStatusPanel from '@/components/store/StoreLiveStatusPanel';
import BuyerProfilePanel from '@/components/store/BuyerProfilePanel';
import HowItWorksStrip from '@/components/store/HowItWorksStrip';
import RedscarTrustStrip from '@/components/store/RedscarTrustStrip';
import RecentDeliveries from '@/components/store/RecentDeliveries';

const PANES = [
  { id: 'manifest', label: 'MANIFEST' },
  { id: 'standing', label: 'STANDING' },
  { id: 'intel', label: 'INTEL' },
];

/** Right context column — swaps between the manifest, the buyer's standing and the intel deck. */
export default function StoreContextColumn({
  pane, onPane, cart, setCart, user, buyerProfile, onProfileSaved,
  preferredLocation, storeStatus, products, marketPrices,
}) {
  return (
    <div className="hidden lg:flex flex-col min-h-0 gap-2">
      <div className="shrink-0 flex" style={{ border: '1px solid #2A2118', background: 'rgba(10,8,6,0.72)' }}>
        {PANES.map((p) => {
          const active = pane === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onPane(p.id)}
              className="flex-1 py-2 font-mono text-[9px] tracking-[0.2em] transition-colors"
              style={{
                color: active ? '#F4ECDB' : '#6F6557',
                background: active ? 'linear-gradient(160deg, #8A6430, #4A3722)' : 'transparent',
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        {pane === 'manifest' && (
          <OrderPanel
            cart={cart}
            setCart={setCart}
            user={user}
            buyerProfile={buyerProfile}
            preferredLocation={preferredLocation}
            storeStatus={storeStatus}
          />
        )}
        {pane === 'standing' && (
          user
            ? <TradeStandingNotice user={user} />
            : (
              <div className="border p-3 font-mono text-[9px] leading-relaxed" style={{ borderColor: '#2E2519', background: '#0C0A07', color: '#8A7E6C' }}>
                Guests carry no trade record at all. Turning up at the handoff is what earns standing here —
                claim your orders to an account and it starts being kept.
              </div>
            )
        )}
        {pane === 'intel' && (
          <div className="space-y-3">
            <ExchangeBoard />
            <StoreLiveStatusPanel products={products} marketPrices={marketPrices} />
            <BuyerProfilePanel profile={buyerProfile} onProfileSaved={onProfileSaved} />
            <HowItWorksStrip />
            <RedscarTrustStrip />
            <RecentDeliveries />
          </div>
        )}
      </div>
    </div>
  );
}