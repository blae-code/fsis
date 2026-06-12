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
import MarketTicker from '@/components/store/MarketTicker';
import MaterialsIndex from '@/components/store/MaterialsIndex';
import FsisLogo from '@/components/brand/FsisLogo';
import HexCrate from '@/components/three/HexCrate';
import { FSIS } from '@/lib/fsisLore';

const HERO_BG = 'https://media.base44.com/images/public/6a1e4ac9c80b7ea6253dc435/44c3176b4_generated_image.png';

export default function Storefront() {
  const [cart, setCart] = useState(() => storeCache.getCart());
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

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

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        return prev.map((i) => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        product_id: product.id,
        product_name: product.product_name,
        code: product.code,
        unit: product.unit || 'SCU',
        unit_price: product.price_auec,
        quantity: 1,
      }];
    });
  };

  const filteredProducts = products.filter((p) => {
    const q = search.toLowerCase();
    const matchQ = !q || p.product_name?.toLowerCase().includes(q) || p.code?.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q);
    const matchC = category === 'all' || p.category === category;
    return matchQ && matchC;
  });

  return (
    <div className="os-viewport overflow-y-auto" style={{ background: '#0C0B0A' }}>
      {/* Header */}
      <header className="border-b sticky top-0 z-10 backdrop-blur-md" style={{ borderColor: '#2A2118', background: 'rgba(12, 11, 10, 0.92)' }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5" style={{ background: 'linear-gradient(160deg, #8A6430, #4A3722)', clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}>
              <FsisLogo size={26} />
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

      <MarketTicker />

      {/* Hero — bronze command deck panel */}
      <section className="max-w-6xl mx-auto px-4 pt-8 pb-6">
        <div
          className="p-[6px]"
          style={{
            background: 'linear-gradient(135deg, #8A6430 0%, #4A3722 35%, #B0793A 65%, #5C4424 100%)',
            clipPath: 'polygon(30px 0, 100% 0, 100% calc(100% - 30px), calc(100% - 30px) 100%, 0 100%, 0 30px)',
          }}
        >
          <div
            className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr]"
            style={{ clipPath: 'polygon(28px 0, 100% 0, 100% calc(100% - 28px), calc(100% - 28px) 100%, 0 100%, 0 28px)' }}
          >
            <div
              className="relative p-8 md:p-10"
              style={{
                backgroundImage: `linear-gradient(95deg, rgba(13, 11, 9, 0.92) 30%, rgba(13, 11, 9, 0.45) 100%), url(${HERO_BG})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center right',
              }}
            >
              <p className="font-mono text-[11px] tracking-[0.3em] mb-3" style={{ color: '#D4920B' }}>// EST. {FSIS.founded} — STANTON SYSTEM</p>
              <h2 className="font-mono text-3xl md:text-4xl font-bold leading-tight">
                <span style={{ color: '#E5DDD0' }}>Honest salvage.</span>
                <br />
                <span style={{ color: '#C8893B' }}>Fair prices.</span>
              </h2>
              <p className="text-sm mt-4 max-w-md font-mono leading-relaxed" style={{ color: '#B8AC9A' }}>
                Reclaimed materials and fabricated goods, sourced and delivered across the 'verse by FSIS crews.
              </p>
            </div>
            <div className="hidden md:flex flex-col items-center justify-center py-6 gap-2" style={{ background: '#080705', borderLeft: '2px solid #5C4424' }}>
              <HexCrate size={190} />
              <p className="font-mono text-[10px] tracking-[0.2em]" style={{ color: '#B0793A' }}>{FSIS.license}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog + cart */}
      <main className="max-w-6xl mx-auto px-4 pb-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <StoreToolbar search={search} setSearch={setSearch} category={category} setCategory={setCategory} count={filteredProducts.length} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {filteredProducts.length === 0 ? (
              <p className="col-span-full text-center py-12 text-xs font-mono" style={{ color: '#8A7E6C' }}>
                {products.length === 0 ? 'No wares listed yet — check back soon.' : 'No wares match your search.'}
              </p>
            ) : (
              filteredProducts.map((p) => <ProductCard key={p.id} product={p} onAdd={addToCart} />)
            )}
          </div>
          <MaterialsIndex products={products} />
          <MyOrders />
          <AboutFsis />
        </div>
        <div>
          <OrderPanel cart={cart} setCart={setCart} user={user} />
        </div>
      </main>

      <footer className="border-t py-4 text-center space-y-1" style={{ borderColor: '#2A2118' }}>
        <p className="text-[9px] font-mono px-4" style={{ color: '#6B6155' }}>
          {FSIS.name} • {FSIS.license} • {FSIS.hq}
        </p>
        <p className="text-[9px] font-mono px-4" style={{ color: '#8A7E6C' }}>
          All prices in aUEC (in-game currency). Unofficial fan project — not affiliated with Cloud Imperium Games.
        </p>
      </footer>
    </div>
  );
}