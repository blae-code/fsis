import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Database, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { matCategoryMeta, isIndexMaterial } from '@/components/matdex/matdexMeta';

// Public materials & components reference, cross-linked to the store catalog
export default function MaterialsIndex({ products = [] }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: materials = [] } = useQuery({
    queryKey: ['materials'],
    queryFn: () => base44.entities.material.list('sort_order'),
  });

  const listedCodes = new Set(products.map((p) => p.code).filter(Boolean));
  const scoped = materials.filter(isIndexMaterial);
  const filtered = scoped.filter((m) => {
    const q = search.toLowerCase();
    return !q || m.material_name?.toLowerCase().includes(q) || m.code?.toLowerCase().includes(q);
  });

  if (scoped.length === 0) return null;

  return (
    <section className="border" style={{ borderColor: '#3A2F20', background: 'rgba(10, 9, 7, 0.5)', clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)' }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 font-mono hover:brightness-125 transition-all">
        <span className="flex items-center gap-2 text-[11px] font-bold tracking-[0.2em]" style={{ color: '#D8CFC0' }}>
          <Database className="w-3.5 h-3.5" style={{ color: '#E0A22E' }} />
          MATERIALS &amp; COMPONENTS INDEX
          <span className="text-[9px] font-normal" style={{ color: '#8A7E6C' }}>({scoped.length} ENTRIES)</span>
        </span>
        {open ? <ChevronUp className="w-4 h-4" style={{ color: '#C8A05B' }} /> : <ChevronDown className="w-4 h-4" style={{ color: '#C8A05B' }} />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 font-mono">
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: '#8A7E6C' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search materials..."
              className="w-full h-8 pl-8 pr-3 text-xs bg-transparent border outline-none"
              style={{ borderColor: '#3A2F20', color: '#D8CFC0' }}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filtered.map((m) => {
              const meta = matCategoryMeta(m.category);
              const inStore = m.code && listedCodes.has(m.code);
              return (
                <div key={m.id} className="flex items-center gap-2.5 p-2.5 border" style={{ borderColor: '#2A2118', background: 'rgba(12, 11, 10, 0.6)' }}>
                  <meta.icon className="w-4 h-4 shrink-0" style={{ color: meta.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] truncate" style={{ color: '#D8CFC0' }}>
                      {m.material_name}
                      {m.code && <span className="ml-1.5" style={{ color: '#E0A22E' }}>[{m.code}]</span>}
                    </div>
                    <div className="text-[9px] truncate" style={{ color: '#8A7E6C' }}>
                      {meta.label}{m.ref_value_auec ? ` • ~${m.ref_value_auec.toLocaleString()} aUEC/${m.unit || 'SCU'}` : ''}
                    </div>
                  </div>
                  {inStore && (
                    <span className="text-[8px] px-1.5 py-0.5 shrink-0 font-bold tracking-[0.1em]" style={{ background: 'rgba(224, 162, 46, 0.15)', color: '#E0A22E' }}>
                      IN STOCK
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-[9px]" style={{ color: '#6B6155' }}>
            Reference values approximate. Items marked IN STOCK are available in the catalog above.
          </p>
        </div>
      )}
    </section>
  );
}