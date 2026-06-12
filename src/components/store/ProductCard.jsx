import React from 'react';
import { motion } from 'framer-motion';
import { Hammer, Wrench, Plus } from 'lucide-react';
import CommodityIcon from '@/components/brand/CommodityIcon';
import SerialStrip from '@/components/brand/SerialStrip';
import { lotNumber } from '@/lib/fsisLore';

const PLATE_TEXTURE = 'https://media.base44.com/images/public/6a1e4ac9c80b7ea6253dc435/3910df846_generated_image.png';

const CATEGORY_META = {
  salvage_commodity: { label: 'SALVAGE' },
  fabricated: { label: 'FABRICATED', icon: Hammer },
  service: { label: 'SERVICE', icon: Wrench },
};

export default function ProductCard({ product, onAdd, onView }) {
  const meta = CATEGORY_META[product.category] || CATEGORY_META.salvage_commodity;
  const inStock = (product.stock || 0) > 0 || product.category === 'service';
  const FallbackIcon = meta.icon;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col">
      <div
        onClick={() => onView?.(product)}
        className="relative flex flex-col gap-3 p-4 border flex-1 cursor-pointer hover:brightness-110 transition-all"
        style={{
          borderColor: '#5C4A33',
          clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)',
          backgroundImage: `linear-gradient(rgba(12, 11, 10, 0.45), rgba(12, 11, 10, 0.72)), url(${PLATE_TEXTURE})`,
          backgroundSize: 'cover',
        }}
      >
        <div className="flex items-start justify-between">
          <div
            className="w-12 h-12 flex items-center justify-center border"
            style={{ borderColor: '#4A3B28', background: 'rgba(10, 9, 7, 0.6)' }}
          >
            {product.category === 'salvage_commodity' || !FallbackIcon ? (
              <CommodityIcon code={product.code} size={34} />
            ) : (
              <FallbackIcon className="w-5 h-5" style={{ color: '#E0A22E' }} />
            )}
          </div>
          <span
            className="px-2.5 py-1 text-[9px] font-mono font-bold tracking-[0.15em]"
            style={{
              background: 'linear-gradient(180deg, #A87C42, #6E4D24)',
              color: '#15100A',
              clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)',
            }}
          >
            {meta.label}
          </span>
        </div>

        <div>
          <h3 className="font-mono text-sm font-bold" style={{ color: '#D8CFC0' }}>
            {product.product_name}
            {product.code && <span className="ml-2 text-xs" style={{ color: '#E0A22E' }}>[{product.code}]</span>}
          </h3>
          {product.description && (
            <p className="text-xs mt-1 leading-relaxed" style={{ color: '#9C9080' }}>{product.description}</p>
          )}
        </div>

        <div className="mt-auto space-y-2">
          <SerialStrip seed={product.id} label="FSIS CERTIFIED" />
          <div className="font-mono">
            <span className="text-xl font-bold" style={{ color: '#E0A22E' }}>{product.price_auec.toLocaleString()}</span>
            <span className="text-[10px] ml-1.5" style={{ color: '#8A7E6C' }}>aUEC/{product.unit || 'SCU'}</span>
            <div className="text-[10px]" style={{ color: '#9C9080' }}>
              {product.category === 'service' ? 'On request' : inStock ? `${product.stock} ${product.unit || 'SCU'} in stock` : 'Out of stock'}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] px-2 py-1 border" style={{ borderColor: '#3A2F20', color: '#8A7E6C' }}>
              {lotNumber(product.id)}
            </span>
            <button
              disabled={!inStock}
              onClick={(e) => { e.stopPropagation(); onAdd(product); }}
              className="h-8 px-5 rounded-full font-mono text-[11px] font-bold inline-flex items-center gap-1 disabled:opacity-40 disabled:pointer-events-none hover:brightness-110 transition-all"
              style={{
                background: 'linear-gradient(180deg, #E8B13A, #BD7E16)',
                color: '#1A1206',
                boxShadow: 'inset 0 1px 0 rgba(255, 235, 190, 0.4), 0 1px 3px rgba(0, 0, 0, 0.5)',
              }}
            >
              <Plus className="w-3 h-3" strokeWidth={3} /> ADD
            </button>
          </div>
        </div>
      </div>

      {/* Category tab */}
      <div
        className="mx-auto px-7 py-0.5 text-[9px] font-mono tracking-[0.25em]"
        style={{
          background: 'linear-gradient(180deg, #3A2F20, #241C12)',
          color: '#C8A05B',
          clipPath: 'polygon(0 0, 100% 0, calc(100% - 10px) 100%, 10px 100%)',
        }}
      >
        {meta.label}
      </div>
    </motion.div>
  );
}