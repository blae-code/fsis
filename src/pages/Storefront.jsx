import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { storeCache } from '@/lib/localCache';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { MonitorCog } from 'lucide-react';
import ProductCard from '@/components/store/ProductCard';
import OrderPanel from '@/components/store/OrderPanel';
import MyOrders from '@/components/store/MyOrders';
import AboutFsis from '@/components/store/AboutFsis';
import StoreToolbar from '@/components/store/StoreToolbar';
import StoreTabs from '@/components/store/StoreTabs';
import MarketTicker from '@/components/store/MarketTicker';
import ProductDetail from '@/components/store/ProductDetail';
import FsisLogo from '@/components/brand/FsisLogo';
import ExchangeBoard from '@/components/store/ExchangeBoard';
import QuoteBuilder from '@/components/store/QuoteBuilder';
import OpsFeed from '@/components/store/OpsFeed';
// ARCHIVED: import JobsBoard from '@/components/store/JobsBoard'; (operator feature)
// ARCHIVED: import WeeklyReport from '@/components/store/WeeklyReport'; (operator feature)
// ARCHIVED: import StoreDashboard from '@/components/store/StoreDashboard'; (operator feature)
import StoreOnboarding from '@/components/store/StoreOnboarding';
import MobileCartBar from '@/components/store/MobileCartBar';
import ActiveOrderBanner from '@/components/store/ActiveOrderBanner';
import HowItWorksStrip from '@/components/store/HowItWorksStrip';
import StoreGuidedFinder from '@/components/store/StoreGuidedFinder';
import StoreFaq from '@/components/store/StoreFaq';
import StoreLiveStatusPanel from '@/components/store/StoreLiveStatusPanel';
import RedscarTrustStrip from '@/components/store/RedscarTrustStrip';
import ProductCompareTray from '@/components/store/ProductCompareTray';
import StorefrontAtmosphere from '@/components/store/StorefrontAtmosphere';
import BuyerProgressRail from '@/components/store/BuyerProgressRail';
import CatalogQuickFilters, { matchesQuickFilter } from '@/components/store/CatalogQuickFilters';
import RecentDeliveries from '@/components/store/RecentDeliveries';
import { useToast } from '@/components/ui/use-toast';
import { DerelictHull } from '@/components/brand/glyphs/EmptyStates';
import { motion, AnimatePresence } from 'framer-motion';
import SystemStatus from '@/components/store/SystemStatus';
import HexCrate from '@/components/three/HexCrate';
import { FSIS } from '@/lib/fsisLore';

const HERO_BG = 'https://media.base44.com/images/public/6a1e4ac9c80b7ea6253dc435/44c3176b4_generated_image.png';

export default function Storefront() {
  const [cart, setCart] = useState(() => storeCache.getCart());
  const [search, setSearch] = useState('');
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

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.product.filter({ available: true }, 'sort_order'),
  });

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

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
        unit_price: product.price_auec,
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
        const live = products.find((p) => p.id === item.product_id);
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
            unit_price: live?.price_auec ?? item.unit_price,
            stock: cap === Infinity ? null : cap,
            quantity: allowed,
          });
        }
      });
      return next;
    });
  };

  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();
    const matchQ = !q || p.product_name?.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
    const matchC = category === 'all' || p.category === category;
    const matchQuick = matchesQuickFilter(p, quickFilter, marketBestByCode);
    return matchQ && matchC && matchQuick;
  });

  const SORT_FNS = {
    featured: (a, b) => (a.sort_order || 0) - (b.sort_order || 0),
    price_asc: (a, b) => a.price_auec - b.price_auec,
    price_desc: (a, b) => b.price_auec - a.price_auec,
    stock: (a, b) => (b.stock || 0) - (a.stock || 0),
  };
  const sortedProducts = [...filteredProducts].sort((a, b) =>
    (pins.includes(a.id) ? 0 : 1) - (pins.includes(b.id) ? 0 : 1) || SORT_FNS[sort](a, b)
  );
  const compareProducts = compareIds.map((id) => products.find((p) => p.id === id)).filter(Boolean);
  const toggleCompare = (id) => setCompareIds((current) => current.includes(id) ? current.filter((p) => p !== id) : [id, ...current].slice(0, 3));

  return (
    <div className="os-viewport flex flex-col overflow-hidden" style={{ background: '#0C0B0A' }}>
      <AnimatePresence>
        {showOnboarding && (
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
      <header className="shrink-0 border-b z-10 relative" style={{ borderColor: '#2A2118', background: 'rgba(12, 11, 10, 0.92)' }}>
        <div className="max-w-[1720px] mx-auto px-4 2xl:px-8 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5" style={{ background: 'linear-gradient(160deg, #8A6430, #4A3722)', clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}>
              <FsisLogo size={24} />
            </div>
            <div>
              <h1 className="font-mono text-sm font-bold tracking-[0.18em]" style={{ color: '#EDE5D6' }}>FAIRSHARE INDUSTRIAL SOLUTIONS</h1>
              <p className="text-[10px] font-mono" style={{ color: '#6FA08F' }}>{FSIS.divisionCodes.join(' • ')} — "{FSIS.motto}"</p>
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

      {/* Main deck — fills viewport, no page scroll */}
      <main className="flex-1 min-h-0 max-w-[1720px] mx-auto w-full px-4 2xl:px-8 pt-4 pb-20 lg:pb-4 grid grid-cols-1 lg:grid-cols-[1fr_380px] 2xl:grid-cols-[1fr_400px] gap-5 overflow-y-auto lg:overflow-hidden">
        <div className="flex flex-col min-h-0 gap-4">
          {/* Compact hero */}
          <div
            className="shrink-0 p-[5px] hidden sm:block"
            style={{
              background: 'linear-gradient(135deg, #8A6430 0%, #4A3722 35%, #B0793A 65%, #5C4424 100%)',
              clipPath: 'polygon(24px 0, 100% 0, 100% calc(100% - 24px), calc(100% - 24px) 100%, 0 100%, 0 24px)',
            }}
          >
            <div
              className="grid grid-cols-1 md:grid-cols-[1.6fr_1fr]"
              style={{ clipPath: 'polygon(22px 0, 100% 0, 100% calc(100% - 22px), calc(100% - 22px) 100%, 0 100%, 0 22px)' }}
            >
              <div
                className="relative p-6 md:p-7"
                style={{
                  backgroundImage: `linear-gradient(95deg, rgba(13, 11, 9, 0.92) 30%, rgba(13, 11, 9, 0.45) 100%), url(${HERO_BG})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center right',
                }}
              >
                {/* Floating 3D hex crate */}
                <div className="absolute top-1/2 -translate-y-1/2 right-2 hidden xl:block pointer-events-none opacity-80">
                  <HexCrate size={150} />
                </div>
                <p className="font-mono text-[10px] tracking-[0.3em] mb-2" style={{ color: '#6FA08F' }}>// EST. {FSIS.founded} — STANTON SYSTEM</p>
                <h2 className="font-mono text-3xl 2xl:text-4xl font-bold leading-tight tracking-tight">
                  <span style={{ color: '#F2EADC' }}>Honest salvage.</span>{' '}
                  <span style={{ color: '#E0A22E' }}>Fair prices.</span>
                </h2>
                <p className="text-xs 2xl:text-sm mt-3 max-w-md font-mono leading-relaxed" style={{ color: '#A89C8A' }}>
                  Reclaimed materials and fabricated goods, sourced and delivered across the 'verse by FSIS crews.
                </p>
              </div>
              <div className="flex flex-col">
                <ExchangeBoard />
                <StoreLiveStatusPanel products={products} marketPrices={marketPrices} />
              </div>
            </div>
          </div>

          {/* Section tabs */}
          <div className="shrink-0 flex flex-wrap items-center justify-between gap-3">
            <StoreTabs active={tab} onChange={setTab} />
            {tab === 'catalog' && (
              <StoreToolbar search={search} setSearch={setSearch} category={category} setCategory={setCategory} sort={sort} setSort={setSort} quickFilter={quickFilter} count={filteredProducts.length} total={products.length} onReset={() => { setSearch(''); setCategory('all'); setQuickFilter('all'); setSort('featured'); }} />
            )}
          </div>

          <BuyerProgressRail activeTab={tab} cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)} />

          {/* Active section — scrolls internally only if it overflows */}
          <div className="flex-1 min-h-0 lg:overflow-y-auto pr-1">
            {tab === 'catalog' && (
              <div className="space-y-4">
                <StoreGuidedFinder onChoose={(action) => {
                  if (action === 'quote' || action === 'orders') {
                    setTab(action);
                    return;
                  }
                  setTab('catalog');
                  setCategory(action);
                  setSearch('');
                }} />
                <HowItWorksStrip />
                <RedscarTrustStrip />
                <CatalogQuickFilters active={quickFilter} onChange={setQuickFilter} products={products} marketBestByCode={marketBestByCode} />
                <ProductCompareTray products={compareProducts} onClear={() => setCompareIds([])} onView={setDetailProduct} />
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4"
                  variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                  initial="hidden"
                  animate="show"
                >
                  {sortedProducts.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center gap-3 py-10">
                      <DerelictHull width={180} />
                      <p className="text-center text-xs font-mono" style={{ color: '#8A7E6C' }}>
                        {products.length === 0 ? 'No wares listed yet — check back soon.' : 'No wares match your current filters.'}
                      </p>
                      {products.length > 0 && (
                        <button
                          type="button"
                          onClick={() => { setSearch(''); setCategory('all'); setQuickFilter('all'); setSort('featured'); }}
                          className="border px-3 py-2 text-[9px] font-mono font-bold tracking-[0.14em] hover:brightness-125"
                          style={{ borderColor: '#5C4424', color: '#E0A22E', background: '#0C0A07' }}
                        >
                          CLEAR DIAGNOSTICS
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
                <RecentDeliveries />
              </div>
            )}
            {tab === 'quote' && <QuoteBuilder products={products} onLoad={(p, qty, loc) => { addToCart(p, qty); if (loc) setPreferredLocation(loc); setTab('catalog'); }} />}
            {tab === 'orders' && <MyOrders onReorder={reorder} />}
            {tab === 'faq' && <StoreFaq onNavigate={setTab} />}
            {/* ARCHIVED: jobs, dashboard, report tabs sequestered for future operator development */}
            {tab === 'about' && (
              <>
                <SystemStatus />
                <AboutFsis />
              </>
            )}
          </div>
        </div>

        {/* Order panel — pinned, scrolls internally if needed (drawer on mobile) */}
        <div className="hidden lg:block min-h-0 lg:overflow-y-auto">
          <OrderPanel cart={cart} setCart={setCart} user={user} preferredLocation={preferredLocation} />
        </div>
      </main>

      <ProductDetail
        product={detailProduct}
        products={products}
        onClose={() => setDetailProduct(null)}
        onAdd={addToCart}
        onView={setDetailProduct}
      />

      <div className="shrink-0">
        <OpsFeed />
      </div>

      <ActiveOrderBanner onViewOrders={() => setTab('orders')} />
      <MobileCartBar cart={cart} setCart={setCart} user={user} preferredLocation={preferredLocation} />

      <footer className="shrink-0 border-t py-1.5 px-4 flex flex-wrap items-center justify-center gap-x-4" style={{ borderColor: '#2A2118' }}>
        <p className="text-[9px] font-mono" style={{ color: '#6B6155' }}>
          {FSIS.name} • {FSIS.license} • {FSIS.hq}
        </p>
        <p className="text-[9px] font-mono" style={{ color: '#8A7E6C' }}>
          All prices in aUEC. Unofficial fan project — not affiliated with Cloud Imperium Games.
        </p>
        <button onClick={() => setShowOnboarding(true)} className="text-[9px] font-mono underline hover:opacity-80" style={{ color: '#6FA08F' }}>
          SETUP GUIDE
        </button>
      </footer>
    </div>
  );
}