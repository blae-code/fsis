import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Pin, GitCompare } from 'lucide-react';
import RestockNotifyModal from '@/components/store/RestockNotifyModal';
import { SalvageCrest, FabricatedCrest, ServiceCrest } from '@/components/brand/glyphs/CategoryCrests';
import HazardCorner from '@/components/brand/glyphs/HazardCorner';
import AddToCartControl from '@/components/store/AddToCartControl';
import CardRadialMenu from '@/components/store/CardRadialMenu';
import StoreTip from '@/components/store/StoreTip';
import CommodityIcon from '@/components/brand/CommodityIcon';
import MarketBadge from '@/components/store/MarketBadge';
import StockBar from '@/components/store/StockBar';
import { roundPrice } from '@/lib/pricing';
import { lotNumber } from '@/lib/fsisLore';

const PLATE_TEXTURE = 'https://media.base44.com/images/public/6a1e4ac9c80b7ea6253dc435/3910df846_generated_image.png';

const CATEGORY_META = {
  salvage_commodity: { label: 'SALVAGE', crest: SalvageCrest, accent: '#8A8F45', dark: '#263E36', text: '#0D1411' },
  fabricated: { label: 'FABRICATED', icon: FabricatedCrest, crest: FabricatedCrest, accent: '#C8893B', dark: '#5A3718', text: '#1A1006' },
  service: { label: 'SERVICE', icon: ServiceCrest, crest: ServiceCrest, accent: '#A35A2A', dark: '#4A2A18', text: '#1A0C06' },
  fps_gear: { label: 'GEAR', crest: ServiceCrest, accent: '#8A8F45', dark: '#3C3D20', text: '#111207' },
  weapon: { label: 'WEAPON', crest: ServiceCrest, accent: '#C05050', dark: '#5A2222', text: '#1C0808' },
  ship_component: { label: 'COMPONENT', crest: FabricatedCrest, accent: '#8F5A32', dark: '#4A321F', text: '#160C06' },
  vehicle_component: { label: 'VEH COMP', crest: FabricatedCrest, accent: '#B86F4F', dark: '#5A2F1F', text: '#1A0C06' },
};

const CONDITION_COLOR = { new: '#7BA05B', refurb: '#8A8F45', used: '#C8893B', worn: '#C05050' };
const REDSCAR_DISCOUNT_PERCENT = 10;

/** Compact catalog plate — dense readout, single primary CTA, no wasted vertical space. */
export default function ProductCard({ product, onAdd, onView, marketBest, inCartQty = 0, pinned = false, onTogglePin, onRestockNotify, compareSelected = false, onToggleCompare }) {
  const meta = CATEGORY_META[product.category] || CATEGORY_META.salvage_commodity;
  const accent = meta.accent || '#8A8F45';
  const darkAccent = meta.dark || '#263E36';
  const inStock = (product.stock || 0) > 0 || product.category === 'service';
  const FallbackIcon = meta.icon;
  const inCart = inCartQty > 0;
  const displayPrice = roundPrice(product.price_auec || 0);
  const redscarPrice = Math.max(0, roundPrice(displayPrice * (100 - REDSCAR_DISCOUNT_PERCENT) / 100));
  const isBestValue = marketBest && redscarPrice < marketBest;
  const availabilityLabel = product.category === 'service' ? 'ON REQUEST' : !inStock ? 'RESERVE QUEUE' : (product.stock || 0) < 50 ? 'LIMITED' : 'READY NOW';
  const availabilityColor = product.category === 'service' ? '#C8893B' : !inStock ? '#C05050' : (product.stock || 0) < 50 ? '#E0A22E' : '#8A8F45';
  const [showRestockModal, setShowRestockModal] = useState(false);
  const cond = CONDITION_COLOR[product.condition_grade] || '#7A6E60';

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col group/card h-full">
      <motion.div
        data-radial-host
        onClick={() => onView?.(product)}
        whileHover={{ y: -3 }}
        transition={{ type: 'spring', stiffness: 320, damping: 24 }}
        className="relative flex flex-col gap-1.5 p-2.5 border flex-1 cursor-pointer hover:brightness-110 transition-[filter] overflow-hidden"
        style={{
          borderColor: inCart ? '#E0A22E' : `${accent}66`,
          boxShadow: inCart ? '0 10px 26px rgba(0,0,0,0.4), 0 0 16px rgba(224, 162, 46, 0.18)' : '0 8px 22px rgba(0,0,0,0.3)',
          clipPath: 'polygon(11px 0, 100% 0, 100% calc(100% - 11px), calc(100% - 11px) 100%, 0 100%, 0 11px)',
          backgroundImage: `linear-gradient(180deg, rgba(255, 224, 154, 0.05), transparent 16%), radial-gradient(circle at 90% 8%, ${accent}26, transparent 28%), linear-gradient(rgba(10, 8, 6, 0.62), rgba(10, 8, 6, 0.88)), url(${PLATE_TEXTURE})`,
          backgroundSize: 'cover',
        }}
      >
        {!inStock && <HazardCorner size={24} />}
        <CardRadialMenu product={product} pinned={pinned} inStock={inStock} onAdd={onAdd} onView={onView} onTogglePin={onTogglePin} onRestockNotify={onRestockNotify} />
        <span
          className="absolute inset-y-0 w-1/3 pointer-events-none -left-1/2 group-hover/card:left-[120%] transition-[left] duration-700 ease-out"
          style={{ background: 'linear-gradient(105deg, transparent, rgba(232, 177, 58, 0.09), transparent)' }}
        />

        {/* Identity row */}
        <div className="flex items-start gap-2">
          <div className="w-8 h-8 shrink-0 flex items-center justify-center border" style={{ borderColor: `${accent}55`, background: `linear-gradient(145deg, rgba(10, 9, 7, 0.72), ${darkAccent}44)` }}>
            {product.category === 'salvage_commodity' || !FallbackIcon ? <CommodityIcon code={product.code} size={22} /> : <FallbackIcon className="w-4 h-4" style={{ color: accent }} />}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-mono text-[12px] font-bold leading-tight truncate" style={{ color: '#EDE5D6' }}>
              {product.product_name}
              {product.code && <span className="ml-1.5 text-[10px]" style={{ color: accent }}>[{product.code}]</span>}
            </h3>
            <div className="flex items-center gap-1 mt-0.5 font-mono text-[7px] tracking-[0.14em]" style={{ color: '#6B6155' }}>
              <span style={{ color: accent }}>{meta.label}</span>
              <span>·</span>
              <span>{lotNumber(product.id)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {onToggleCompare && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleCompare(product.id); }}
                title="Compare"
                className="p-1 border hover:brightness-125 transition-all"
                style={{ borderColor: compareSelected ? '#8A8F45' : '#2E2519', background: 'rgba(10, 9, 7, 0.6)' }}
              >
                <GitCompare className="w-2.5 h-2.5" style={{ color: compareSelected ? '#9ED0BD' : '#6B6155' }} />
              </button>
            )}
            <StoreTip label={pinned ? 'UNPIN' : 'PIN TO TOP'} desc="Pinned wares stay at the top of the catalog on this device.">
              <button
                onClick={(e) => { e.stopPropagation(); onTogglePin?.(product.id); }}
                className="p-1 border hover:brightness-125 transition-all"
                style={{ borderColor: pinned ? '#C8893B' : '#2E2519', background: 'rgba(10, 9, 7, 0.6)' }}
              >
                <Pin className="w-2.5 h-2.5" style={{ color: pinned ? '#F0B43A' : '#6B6155', fill: pinned ? '#F0B43A' : 'none' }} />
              </button>
            </StoreTip>
          </div>
        </div>

        {/* Status chips */}
        <div className="flex flex-wrap items-center gap-1 font-mono text-[7px] font-bold tracking-[0.12em]">
          <span className="px-1.5 py-0.5 border" style={{ borderColor: `${availabilityColor}55`, color: availabilityColor, background: `${availabilityColor}14` }}>{availabilityLabel}</span>
          {product.condition_grade && (
            <span className="px-1.5 py-0.5 border" style={{ borderColor: `${cond}55`, color: cond, background: `${cond}18` }}>
              {product.condition_grade.toUpperCase()}{product.condition_pct != null ? ` ${product.condition_pct}%` : ''}
            </span>
          )}
          {product.size_class && product.size_class !== 'N/A' && (
            <span className="px-1.5 py-0.5 border" style={{ borderColor: '#8A8F4544', color: '#8A8F45', background: '#8A8F4514' }}>{product.size_class}</span>
          )}
          {isBestValue && <span className="px-1.5 py-0.5 border" style={{ borderColor: '#8A8F4566', color: '#9ED0BD', background: 'rgba(111,160,143,0.12)' }}>BEST VALUE</span>}
          {inCart && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 border" style={{ borderColor: '#C8893B', color: '#E0A22E', background: 'rgba(212, 146, 11, 0.1)' }}>
              <ShoppingCart className="w-2 h-2" /> ×{inCartQty}
            </span>
          )}
        </div>

        {product.description && (
          <p className="text-[10px] leading-snug line-clamp-2" style={{ color: '#877D6D' }}>{product.description}</p>
        )}

        {/* Readout + CTA */}
        <div className="mt-auto space-y-1.5 font-mono">
          <div className="flex items-end justify-between gap-2">
            <div className="leading-none">
              <span className="text-lg font-bold tracking-tight" style={{ color: '#F0B43A' }}>{displayPrice.toLocaleString()}</span>
              <span className="text-[8px] ml-1" style={{ color: '#6B6155' }}>aUEC/{product.unit || 'SCU'}</span>
              <div className="text-[8px] mt-0.5" style={{ color: '#E8C56A' }}>
                REDSCAR <span className="font-bold" style={{ color: '#F2D98A' }}>{redscarPrice.toLocaleString()}</span>
              </div>
            </div>
            <MarketBadge price={displayPrice} marketBest={marketBest} />
          </div>
          {product.category !== 'service' && <StockBar stock={product.stock || 0} unit={product.unit || 'SCU'} />}
          {inStock ? (
            <StoreTip label="LOAD CRATE" desc="Add one unit to your order manifest. Adjust quantity in the manifest panel.">
              <span onClick={(e) => e.stopPropagation()} className="block">
                <AddToCartControl disabled={false} onAdd={() => onAdd(product)} />
              </span>
            </StoreTip>
          ) : (
            <StoreTip label="RESERVE NEXT FOUND" desc="Request a reserve and FSIS will hold the next found stock before it returns to public inventory.">
              <span onClick={(e) => { e.stopPropagation(); setShowRestockModal(true); }} className="block">
                <AddToCartControl disabled={true} onAdd={() => {}} notifyMode />
              </span>
            </StoreTip>
          )}
        </div>
      </motion.div>

      {showRestockModal && <RestockNotifyModal product={product} onClose={() => setShowRestockModal(false)} />}
    </motion.div>
  );
}