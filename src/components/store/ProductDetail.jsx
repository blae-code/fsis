import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Minus, Plus, TrendingUp, ShoppingCart } from 'lucide-react';
import CommodityIcon from '@/components/brand/CommodityIcon';
import SerialStrip from '@/components/brand/SerialStrip';
import MarketBadge from '@/components/store/MarketBadge';
import GradeStamp from '@/components/brand/glyphs/GradeStamp';
import RestockNotify from '@/components/store/RestockNotify';
import { lotNumber } from '@/lib/fsisLore';

/** Buyer-facing product dossier: specs, live market comparison, stock, related wares */
export default function ProductDetail({ product, products = [], onClose, onAdd, onView }) {
  const [qty, setQty] = useState(1);
  useEffect(() => setQty(1), [product?.id]);

  const { data: marketPrices = [] } = useQuery({
    queryKey: ['market_prices', product?.code],
    queryFn: () => base44.entities.commodity_price.filter({ commodity_code: product.code }),
    enabled: !!product?.code && product?.category === 'salvage_commodity',
  });

  if (!product) return null;

  const inStock = (product.stock || 0) > 0 || product.category === 'service';
  const maxQty = product.category === 'service' ? 999 : (product.stock || 0);
  const topTerminals = [...marketPrices]
    .filter((p) => p.price_sell > 0)
    .sort((a, b) => b.price_sell - a.price_sell)
    .slice(0, 3);
  const related = products.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 3);

  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-lg border p-0 gap-0 font-mono"
        style={{ borderColor: '#5C4A33', background: '#14110D' }}
      >
        {/* Header */}
        <div className="flex items-start gap-3 p-4 border-b" style={{ borderColor: '#2A2118' }}>
          <div className="w-14 h-14 flex items-center justify-center border shrink-0" style={{ borderColor: '#4A3B28', background: 'rgba(10, 9, 7, 0.6)' }}>
            <CommodityIcon code={product.code} size={40} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold" style={{ color: '#D8CFC0' }}>
              {product.product_name}
              {product.code && <span className="ml-2" style={{ color: '#E0A22E' }}>[{product.code}]</span>}
            </h3>
            <p className="text-[10px] mt-0.5" style={{ color: '#8A7E6C' }}>{lotNumber(product.id)} • {product.category?.replace('_', ' ').toUpperCase()}</p>
            {product.description && (
              <p className="text-xs mt-1.5 leading-relaxed" style={{ color: '#9C9080' }}>{product.description}</p>
            )}
          </div>
          <GradeStamp category={product.category} className="ml-auto mr-5 mt-1 shrink-0 hidden sm:inline-block" />
        </div>

        <div className="p-4 space-y-4">
          {/* Price + stock */}
          <div className="flex items-end justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span>
                <span className="text-2xl font-bold" style={{ color: '#E0A22E' }}>{product.price_auec.toLocaleString()}</span>
                <span className="text-[10px] ml-1.5" style={{ color: '#8A7E6C' }}>aUEC/{product.unit || 'SCU'}</span>
              </span>
              <MarketBadge price={product.price_auec} marketBest={topTerminals[0]?.price_sell} />
            </div>
            <span className="text-[10px]" style={{ color: inStock ? '#7BA05B' : '#C05050' }}>
              {product.category === 'service' ? 'AVAILABLE ON REQUEST' : inStock ? `${product.stock} ${product.unit || 'SCU'} IN STOCK` : 'OUT OF STOCK'}
            </span>
          </div>

          {/* Market comparison */}
          {topTerminals.length > 0 && (
            <div className="border p-3 space-y-1.5" style={{ borderColor: '#3A2F20', background: '#0E0C09' }}>
              <div className="flex items-center gap-1.5 text-[9px] tracking-[0.2em]" style={{ color: '#C8A05B' }}>
                <TrendingUp className="w-3 h-3" /> LIVE MARKET — TOP SELL TERMINALS
              </div>
              {topTerminals.map((t) => (
                <div key={t.id} className="flex justify-between text-[10px]">
                  <span style={{ color: '#9C9080' }}>{t.terminal_name}</span>
                  <span style={{ color: '#D8CFC0' }}>{t.price_sell.toLocaleString()} aUEC</span>
                </div>
              ))}
              <p className="text-[9px] pt-1 border-t" style={{ borderColor: '#2A2118', color: '#6B6155' }}>
                FSIS price includes sourcing & delivery to your location.
              </p>
            </div>
          )}

          {/* FairShare pricing math — show the work */}
          {product.market_ref_auec > 0 && (
            <div className="border p-3 space-y-1" style={{ borderColor: '#3A2F20', background: '#0E0C09' }}>
              <div className="text-[9px] tracking-[0.2em]" style={{ color: '#C8A05B' }}>FAIRSHARE PRICING — THE MATH</div>
              <div className="flex justify-between text-[10px]">
                <span style={{ color: '#9C9080' }}>UEX MARKET REFERENCE</span>
                <span style={{ color: '#D8CFC0' }}>{product.market_ref_auec.toLocaleString()} aUEC</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span style={{ color: '#9C9080' }}>FSIS MARGIN (+{product.margin_percent}%)</span>
                <span style={{ color: '#D8CFC0' }}>+{(product.price_auec - product.market_ref_auec).toLocaleString()} aUEC</span>
              </div>
              <div className="flex justify-between text-[10px] pt-1 border-t font-bold" style={{ borderColor: '#2A2118' }}>
                <span style={{ color: '#C8A05B' }}>YOUR PRICE</span>
                <span style={{ color: '#E0A22E' }}>{product.price_auec.toLocaleString()} aUEC/{product.unit || 'SCU'}</span>
              </div>
              {product.repriced_at && (
                <p className="text-[9px]" style={{ color: '#6B6155' }}>
                  Anchored to UEX {new Date(product.repriced_at).toLocaleDateString()} — same margin on every ware. "Every credit accounted for."
                </p>
              )}
            </div>
          )}

          <SerialStrip seed={product.id} label="FSIS CERTIFIED" />

          {!inStock && product.category !== 'service' && <RestockNotify product={product} />}

          {/* Qty + add */}
          <div className="flex items-center gap-3">
            <div className="flex items-center border" style={{ borderColor: '#3A2F20' }}>
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-8 h-9 flex items-center justify-center hover:brightness-125" style={{ color: '#C8A05B' }}>
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-12 text-center text-sm font-bold" style={{ color: '#D8CFC0' }}>{qty}</span>
              <button onClick={() => setQty(Math.min(maxQty, qty + 1))} className="w-8 h-9 flex items-center justify-center hover:brightness-125" style={{ color: '#C8A05B' }}>
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <button
              disabled={!inStock}
              onClick={() => { onAdd(product, qty); onClose(); }}
              className="flex-1 h-9 rounded-full text-[11px] font-bold inline-flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none hover:brightness-110 transition-all"
              style={{
                background: 'linear-gradient(180deg, #E8B13A, #BD7E16)',
                color: '#1A1206',
                boxShadow: 'inset 0 1px 0 rgba(255, 235, 190, 0.4), 0 1px 3px rgba(0, 0, 0, 0.5)',
              }}
            >
              <ShoppingCart className="w-3.5 h-3.5" /> ADD {qty} TO MANIFEST — {(product.price_auec * qty).toLocaleString()} aUEC
            </button>
          </div>

          {/* Related wares */}
          {related.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[9px] tracking-[0.2em]" style={{ color: '#8A7E6C' }}>RELATED WARES</p>
              <div className="flex flex-wrap gap-1.5">
                {related.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onView(p)}
                    className="px-2.5 py-1 text-[10px] border hover:brightness-125 transition-all"
                    style={{ borderColor: '#3A2F20', color: '#C8A05B', background: '#121110' }}
                  >
                    {p.code || p.product_name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}