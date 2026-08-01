import React from 'react';
import CatalogQuickFilters from '@/components/store/CatalogQuickFilters';
import StoreGuidedFinder from '@/components/store/StoreGuidedFinder';

/** Narrow left console rail: diagnostics filters + guided finder, scrolls internally. */
export default function CatalogSideRail({ quickFilter, onQuickFilter, products, marketBestByCode, onChoose }) {
  return (
    <aside
      className="hidden min-[1400px]:flex flex-col min-h-0 border overflow-y-auto p-2 space-y-3"
      style={{ borderColor: '#2A2118', background: 'rgba(10,8,6,0.72)' }}
    >
      <div className="font-mono text-[8px] tracking-[0.26em] px-1" style={{ color: '#7A6E60' }}>// DIAGNOSTICS</div>
      <CatalogQuickFilters active={quickFilter} onChange={onQuickFilter} products={products} marketBestByCode={marketBestByCode} />
      <div className="font-mono text-[8px] tracking-[0.26em] px-1 pt-1" style={{ color: '#7A6E60' }}>// GUIDED FINDER</div>
      <StoreGuidedFinder onChoose={onChoose} />
    </aside>
  );
}