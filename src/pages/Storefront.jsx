import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { storeCache } from '@/lib/localCache';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { KeyRound, MonitorCog } from 'lucide-react';
import ProductCard from '@/components/store/ProductCard';
import StoreSectionRail from '@/components/store/StoreSectionRail';
import StoreContextColumn from '@/components/store/StoreContextColumn';
import MyOrders from '@/components/store/MyOrders';
import AboutFsis from '@/components/store/AboutFsis';
import StoreToolbar from '@/components/store/StoreToolbar';
import StoreTabs from '@/components/store/StoreTabs';
import MarketTicker from '@/components/store/MarketTicker';
import ProductDetail from '@/components/store/ProductDetail';
import FsisLogo from '@/components/brand/FsisLogo';

import QuoteBuilder from '@/components/store/QuoteBuilder';
// ARCHIVED: import JobsBoard from '@/components/store/JobsBoard'; (operator feature)
// ARCHIVED: import WeeklyReport from '@/components/store/WeeklyReport'; (operator feature)
// ARCHIVED: import StoreDashboard from '@/components/store/StoreDashboard'; (operator feature)
import StoreOnboarding from '@/components/store/StoreOnboarding';
import MobileCartBar from '@/components/store/MobileCartBar';
import ActiveOrderBanner from '@/components/store/ActiveOrderBanner';
import StoreFaq from '@/components/store/StoreFaq';
import JoinTheCollective from '@/components/store/JoinTheCollective';
import LandingBranch from '@/components/onboarding/LandingBranch';
import ProductCompareTray from '@/components/store/ProductCompareTray';
import StorefrontAtmosphere from '@/components/store/StorefrontAtmosphere';
import ProprietorEntryway from '@/components/store/ProprietorEntryway';
import BuyerProgressRail from '@/components/store/BuyerProgressRail';
import AdminRestockControls from '@/components/store/AdminRestockControls';
import RestockInbox from '@/components/apps/management/RestockInbox';
import AdminFulfillmentQueue from '@/components/store/AdminFulfillmentQueue';
import { matchesQuickFilter } from '@/components/store/CatalogQuickFilters';
import StoreHeroStrip from '@/components/store/StoreHeroStrip';
import CatalogSideRail from '@/components/store/CatalogSideRail';
import { useToast } from '@/components/ui/use-toast';
import { DerelictHull } from '@/components/brand/glyphs/EmptyStates';
import { motion, AnimatePresence } from 'framer-motion';
import SystemStatus from '@/components/store/SystemStatus';
import StoreMaintenanceBanner from '@/components/store/StoreMaintenanceBanner';
import { FSIS } from '@/lib/fsisLore';
import { roundPrice } from '@/lib/pricing';
import { fsisRole } from '@/lib/roles';

const STOREFRONT_CATEGORIES = ['salvage_commodity', 'fps_gear', 'weapon', 'ship_component', 'vehicle_component'];

export default function Storefront() {
  const [cart, setCart] = useState(() => storeCache.getCart());
  const [buyerProfile, setBuyerProfile] = useState(() => storeCache.getProfile());
  const [search, setSearch] = useState('');
  const [contextPane, setContextPane] = useState('manifest');
  const [category, setCategory] = useState('all');
  const [quickFilter, setQuickFilter] = useState('all');
  const [tab, setTab] = useState('catalog');
  const [detailProduct, setDetailProduct] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(() => !storeCache.hasOnboarded());
  const [preferredLocation, setPreferredLocation] = useState('');
  const [sort, setSort] = useState('featured');
  const [pins, setPins] = useState(() => storeCache.getPins());
  const [compareIds, setCompareIds] = useState([]);
  const { toast } = useToast();

  // Persist in-progress cart so returning purchasers pick up where they left off
  useEffect(() => {
    storeCache.setCart(cart);
  }, [cart]);

  // Global shortcuts: "/" focuses search, 1–5 switch sections
  useEffect(() => {
    // ARCHIVED: keys 6+ sequestered for future operator development
  const TAB_KEYS = { 1: 'catalog', 2: 'quote', 3: 'orders', 4: 'faq', 5: 'about' };
    const onKey = (e) => {
      if (showOnboarding || detailProduct) return;
      const t = e.target;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable) return;
      if (e.key === '/') {
        e.preventDefault();
        setTab('catalog');
        requestAnimationFrame(() => document.getElementById('store-search')?.focus());
      } else if (TAB_KEYS[e.key]) {
        setTab(TAB_KEYS[e.key]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showOnboarding, detailProduct]);

  const { data: products = [], isLoading: productsLoading, isError: productsError, refetch: refetchProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.product.filter({ available: true }, 'sort_order'),
    retry: 3,
  });

  // Reconcile cached carts against the live catalog: fix stale product ids
  // (matched by name after a reseed) and drop items that no longer exist,
  // so checkout never fails on "no longer available" for in-stock wares.
  useEffect(() => {
    if (!products.length || !cart.length) return;
    let changed = false;
    const next = cart.map((item) => {
      const live = products.find((p) => p.id === item.product_id)
        || products.find((p) => p.product_name === item.product_name);
      if (!live) { changed = true; return null; }
      if (live.id !== item.product_id) {
        changed = true;
        return { ...item, product_id: live.id, unit_price: roundPrice(live.price_auec), stock: live.category === 'service' ? null : (live.stock || 0) };
      }
      return item;
    }).filter(Boolean);
    if (changed) setCart(next);
  }, [products]);

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  // The setup tour is written for buyers. A comrade who holds standing gets the labour board's own
  // walkthrough instead, so nobody is taught the wrong path.
  const tourIsForThem = fsisRole(user) === 'patron' && user?.role !== 'admin';

  useEffect(() => {
    if (user && !tourIsForThem && showOnboarding) {
      storeCache.markOnboarded();
      setShowOnboarding(false);
    }
  }, [user, tourIsForThem, showOnboarding]);

  const { data: storeStatusRows = [] } = useQuery({
    queryKey: ['store_status_public'],
    queryFn: () => base44.entities.store_status.list('-updated_date', 1),
  });
  const storeStatus = storeStatusRows[0];
  const ordersPaused = storeStatus?.maintenance_mode || storeStatus?.orders_paused;

  const storefrontProducts = products.filter((p) => STOREFRONT_CATEGORIES.includes(p.category));

  // Live UEX best-sell per commodity for "vs market" badges (shares the ticker cache)
  const { data: marketPrices = [] } = useQuery({
    queryKey: ['ticker_prices'],
    queryFn: () => base44.entities.commodity_price.filter({ is_best_sell: true }),
  });
  const marketBestByCode = {};
  marketPrices.forEach((p) => {
    if (!marketBestByCode[p.commodity_code] || (p.price_sell || 0) > marketBestByCode[p.commodity_code]) {
      marketBestByCode[p.commodity_code] = p.price_sell || 0;
    }
  });

  const addToCart = (product, qty = 1) => {
    if (ordersPaused) {
      toast({ title: 'ORDERS PAUSED', description: storeStatus?.public_message || 'FSIS is temporarily holding new manifests.' });
      return;
    }
    // Stock-aware cap — never let the manifest exceed available units
    const cap = product.category === 'service' ? Infinity : (product.stock || 0);
    const existing = cart.find((i) => i.product_id === product.id);
    const current = existing?.quantity || 0;
    const allowed = Math.min(qty, cap - current);
    if (allowed <= 0) {
      toast({ title: 'STOCK LIMIT', description: `Only ${cap} ${product.unit || 'SCU'} of ${product.product_name} available — all already in your manifest.` });
      return;
    }
    if (allowed < qty) {
      toast({ title: 'QUANTITY CAPPED', description: `Only ${cap} ${product.unit || 'SCU'} of ${product.product_name} in stock.` });
    }
    if (existing) {
      setCart(cart.map((i) => i.product_id === product.id ? { ...i, quantity: i.quantity + allowed } : i));
    } else {
      setCart([...cart, {
        product_id: product.id,
        product_name: product.product_name,
        code: product.code,
        category: product.category,
        unit: product.unit || 'SCU',
        unit_price: roundPrice(product.price_auec),
        stock: cap === Infinity ? null : cap,
        quantity: allowed,
      }]);
    }
  };

  // Refill the manifest from a past order's line items, capped against live stock.
  const reorder = (items) => {
    setCart((prev) => {
      let next = [...prev];
      items.forEach((item) => {
        const live = storefrontProducts.find((p) => p.id === item.product_id);
        const cap = live?.category === 'service' ? Infinity : (live?.stock ?? item.quantity);
        const existing = next.find((i) => i.product_id === item.product_id);
        const current = existing?.quantity || 0;
        const allowed = Math.max(0, Math.min(item.quantity, cap - current));
        if (allowed <= 0) return;
        if (existing) {
          next = next.map((i) => i.product_id === item.product_id ? { ...i, quantity: i.quantity + allowed, stock: cap === Infinity ? null : cap } : i);
        } else {
          next.push({
            product_id: item.product_id,
            product_name: item.product_name,
            code: item.code,
            category: live?.category,
            unit: item.unit || 'SCU',
            unit_price: roundPrice(live?.price_auec ?? item.unit_price),
            stock: cap === Infinity ? null : cap,
            quantity: allowed,
          });
        }
      });
      return next;
    });
  };

  const filteredProducts = storefrontProducts.filter((p) => {
    const q = search.toLowerCase();
    const matchQ = !q || p.product_name?.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
    const isLootCategory = ['fps_gear', 'weapon', 'ship_component', 'vehicle_component'].includes(p.category);
    const matchC = category === 'all' || (category === 'loot' ? isLootCategory : p.category === category);
    const matchQuick = matchesQuickFilter(p, quickFilter, marketBestByCode);
    return matchQ && matchC && matchQuick;
  });

  const SORT_FNS = {
    featured: (a, b) => (a.sort_order || 0) - (b.sort_order || 0),
    price_asc: (a, b) => roundPrice(a.price_auec) - roundPrice(b.price_auec),
    price_desc: (a, b) => roundPrice(b.price_auec) - roundPrice(a.price_auec),
    stock: (a, b) => (b.stock || 0) - (a.stock || 0),
  };
  const sortedProducts = [...filteredProducts].sort((a, b) =>
    (pins.includes(a.id) ? 0 : 1) - (pins.includes(b.id) ? 0 : 1) || SORT_FNS[sort](a, b)
  );
  const compareProducts = compareIds.map((id) => storefrontProducts.find((p) => p.id === id)).filter(Boolean);
  const toggleCompare = (id) => setCompareIds((current) => current.includes(id) ? current.filter((p) => p !== id) : [id, ...current].slice(0, 3));

  return (
    <div className="os-viewport flex flex-col overflow-hidden" style={{ background: '#080604', backgroundImage: 'radial-gradient(circle at 12% 8%, rgba(224, 162, 46, 0.16), transparent 23%), radial-gradient(circle at 82% 18%, rgba(138, 100, 48, 0.16), transparent 25%), radial-gradient(circle at 70% 90%, rgba(92, 68, 36, 0.18), transparent 30%), linear-gradient(135deg, rgba(8, 6, 4, 0.96), rgba(18, 13, 8, 0.98) 42%, rgba(10, 8, 6, 0.96))' }}>
      <AnimatePresence>
        {showOnboarding && !userLoading && (!user || tourIsForThem) && (
          <StoreOnboarding
            onComplete={() => {
              storeCache.markOnboarded();
              setShowOnboarding(false);
            }}
          />
        )}
      </AnimatePresence>
      <StorefrontAtmosphere />

      {/* Header */}
      <header className="shrink-0 border-b z-10 relative overflow-hidden" style={{ borderColor: '#5C4424', background: 'linear-gradient(90deg, rgba(8, 6, 4, 0.98), rgba(20, 15, 9, 0.96), rgba(28, 18, 10, 0.94), rgba(8, 6, 4, 0.98))', boxShadow: '0 14px 34px rgba(0,0,0,0.38), inset 0 -1px 0 rgba(224,162,46,0.14)' }}>
        <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, #E0A22E, #8A8F45, transparent)' }} />
        <div className="max-w-[1880px] mx-auto px-3 sm:px-4 2xl:px-8 py-2 sm:py-3 hd:py-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-1.5" style={{ background: 'linear-gradient(160deg, #8A6430, #4A3722)', clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}>
              <FsisLogo size={24} />
            </div>
            <div>
              <h1 className="font-mono text-xs sm:text-sm font-bold tracking-[0.12em] sm:tracking-[0.18em] truncate" style={{ color: '#EDE5D6' }}>FAIRSHARE INDUSTRIAL SOLUTIONS</h1>
              <p className="hidden sm:block text-[10px] font-mono truncate" style={{ color: '#8A8F45' }}>{FSIS.divisionCodes.join(' • ')} — "{FSIS.motto}"</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* ARCHIVED: contractor/guest tier badges sequestered for future operator development */}
            {user?.role === 'admin' && (
              <div className="hidden sm:flex items-center gap-1.5 font-mono text-[9px] tracking-[0.15em] px-2 py-1 border" style={{ borderColor: '#5C4424', color: '#C8893B', background: '#100A04' }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#E0A22E' }} />
                PROPRIETOR
              </div>
            )}
            {!userLoading && user?.role !== 'admin' && (
              <Link
                to="/login"
                className="flex items-center gap-1.5 font-mono text-[9px] font-bold tracking-[0.15em] px-2.5 py-1.5 border hover:brightness-125 transition-all"
                style={{ borderColor: '#5C4424', color: '#C8A05B', background: '#100A04' }}
              >
                <KeyRound className="w-3 h-3" />
                PROPRIETOR LOGIN
              </Link>
            )}
            {/* ARCHIVED: OPERATOR TERMINAL button — sequestered; proprietor accesses via icon below */}
            {user?.role === 'admin' && (
              <Link
                to="/ops"
                title="Management Console"
                className="flex items-center justify-center w-7 h-7 border opacity-40 hover:opacity-100 transition-opacity"
                style={{ borderColor: '#3A2F20', color: '#C8A05B', background: '#0A0806' }}
              >
                <MonitorCog className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="shrink-0">
        <MarketTicker />
      </div>
      <StoreMaintenanceBanner status={storeStatus} />

      {/* Main deck — fixed console: fills viewport, only inner panes scroll */}
      <main className="flex-1 min-h-0 max-w-[1880px] mx-auto w-full px-3 sm:px-4 2xl:px-8 pt-3 pb-28 lg:pb-4 grid grid-cols-1 lg:grid-cols-[42px_1fr_390px] min-[2000px]:grid-cols-[42px_1fr_440px] gap-3 sm:gap-4 overflow-hidden">
        <StoreSectionRail
          active={tab}
          onChange={setTab}
          onOpenIntel={() => setContextPane('intel')}
          isProprietor={user?.role === 'admin'}
        />
        <div className="flex flex-col gap-2.5 min-h-0">
          <ProprietorEntryway user={user} />
          <StoreHeroStrip onOpenIntel={() => setContextPane('intel')} />

          {/* Section tabs */}
          <div className="shrink-0 flex flex-col sm:flex-row flex-wrap sm:items-center sm:justify-between gap-2">
            <StoreTabs active={tab} onChange={setTab} />
            {tab === 'catalog' && (
              <StoreToolbar search={search} setSearch={setSearch} category={category} setCategory={setCategory} sort={sort} setSort={setSort} quickFilter={quickFilter} count={filteredProducts.length} total={storefrontProducts.length} onReset={() => { setSearch(''); setCategory('all'); setQuickFilter('all'); setSort('featured'); }} />
            )}
          </div>

          <BuyerProgressRail activeTab={tab} cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)} />

          {/* Active pane — sized to the remaining viewport, scrolls internally only */}
          <div className="flex-1 min-h-0 grid grid-cols-1 min-[1400px]:grid-cols-[228px_1fr] gap-3">
            {tab === 'catalog' && (
              <CatalogSideRail
                quickFilter={quickFilter}
                onQuickFilter={setQuickFilter}
                products={storefrontProducts}
                marketBestByCode={marketBestByCode}
                onChoose={(action) => {
                  if (action === 'quote' || action === 'orders') { setTab(action); return; }
                  setTab('catalog');
                  setCategory(action);
                  setSearch('');
                }}
              />
            )}
            <div className={`min-h-0 overflow-y-auto pr-1 ${tab === 'catalog' ? '' : 'min-[1400px]:col-span-2'}`}>
            {tab === 'catalog' && (
              <div className="space-y-3">
                {user?.role === 'admin' && <AdminRestockControls products={storefrontProducts} />}
                <ProductCompareTray products={compareProducts} onClear={() => setCompareIds([])} onView={setDetailProduct} />
                <motion.div
                  className="grid grid-cols-2 min-[760px]:grid-cols-3 min-[1000px]:grid-cols-4 min-[1500px]:grid-cols-5 min-[1800px]:grid-cols-6 gap-2 sm:gap-2.5 auto-rows-fr"
                  variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                  initial="hidden"
                  animate="show"
                >
                  {productsLoading ? (
                    <div className="col-span-full flex flex-col items-center gap-3 py-16">
                      <div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(224,162,46,0.2)', borderTopColor: '#E0A22E' }} />
                      <p className="text-center text-xs font-mono" style={{ color: '#8A7E6C' }}>Loading catalog…</p>
                    </div>
                  ) : productsError ? (
                    <div className="col-span-full flex flex-col items-center gap-3 py-10">
                      <DerelictHull width={180} />
                      <p className="text-center text-xs font-mono" style={{ color: '#D08A6A' }}>
                        Catalog uplink failed — the inventory couldn't be loaded.
                      </p>
                      <button
                        type="button"
                        onClick={() => refetchProducts()}
                        className="border px-3 py-2 text-[9px] font-mono font-bold tracking-[0.14em] hover:brightness-125"
                        style={{ borderColor: '#5C4424', color: '#E0A22E', background: '#0C0A07' }}
                      >
                        RETRY UPLINK
                      </button>
                    </div>
                  ) : sortedProducts.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center gap-3 py-10">
                      <DerelictHull width={180} />
                      <p className="text-center text-xs font-mono" style={{ color: '#8A7E6C' }}>
                        {storefrontProducts.length === 0 ? 'No salvage or loot listings yet — check back soon.' : 'No salvage or loot listings match your current filters.'}
                      </p>
                      {storefrontProducts.length > 0 && (
                        <button
                          type="button"
                          onClick={() => { setSearch(''); setCategory('all'); setQuickFilter('all'); setSort('featured'); }}
                          className="border px-3 py-2 text-[9px] font-mono font-bold tracking-[0.14em] hover:brightness-125"
                          style={{ borderColor: '#5C4424', color: '#E0A22E', background: '#0C0A07' }}
                        >
                          CLEAR FILTERS
                        </button>
                      )}
                    </div>
                  ) : (
                    sortedProducts.map((p, i) => (
                      <motion.div
                        key={p.id}
                        variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
                        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                      >
                        <ProductCard
                          product={p}
                          onAdd={addToCart}
                          onView={setDetailProduct}
                          marketBest={p.code ? marketBestByCode[p.code] : undefined}
                          inCartQty={cart.find((i) => i.product_id === p.id)?.quantity || 0}
                          pinned={pins.includes(p.id)}
                          onTogglePin={(id) => setPins(storeCache.togglePin(id))}
                          compareSelected={compareIds.includes(p.id)}
                          onToggleCompare={toggleCompare}
                          onRestockNotify={() => toast({ title: 'RESTOCK ALERT', description: `We'll list ${p.product_name} again as soon as salvage ops deliver. Check back soon.` })}
                        />
                      </motion.div>
                    ))
                  )}
                </motion.div>
              </div>
            )}
            {tab === 'quote' && <QuoteBuilder products={storefrontProducts} onLoad={(p, qty, loc) => { addToCart(p, qty); if (loc) setPreferredLocation(loc); setTab('catalog'); }} />}
            {tab === 'orders' && (
              <div className="space-y-4">
                {user?.role === 'admin' && <AdminFulfillmentQueue />}
                {user?.role === 'admin' && <RestockInbox />}
                <MyOrders onReorder={reorder} />
              </div>
            )}
            {tab === 'faq' && <StoreFaq onNavigate={setTab} />}
            {tab === 'join' && (
              <div className="space-y-3 max-w-4xl">
                <LandingBranch />
                <JoinTheCollective user={user} userLoading={userLoading} />
              </div>
            )}
            {/* ARCHIVED: jobs, dashboard, report tabs sequestered for future operator development */}
            {tab === 'about' && (
              <>
                <SystemStatus />
                <AboutFsis />
              </>
            )}
            </div>
          </div>
        </div>

        {/* Context column — manifest, standing or intel (drawer on mobile) */}
        <StoreContextColumn
          pane={contextPane}
          onPane={setContextPane}
          cart={cart}
          setCart={setCart}
          user={user}
          buyerProfile={buyerProfile}
          onProfileSaved={setBuyerProfile}
          preferredLocation={preferredLocation}
          storeStatus={storeStatus}
          products={storefrontProducts}
          marketPrices={marketPrices}
        />
      </main>

      <ProductDetail
        product={detailProduct}
        products={storefrontProducts}
        onClose={() => setDetailProduct(null)}
        onAdd={addToCart}
        onView={setDetailProduct}
      />

      <ActiveOrderBanner onViewOrders={(code) => { if (code) storeCache.addTrackingCode(code); setTab('orders'); }} />
      <MobileCartBar cart={cart} setCart={setCart} user={user} buyerProfile={buyerProfile} preferredLocation={preferredLocation} storeStatus={storeStatus} />

      <footer className="shrink-0 border-t py-1.5 px-4 flex flex-wrap items-center justify-center gap-x-4" style={{ borderColor: '#2A2118' }}>
        <p className="text-[9px] font-mono" style={{ color: '#6B6155' }}>
          {FSIS.name} • {FSIS.license} • {FSIS.hq}
        </p>
        <p className="text-[9px] font-mono" style={{ color: '#8A7E6C' }}>
          All prices in aUEC. Unofficial fan project — not affiliated with Cloud Imperium Games.
        </p>
        <button onClick={() => setShowOnboarding(true)} className="text-[9px] font-mono underline hover:opacity-80" style={{ color: '#8A8F45' }}>
          SETUP GUIDE
        </button>
        {!userLoading && user?.role !== 'admin' && (
          <Link to="/login" className="text-[9px] font-mono underline hover:opacity-80" style={{ color: '#6B6155' }}>
            PROPRIETOR ACCESS
          </Link>
        )}
      </footer>
    </div>
  );
}