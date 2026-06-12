import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Factory, Store, MapPin } from 'lucide-react';
import { matCategoryMeta } from '@/components/matdex/matdexMeta';
import SerialStrip from '@/components/brand/SerialStrip';

const panel = { borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 8%)' };

export default function MaterialDetail({ material, onOpenApp }) {
  const meta = matCategoryMeta(material.category);
  const Icon = meta.icon;

  const { data: prices = [] } = useQuery({
    queryKey: ['matdex_prices', material.code],
    queryFn: () => base44.entities.commodity_price.filter({ commodity_code: material.code }),
    enabled: !!material.code,
  });

  const { data: recipes = [] } = useQuery({
    queryKey: ['crafting_recipes'],
    queryFn: () => base44.entities.crafting_recipe.list('-created_date'),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products_all'],
    queryFn: () => base44.entities.product.list('sort_order'),
  });

  const topPrices = [...prices].sort((a, b) => (b.price_sell || 0) - (a.price_sell || 0)).slice(0, 5);
  const usedIn = recipes.filter((r) =>
    (r.materials || []).some((m) => (m.code && m.code === material.code) || m.material_name === material.material_name)
  );
  const listedProducts = products.filter((p) => p.code && p.code === material.code);

  return (
    <div className="space-y-4 font-mono">
      {/* Header */}
      <div className="p-4 rounded border" style={panel}>
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded flex items-center justify-center shrink-0 border" style={{ borderColor: 'hsl(33, 18%, 22%)', background: 'hsl(30, 10%, 6%)' }}>
            <Icon className="w-6 h-6" style={{ color: meta.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-foreground">
              {material.material_name}
              {material.code && <span className="ml-2 text-primary">[{material.code}]</span>}
            </h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[9px] px-1.5 py-0.5 rounded tracking-[0.15em]" style={{ background: `${meta.color.replace(')', ' / 0.15)')}`, color: meta.color }}>
                {meta.label}
              </span>
              {material.grade && <span className="text-[9px] text-muted-foreground">GRADE: {material.grade}</span>}
              {material.salvage_derived && <span className="text-[9px] text-primary">◆ SALVAGE-DERIVED</span>}
            </div>
          </div>
        </div>
        {material.description && (
          <p className="text-xs text-muted-foreground leading-relaxed mt-3">{material.description}</p>
        )}
        <div className="flex items-center justify-between mt-3">
          {material.ref_value_auec ? (
            <div>
              <span className="text-lg font-bold text-primary">{material.ref_value_auec.toLocaleString()}</span>
              <span className="text-[9px] text-muted-foreground ml-1">aUEC/{material.unit || 'SCU'} ref</span>
            </div>
          ) : <span className="text-[9px] text-muted-foreground">No reference value</span>}
          <SerialStrip seed={material.id} label="FSIS MATDEX" />
        </div>
      </div>

      {/* Sources */}
      {(material.sources || []).length > 0 && (
        <div className="p-3 rounded border space-y-1.5" style={panel}>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground tracking-[0.2em]">
            <MapPin className="w-3 h-3 text-primary" /> ACQUISITION SOURCES
          </div>
          {material.sources.map((s, i) => (
            <div key={i} className="text-xs text-foreground/90 flex items-center gap-2">
              <span className="text-primary text-[8px]">▸</span> {s}
            </div>
          ))}
        </div>
      )}

      {/* Live market prices */}
      {material.code && (
        <div className="p-3 rounded border space-y-1.5" style={panel}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground tracking-[0.2em]">
              <TrendingUp className="w-3 h-3 text-primary" /> LIVE MARKET — BEST SELL TERMINALS
            </div>
            {onOpenApp && topPrices.length > 0 && (
              <button onClick={() => onOpenApp('salvage')} className="text-[9px] text-primary hover:underline">OPEN SALVAGE →</button>
            )}
          </div>
          {topPrices.length === 0 ? (
            <p className="text-[10px] text-muted-foreground">No UEX price data cached for {material.code}.</p>
          ) : topPrices.map((p) => (
            <div key={p.id} className="flex justify-between text-xs">
              <span className="text-foreground/90 truncate">{p.terminal_name}{p.star_system ? ` — ${p.star_system}` : ''}</span>
              <span className="text-primary font-bold shrink-0 ml-2">{(p.price_sell || 0).toLocaleString()} aUEC</span>
            </div>
          ))}
        </div>
      )}

      {/* Used in recipes */}
      <div className="p-3 rounded border space-y-1.5" style={panel}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground tracking-[0.2em]">
            <Factory className="w-3 h-3 text-primary" /> USED IN FABRICATION
          </div>
          {onOpenApp && usedIn.length > 0 && (
            <button onClick={() => onOpenApp('fabrication')} className="text-[9px] text-primary hover:underline">OPEN FABRICATION →</button>
          )}
        </div>
        {usedIn.length === 0 ? (
          <p className="text-[10px] text-muted-foreground">Not referenced by any cached recipe.</p>
        ) : usedIn.map((r) => {
          const req = (r.materials || []).find((m) => m.code === material.code || m.material_name === material.material_name);
          return (
            <div key={r.id} className="flex justify-between text-xs">
              <span className="text-foreground/90 truncate">{r.item_name}</span>
              <span className="text-muted-foreground shrink-0 ml-2">{req?.quantity || '?'} {req?.unit || ''}</span>
            </div>
          );
        })}
      </div>

      {/* Storefront listing */}
      {listedProducts.length > 0 && (
        <div className="p-3 rounded border space-y-1.5" style={panel}>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground tracking-[0.2em]">
            <Store className="w-3 h-3 text-primary" /> LISTED ON STOREFRONT
          </div>
          {listedProducts.map((p) => (
            <div key={p.id} className="flex justify-between text-xs">
              <span className="text-foreground/90 truncate">{p.product_name} {!p.available && <span className="text-muted-foreground">(unlisted)</span>}</span>
              <span className="text-primary font-bold shrink-0 ml-2">{p.price_auec.toLocaleString()} aUEC/{p.unit || 'SCU'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}