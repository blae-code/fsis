import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { MonitorCog } from 'lucide-react';
import ProductCard from '@/components/store/ProductCard';
import OrderPanel from '@/components/store/OrderPanel';
import MyOrders from '@/components/store/MyOrders';
import AboutFsis from '@/components/store/AboutFsis';
import FsisLogo from '@/components/brand/FsisLogo';
import HexCrate from '@/components/three/HexCrate';
import SerialStrip from '@/components/brand/SerialStrip';
import { FSIS } from '@/lib/fsisLore';

export default function Storefront() {
  const [cart, setCart] = useState([]);

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

  return (
    <div className="os-viewport overflow-y-auto" style={{ background: 'hsl(180, 15%, 4%)' }}>
      {/* Header */}
      <header className="border-b sticky top-0 z-10 backdrop-blur-md" style={{ borderColor: 'hsl(170, 25%, 18%)', background: 'hsl(180, 15%, 4%, 0.85)' }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FsisLogo size={34} glow />
            <div>
              <h1 className="font-mono text-sm font-bold text-primary xian-glow-subtle tracking-[0.15em]">FAIRSHARE INDUSTRIAL SOLUTIONS</h1>
              <p className="text-[10px] font-mono text-muted-foreground">{FSIS.divisionCodes.join(' • ')} — "{FSIS.motto}"</p>
            </div>
          </div>
          {user?.role === 'admin' && (
            <Button asChild variant="outline" size="sm" className="h-8 text-[10px] font-mono gap-1.5" style={{ borderColor: 'hsl(170, 25%, 18%)' }}>
              <Link to="/ops">
                <MonitorCog className="w-3.5 h-3.5" /> OPERATOR TERMINAL
              </Link>
            </Button>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-8 pb-6">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">
          <div className="text-center md:text-left">
            <p className="font-mono text-[10px] text-primary/60 tracking-[0.3em] mb-2">// EST. {FSIS.founded} — STANTON SYSTEM</p>
            <h2 className="font-mono text-2xl md:text-3xl font-bold text-foreground">
              Honest salvage. <span className="text-primary xian-glow-subtle">Fair prices.</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl font-mono">
              Reclaimed materials and fabricated goods, sourced and delivered across the 'verse by FSIS crews.
            </p>
            <div className="mt-4 flex justify-center md:justify-start">
              <SerialStrip seed={FSIS.license} label={FSIS.license} />
            </div>
          </div>
          <HexCrate size={170} />
        </div>
      </section>

      {/* Catalog + cart */}
      <main className="max-w-6xl mx-auto px-4 pb-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {products.length === 0 ? (
              <p className="col-span-full text-center py-12 text-xs font-mono text-muted-foreground">
                No wares listed yet — check back soon.
              </p>
            ) : (
              products.map((p) => <ProductCard key={p.id} product={p} onAdd={addToCart} />)
            )}
          </div>
          <MyOrders />
          <AboutFsis />
        </div>
        <div>
          <OrderPanel cart={cart} setCart={setCart} user={user} />
        </div>
      </main>

      <footer className="border-t py-4 text-center space-y-1" style={{ borderColor: 'hsl(170, 25%, 18%)' }}>
        <p className="text-[9px] font-mono text-muted-foreground/70 px-4">
          {FSIS.name} • {FSIS.license} • {FSIS.hq}
        </p>
        <p className="text-[9px] font-mono text-muted-foreground px-4">
          All prices in aUEC (in-game currency). Unofficial fan project — not affiliated with Cloud Imperium Games.
        </p>
      </footer>
    </div>
  );
}