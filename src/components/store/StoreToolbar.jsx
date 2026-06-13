import React, { useId } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import StoreTip, { Kbd } from '@/components/store/StoreTip';
import CategoryRadialMenu from '@/components/store/CategoryRadialMenu';


const SORTS = [
  { key: 'featured',   label: 'FEATURED' },
  { key: 'price_asc',  label: '↑ PRICE' },
  { key: 'price_desc', label: '↓ PRICE' },
  { key: 'stock',      label: 'STOCK' },
];

export default function StoreToolbar({ search, setSearch, category, setCategory, sort, setSort, count }) {
  const sortId = useId();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 font-mono flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-[160px]">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#8A7E6C' }} />
        <input
          id="store-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search the catalog..."
          className="w-full h-9 pl-9 pr-10 text-xs bg-transparent border outline-none focus:brightness-125 transition-all"
          style={{
            borderColor: '#3A2F20',
            color: '#D8CFC0',
            clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
            background: 'rgba(10, 9, 7, 0.5)',
          }}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Kbd>/</Kbd>
        </span>
      </div>

      {/* Category radial menu */}
      <CategoryRadialMenu category={category} setCategory={setCategory} />

      {/* Sort segmented switch */}
      <div
        className="relative flex h-9 p-0.5 shrink-0"
        style={{ background: '#0C0A07', border: '1px solid #1E2E28', clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
      >
        {SORTS.map(({ key, label }) => {
          const active = sort === key;
          return (
            <button
              key={key}
              onClick={() => setSort(key)}
              className="relative px-2.5 h-full text-[9px] tracking-[0.1em] font-bold transition-colors"
              style={{ color: active ? '#F4ECDB' : '#4A6B5A', zIndex: 1 }}
            >
              {active && (
                <motion.span
                  layoutId={`sort-${sortId}`}
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(160deg, #233530, #141F1C)',
                    border: '1px solid #3C5A50',
                    clipPath: 'polygon(5px 0, 100% 0, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0 100%, 0 5px)',
                  }}
                  transition={{ type: 'spring', stiffness: 480, damping: 36 }}
                />
              )}
              <span className="relative">{label}</span>
            </button>
          );
        })}
      </div>

      <span className="text-[9px] shrink-0" style={{ color: '#6B6155' }}>{count} WARES</span>
    </div>
  );
}