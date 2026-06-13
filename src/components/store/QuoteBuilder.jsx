import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DELIVERY_LOCATIONS, VOLUME_TIERS, volumeDiscount } from '@/lib/storeLocations';

const fieldStyle = { borderColor: '#3A2F20', background: '#0E0C09', color: '#D8CFC0' };

/** Bulk Quote Builder — itemized "show the math" quoting with volume tiers, one click to load the manifest */
export default function QuoteBuilder({ products = [], onLoad }) {
  const goods = products.filter((p) => p.category !== 'service');
  const [productId, setProductId] = useState('');
  const [qty, setQty] = useState(500);
  const [loc, setLoc] = useState('');

  const product = goods.find((p) => p.id === productId);
  const pct = volumeDiscount(qty);
  const subtotal = product ? product.price_auec * qty : 0;
  const discount = Math.round((subtotal * pct) / 100);
  const total = subtotal - discount;
  const locMeta = DELIVERY_LOCATIONS.find((l) => l.name === loc);
  const backorder = product && product.category !== 'service' && qty > (product.stock || 0);

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center gap-2 font-mono text-xs tracking-[0.2em]" style={{ color: '#C8A05B' }}>
        <Calculator className="w-3.5 h-3.5" /> BULK QUOTE BUILDER
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label className="text-[10px] font-mono" style={{ color: '#8A7E6C' }}>WARE</Label>
          <Select value={productId} onValueChange={setProductId}>
            <SelectTrigger className="h-8 text-xs font-mono" style={fieldStyle}>
              <SelectValue placeholder="Select ware" />
            </SelectTrigger>
            <SelectContent>
              {goods.map((p) => (
                <SelectItem key={p.id} value={p.id} className="text-xs font-mono">
                  {p.code ? `${p.code} — ` : ''}{p.product_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-mono" style={{ color: '#8A7E6C' }}>QUANTITY ({product?.unit || 'SCU'})</Label>
          <Input
            type="number" min="1" value={qty}
            onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
            className="h-8 text-xs font-mono" style={fieldStyle}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px] font-mono" style={{ color: '#8A7E6C' }}>DELIVERY TO</Label>
          <Select value={loc} onValueChange={setLoc}>
            <SelectTrigger className="h-8 text-xs font-mono" style={fieldStyle}>
              <SelectValue placeholder="Destination" />
            </SelectTrigger>
            <SelectContent>
              {DELIVERY_LOCATIONS.map((l) => (
                <SelectItem key={l.name} value={l.name} className="text-xs font-mono">
                  {l.name} — {l.region}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Itemized math — FairShare: a quote must show its work */}
      {product && (
        <div className="border p-4 font-mono space-y-1.5" style={{ borderColor: '#5C4A33', background: '#14110D' }}>
          <p className="text-[9px] tracking-[0.25em] mb-2" style={{ color: '#B0793A' }}>// QUOTE — EVERY CREDIT ACCOUNTED FOR</p>
          <div className="flex justify-between text-[11px]">
            <span style={{ color: '#9C9080' }}>{product.code || product.product_name} × {qty.toLocaleString()} {product.unit || 'SCU'} @ {product.price_auec.toLocaleString()}</span>
            <span style={{ color: '#D8CFC0' }}>{subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span style={{ color: '#9C9080' }}>VOLUME DISCOUNT {pct > 0 ? `(${pct}%)` : '(none — see tiers below)'}</span>
            <span style={{ color: pct > 0 ? '#7BA05B' : '#6B6155' }}>{pct > 0 ? `−${discount.toLocaleString()}` : '0'}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span style={{ color: '#9C9080' }}>DELIVERY{locMeta ? ` — ${locMeta.name}` : ''}</span>
            <span style={{ color: '#7BA05B' }}>INCLUDED{locMeta ? ` • EST ${locMeta.eta}` : ''}</span>
          </div>
          <div className="flex justify-between text-sm font-bold border-t pt-2 mt-1" style={{ borderColor: '#3A2F20' }}>
            <span style={{ color: '#D8CFC0' }}>EST. TOTAL</span>
            <span style={{ color: '#E0A22E' }}>{total.toLocaleString()} aUEC</span>
          </div>
          {backorder && (
            <p className="text-[9px]" style={{ color: '#C8893B' }}>
              ⚠ Exceeds current stock ({product.stock || 0} {product.unit || 'SCU'}) — balance fulfilled as backorder.
            </p>
          )}
          <p className="text-[9px]" style={{ color: '#6B6155' }}>
            Volume discount is confirmed by the operator at order confirmation.
          </p>
          <motion.button
            onClick={() => onLoad(product, qty, loc)}
            whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(232,177,58,0.3)' }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            className="mt-2 w-full h-9 font-mono text-xs font-bold rounded-full inline-flex items-center justify-center gap-1.5"
            style={{ background: 'linear-gradient(180deg, #E8B13A, #BD7E16)', color: '#1A1206' }}
          >
            LOAD INTO MANIFEST <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      )}

      {/* Tier reference */}
      <div className="flex flex-wrap gap-2">
        {VOLUME_TIERS.slice().reverse().map((t) => (
          <motion.span
            key={t.min}
            whileHover={{ borderColor: '#8A6430', color: '#E0C27E', y: -1 }}
            transition={{ duration: 0.15 }}
            className="px-2.5 py-1 border font-mono text-[9px] tracking-[0.1em] cursor-default"
            style={{ borderColor: '#3A2F20', color: '#C8A05B', background: '#121110' }}
          >
            ≥ {t.min.toLocaleString()} SCU → {t.pct}% OFF
          </motion.span>
        ))}
      </div>
    </div>
  );
}