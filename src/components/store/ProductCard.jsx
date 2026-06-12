import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Recycle, Hammer, Wrench, Plus } from 'lucide-react';

const CATEGORY_META = {
  salvage_commodity: { label: 'SALVAGE', icon: Recycle },
  fabricated: { label: 'FABRICATED', icon: Hammer },
  service: { label: 'SERVICE', icon: Wrench },
};

export default function ProductCard({ product, onAdd }) {
  const meta = CATEGORY_META[product.category] || CATEGORY_META.salvage_commodity;
  const Icon = meta.icon;
  const inStock = (product.stock || 0) > 0 || product.category === 'service';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border p-4 flex flex-col gap-3 xian-panel hover:xian-border-glow transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="w-9 h-9 rounded flex items-center justify-center" style={{ background: 'hsl(168, 65%, 45%, 0.12)' }}>
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <Badge variant="outline" className="text-[9px] font-mono border-primary/30 text-primary">{meta.label}</Badge>
      </div>

      <div>
        <h3 className="font-mono text-sm font-bold text-foreground">
          {product.product_name}
          {product.code && <span className="text-primary ml-2 text-xs">[{product.code}]</span>}
        </h3>
        {product.description && (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{product.description}</p>
        )}
      </div>

      <div className="mt-auto flex items-end justify-between">
        <div>
          <div className="font-mono text-lg font-bold text-primary xian-glow-subtle">
            {product.price_auec.toLocaleString()} <span className="text-[10px] text-muted-foreground">aUEC/{product.unit || 'SCU'}</span>
          </div>
          <div className="text-[10px] font-mono text-muted-foreground">
            {product.category === 'service' ? 'On request' : inStock ? `${product.stock} ${product.unit || 'SCU'} in stock` : 'Out of stock'}
          </div>
        </div>
        <Button size="sm" className="h-8 text-[10px] font-mono gap-1" disabled={!inStock} onClick={() => onAdd(product)}>
          <Plus className="w-3 h-3" /> ADD
        </Button>
      </div>
    </motion.div>
  );
}