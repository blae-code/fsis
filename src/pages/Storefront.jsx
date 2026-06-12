import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { storeCache } from '@/lib/localCache';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
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
import JobsBoard from '@/components/store/JobsBoard';
import SystemStatus from '@/components/store/SystemStatus';
import { FSIS } from '@/lib/fsisLore';

const HERO_BG = 'https://media.base44.com/images/public/6a1e4ac9c80b7ea6253dc435/44c3176b4_generated_image.png';

export default function Storefront() {
  const [cart, setCart] = useState(() => storeCache.getCart());
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [tab, setTab] = useState('catalog');
  const [detailProduct, setDetailProduct] = useState(null);

  // Persist in-progress cart so returning purchasers pick up where they left off
  useEffect(() => {
    storeCache.setCart(cart);
  }, [cart]);

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
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        return prev.map((i) => i.product_id === product.id ? { ...i, quantity: i.quantity + qty } : i);
      }
      return [...prev, {
        product_id: product.id,
        product_name: product.product_name,
        code: product.code,
        category: product.category,
        unit: product.unit || 'SCU',
        unit_price: product.price_auec,
        quantity: qty,
      }];
    });
  };

  // Refill the manifest from a past order's line items
  const reorder = (items) => {
    setCart((prev) => {
      let next = [...prev];
      items.forEach((item) => {
        const existing = next.find((i) => i.product_id === item.product_id);
        if (existing) {
          next = next.map((i) => i.product_id === item.product_id ? { ...i, quantity: i.quantity + item.quantity } : i);
        } else {
          const live = products.find((p) => p.id === item.product_id);
          next.push({
            product_id: item.product_id,
            product_name: item.product_name,
            code: item.code,
            category: live?.category,
            unit: item.unit || 'SCU',
            unit_price: live?.price_auec ?? item.unit_price,
            quantity: item.quantity,
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
    return matchQ && matchC;
  });

  return (
    <div className="os-viewport flex flex-col overflow-hidden" style={{ background: '#0C0B0A' }}>
      {/* Header */}
      <header className="shrink-0 border-b z-10" style={{ borderColor: '#2A2118', background: 'rgba(12, 11, 10, 0.92)' }}>
        <div className="max-w-[1720px] mx-auto px-4 2xl:px-8 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5" style={{ background: 'linear-gradient(160deg, #8A6430, #4A3722)', clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}>
              <FsisLogo size={24} />
            </div>
            <div>
              <h1 className="font-mono text-sm font-bold tracking-[0.18em]" style={{ color: '#D8CFC0' }}>FAIRSHARE INDUSTRIAL SOLUTIONS</h1>
              <p className="text-[10px] font-mono" style={{ color: '#B0793A' }}>{FSIS.divisionCodes.join(' • ')} — "{FSIS.motto}"</p>
            </div>
          </div>
          {user?.role === 'admin' && (
            <Button asChild variant="outline" size="sm" className="h-8 text-[10px] font-mono gap-1.5 bg-transparent" style={{ borderColor: '#5C4424', color: '#C8A05B' }}>
              <Link to="/ops">
                <MonitorCog className="w-3.5 h-3.5" /> OPERATOR TERMINAL
              </Link>
            </Button>
          )}
        </div>
      </header>

      <div className="shrink-0">
        <MarketTicker />
      </div>

      {/* Main deck — fills viewport, no page scroll */}
      <main className="flex-1 min-h-0 max-w-[1720px] mx-auto w-full px-4 2xl:px-8 py-4 grid grid-cols-1 lg:grid-cols-[1fr_380px] 2xl:grid-cols-[1fr_400px] gap-5 overflow-y-auto lg:overflow-hidden">
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
                <p className="font-mono text-[10px] tracking-[0.3em] mb-2" style={{ color: '#D4920B' }}>// EST. {FSIS.founded} — STANTON SYSTEM</p>
                <h2 className="font-mono text-2xl 2xl:text-3xl font-bold leading-tight">
                  <span style={{ color: '#E5DDD0' }}>Honest salvage.</span>{' '}
                  <span style={{ color: '#C8893B' }}>Fair prices.</span>
                </h2>
                <p className="text-xs 2xl:text-sm mt-3 max-w-md font-mono leading-relaxed" style={{ color: '#B8AC9A' }}>
                  Reclaimed materials and fabricated goods, sourced and delivered across the 'verse by FSIS crews.
                </p>
              </div>
              <ExchangeBoard />
            </div>
          </div>

          {/* Section tabs */}
          <div className="shrink-0 flex flex-wrap items-center justify-between gap-3">
            <StoreTabs active={tab} onChange={setTab} />
            {tab === 'catalog' && (
              <StoreToolbar search={search} setSearch={setSearch} category={category} setCategory={setCategory} count={filteredProducts.length} />
            )}
          </div>

          {/* Active section — scrolls internally only if it overflows */}
          <div className="flex-1 min-h-0 lg:overflow-y-auto pr-1">
            {tab === 'catalog' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                {filteredProducts.length === 0 ? (
                  <p className="col-span-full text-center py-12 text-xs font-mono" style={{ color: '#8A7E6C' }}>
                    {products.length === 0 ? 'No wares listed yet — check back soon.' : 'No wares match your search.'}
                  </p>
                ) : (
                  filteredProducts.map((p) => (
                    <ProductCard key={p.id} product={p} onAdd={addToCart} onView={setDetailProduct} marketBest={p.code ? marketBestByCode[p.code] : undefined} />
                  ))
                )}
              </div>
            )}
            {tab === 'quote' && <QuoteBuilder products={products} onLoad={(p, qty) => { addToCart(p, qty); }} />}
            {tab === 'orders' && <MyOrders onReorder={reorder} />}
            {tab === 'jobs' && <JobsBoard />}
            {tab === 'about' && (
              <>
                <SystemStatus />
                <AboutFsis />
              </>
            )}
          </div>
        </div>

        {/* Order panel — pinned, scrolls internally if needed */}
        <div className="min-h-0 lg:overflow-y-auto">
          <OrderPanel cart={cart} setCart={setCart} user={user} />
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

      <footer className="shrink-0 border-t py-1.5 px-4 flex flex-wrap items-center justify-center gap-x-4" style={{ borderColor: '#2A2118' }}>
        <p className="text-[9px] font-mono" style={{ color: '#6B6155' }}>
          {FSIS.name} • {FSIS.license} • {FSIS.hq}
        </p>
        <p className="text-[9px] font-mono" style={{ color: '#8A7E6C' }}>
          All prices in aUEC. Unofficial fan project — not affiliated with Cloud Imperium Games.
        </p>
      </footer>
    </div>
  );
}