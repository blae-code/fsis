import React from 'react';

const FILTERS = [
  { key: 'all', label: 'ALL' },
  { key: 'in_stock', label: 'IN STOCK' },
  { key: 'bulk_ready', label: 'BULK READY' },
  { key: 'best_value', label: 'BEST VALUE' },
  { key: 'low_stock', label: 'LOW STOCK' },
  { key: 'services', label: 'SERVICES' },
];

export function matchesQuickFilter(product, filter, marketBestByCode = {}) {
  if (filter === 'all') return true;
  const stock = product.stock || 0;
  const marketBest = product.code ? marketBestByCode[product.code] : 0;
  if (filter === 'in_stock') return product.category === 'service' || stock > 0;
  if (filter === 'bulk_ready') return product.category !== 'service' && stock >= 100;
  if (filter === 'best_value') return Boolean(marketBest && product.price_auec <= marketBest);
  if (filter === 'low_stock') return product.category !== 'service' && stock > 0 && stock < 50;
  if (filter === 'services') return product.category === 'service';
  return true;
}

export default function CatalogQuickFilters({ active, onChange, products = [], marketBestByCode = {} }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto font-mono pb-1">
      <span className="text-[8px] tracking-[0.2em] shrink-0" style={{ color: '#6FA08F' }}>DIAG FILTERS</span>
      {FILTERS.map((filter) => {
        const isActive = active === filter.key;
        const count = products.filter((p) => matchesQuickFilter(p, filter.key, marketBestByCode)).length;
        return (
          <button key={filter.key} type="button" onClick={() => onChange(filter.key)} className="shrink-0 border px-2.5 py-1 text-[8px] font-bold tracking-[0.12em] hover:brightness-125" style={{ borderColor: isActive ? '#B0793A' : '#2A2118', color: isActive ? '#E0A22E' : '#8A7E6C', background: isActive ? 'rgba(212,146,11,0.1)' : '#0C0A07' }}>
            {filter.label} <span style={{ color: '#5F5548' }}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}