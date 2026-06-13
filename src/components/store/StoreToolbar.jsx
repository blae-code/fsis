import React from 'react';
import { Search } from 'lucide-react';
import StoreTip from '@/components/store/StoreTip';

const CATEGORIES = [
  { key: 'all', label: 'ALL WARES' },
  { key: 'salvage_commodity', label: 'SALVAGE' },
  { key: 'fabricated', label: 'FABRICATED' },
  { key: 'service', label: 'SERVICES' },
];

export default function StoreToolbar({ search, setSearch, category, setCategory, count }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 font-mono">
      <div className="relative flex-1">
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
        <kbd
          className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[9px] font-bold border pointer-events-none"
          style={{ borderColor: '#3A2F20', color: '#8A7E6C', background: 'rgba(20, 17, 13, 0.8)' }}
        >
          /
        </kbd>
      </div>
      <div className="flex gap-1.5 flex-wrap">
        {CATEGORIES.map((c) => {
          const active = category === c.key;
          return (
            <StoreTip key={c.key} label={`Filter: ${c.label.toLowerCase()}`}>
            <button
              onClick={() => setCategory(c.key)}
              className="px-3 py-1.5 text-[9px] tracking-[0.15em] font-bold border transition-all hover:brightness-125"
              style={{
                clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)',
                ...(active
                  ? { background: 'linear-gradient(180deg, #A87C42, #6E4D24)', color: '#15100A', borderColor: '#A87C42', boxShadow: '0 0 12px rgba(212, 146, 11, 0.35)' }
                  : { background: 'transparent', color: '#C8A05B', borderColor: '#3A2F20' }),
              }}
            >
              {c.label}
            </button>
            </StoreTip>
          );
        })}
      </div>
      <span className="text-[9px] shrink-0" style={{ color: '#6B6155' }}>{count} LISTED</span>
    </div>
  );
}