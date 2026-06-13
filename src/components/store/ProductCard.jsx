import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Pin } from 'lucide-react';
import { SalvageCrest, FabricatedCrest, ServiceCrest } from '@/components/brand/glyphs/CategoryCrests';
import HazardCorner from '@/components/brand/glyphs/HazardCorner';
import AddToCartControl from '@/components/store/AddToCartControl';
import CardRadialMenu from '@/components/store/CardRadialMenu';
import StoreTip from '@/components/store/StoreTip';
import CommodityIcon from '@/components/brand/CommodityIcon';
import SerialStrip from '@/components/brand/SerialStrip';
import MarketBadge from '@/components/store/MarketBadge';
import StockBar from '@/components/store/StockBar';
import { lotNumber } from '@/lib/fsisLore';

const PLATE_TEXTURE = 'https://media.base44.com/images/public/6a1e4ac9c80b7ea6253dc435/3910df846_generated_image.png';

const CATEGORY_META = {
  salvage_commodity: { label: 'SALVAGE', crest: SalvageCrest },
  fabricated: { label: 'FABRICATED', icon: FabricatedCrest, crest: FabricatedCrest },
  service: { label: 'SERVICE', icon: ServiceCrest, crest: ServiceCrest },
};

export default function ProductCard({ product, onAdd, onView, marketBest, inCartQty = 0, pinned = false, onTogglePin, onRestockNotify }) {
  const meta = CATEGORY_META[product.category] || CATEGORY_META.salvage_commodity;
  const inStock = (product.stock || 0) > 0 || product.category === 'service';
  const FallbackIcon = meta.icon;
  const inCart = inCartQty > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col group/card"
      style={{ perspective: 900 }}
    >
      <motion.div
        data-radial-host
        onClick={() => onView?.(product)}
        whileHover={{ rotateX: 2.5, rotateY: -2.5, y: -4 }}
        transition={{ type: 'spring', stiffness: 300, damping: 22 }}
        className="relative flex flex-col gap-3 p-4 border flex-1 cursor-pointer hover:brightness-110 transition-[filter] overflow-hidden"
        style={{
          borderColor: inCart ? '#C8893B' : '#5C4A33',
          boxShadow: inCart ? '0 0 16px rgba(212, 146, 11, 0.18), inset 0 0 18px rgba(212, 146, 11, 0.05)' : 'none',
          transformStyle: 'preserve-3d',
          clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)',
          backgroundImage: `linear-gradient(rgba(12, 11, 10, 0.45), rgba(12, 11, 10, 0.72)), url(${PLATE_TEXTURE})`,
          backgroundSize: 'cover',
        }}
      >
        {!inStock && <HazardCorner size={34} />}
        {/* Radial context menu — right-click / long-press */}
        <CardRadialMenu
          product={product}
          pinned={pinned}
          inStock={inStock}
          onAdd={onAdd}
          onView={onView}
          onTogglePin={onTogglePin}
          onRestockNotify={onRestockNotify}
        />
        {/* Sheen sweep on hover */}
        <span
          className="absolute inset-y-0 w-1/3 pointer-events-none -left-1/2 group-hover/card:left-[120%] transition-[left] duration-700 ease-out"
          style={{ background: 'linear-gradient(105deg, transparent, rgba(232, 177, 58, 0.10), transparent)' }}
        />
        <div className="flex items-start justify-between">
          <div
            className="w-12 h-12 flex items-center justify-center border"
            style={{ borderColor: '#4A3B28', background: 'rgba(10, 9, 7, 0.6)' }}
          >
            {product.category === 'salvage_commodity' || !FallbackIcon ? (
              <CommodityIcon code={product.code} size={34} />
            ) : (
              <FallbackIcon className="w-5 h-5" style={{ color: '#6FA08F' }} />
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1.5">
              <StoreTip label={pinned ? 'UNPIN' : 'PIN TO TOP'} desc="Pinned wares stay at the top of the catalog on this device.">
                <button
                  onClick={(e) => { e.stopPropagation(); onTogglePin?.(product.id); }}
                  className="p-1 border hover:brightness-125 transition-all"
                  style={{ borderColor: pinned ? '#C8893B' : '#2E2519', background: 'rgba(10, 9, 7, 0.6)' }}
                >
                  <Pin className="w-3 h-3" style={{ color: pinned ? '#F0B43A' : '#6B6155', fill: pinned ? '#F0B43A' : 'none' }} />
                </button>
              </StoreTip>
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[9px] font-mono font-bold tracking-[0.15em]"
                style={{
                  background: 'linear-gradient(180deg, #5C8273, #3A5A4E)',
                  color: '#0D1411',
                  clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)',
                }}
              >
                {meta.crest && <meta.crest className="w-2.5 h-2.5" />}
                {meta.label}
              </span>
            </div>
            {inCart && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-[8px] font-mono font-bold tracking-[0.15em] border"
                style={{ borderColor: '#C8893B', color: '#E0A22E', background: 'rgba(212, 146, 11, 0.1)' }}
              >
                <ShoppingCart className="w-2.5 h-2.5" /> IN MANIFEST ×{inCartQty}
              </motion.span>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-mono text-[15px] font-bold leading-snug" style={{ color: '#EDE5D6' }}>
            {product.product_name}
            {product.code && <span className="ml-2 text-xs" style={{ color: '#6FA08F' }}>[{product.code}]</span>}
          </h3>
          {product.description && (
            <p className="text-[11px] mt-1 leading-relaxed" style={{ color: '#877D6D' }}>{product.description}</p>
          )}
        </div>

        <div className="mt-auto space-y-2">
          <SerialStrip seed={product.id} label="FSIS CERTIFIED" />
          <div className="font-mono space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span>
                <span className="text-2xl font-bold tracking-tight" style={{ color: '#F0B43A', textShadow: '0 0 14px rgba(240, 180, 58, 0.18)' }}>{product.price_auec.toLocaleString()}</span>
                <span className="text-[10px] ml-1.5" style={{ color: '#6B6155' }}>aUEC/{product.unit || 'SCU'}</span>
              </span>
              <MarketBadge price={product.price_auec} marketBest={marketBest} />
            </div>
            {product.category === 'service' ? (
              <div className="text-[10px]" style={{ color: '#9C9080' }}>On request</div>
            ) : (
              <StockBar stock={product.stock || 0} unit={product.unit || 'SCU'} />
            )}
          </div>
          <div className="flex items-center justify-between">
            <StoreTip label="LOT SERIAL" desc="FSIS reclamation lot number — quoted on your delivery manifest.">
              <span className="font-mono text-[9px] px-2 py-1 border" style={{ borderColor: '#2E2519', color: '#6B6155' }}>
                {lotNumber(product.id)}
              </span>
            </StoreTip>
            <StoreTip label={inStock ? 'LOAD CRATE' : 'OUT OF STOCK'} desc={inStock ? 'Add one unit to your order manifest. Adjust quantity in the manifest panel.' : 'This ware is awaiting restock from salvage ops.'}>
              <span onClick={(e) => e.stopPropagation()}>
                <AddToCartControl disabled={!inStock} onAdd={() => onAdd(product)} />
              </span>
            </StoreTip>
          </div>
        </div>
      </motion.div>

      {/* Category tab */}
      <div
        className="mx-auto px-7 py-0.5 text-[9px] font-mono tracking-[0.25em]"
        style={{
          background: 'linear-gradient(180deg, #233530, #161F1C)',
          color: '#6FA08F',
          clipPath: 'polygon(0 0, 100% 0, calc(100% - 10px) 100%, 10px 100%)',
        }}
      >
        {meta.label}
      </div>
    </motion.div>
  );
}