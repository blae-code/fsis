import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Search, Database, Boxes } from 'lucide-react';
import { MAT_CATEGORIES, INDEX_CATEGORIES, matCategoryMeta, isIndexMaterial } from '@/components/matdex/matdexMeta';
import MaterialDetail from '@/components/matdex/MaterialDetail';
import CargoMarketView from '@/components/matdex/CargoMarketView';

const border = { borderColor: 'hsl(33, 18%, 18%)' };

export default function MatDexContent({ onOpenApp }) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [showCargo, setShowCargo] = useState(false);

  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['materials'],
    queryFn: () => base44.entities.material.list('sort_order'),
  });

  const filtered = materials.filter(isIndexMaterial).filter((m) => {
    const q = search.toLowerCase();
    const matchQ = !q || m.material_name?.toLowerCase().includes(q) || m.code?.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q);
    const matchC = category === 'all' || m.category === category;
    return matchQ && matchC;
  });

  const selected = materials.find((m) => m.id === selectedId) || filtered[0];

  return (
    <div className="h-full flex flex-col font-mono industrial-interior">
      {/* Toolbar */}
      <div className="p-3 border-b space-y-2 shrink-0" style={border}>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search materials, codes, descriptions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs" style={border}
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setCategory('all')}
            className="px-2 py-1 rounded text-[9px] tracking-[0.12em] border transition-colors"
            style={category === 'all'
              ? { borderColor: 'hsl(38, 72%, 52%)', color: 'hsl(38, 72%, 52%)', background: 'hsl(38, 72%, 52% / 0.1)' }
              : { ...border, color: 'hsl(35, 12%, 52%)' }}
          >
            ALL
          </button>
          {INDEX_CATEGORIES.map((key) => {
            const meta = MAT_CATEGORIES[key];
            return (
              <button
                key={key}
                onClick={() => setCategory(key)}
                className="px-2 py-1 rounded text-[9px] tracking-[0.12em] border transition-colors inline-flex items-center gap-1"
                style={category === key
                  ? { borderColor: meta.color, color: meta.color, background: meta.color.replace(')', ' / 0.1)') }
                  : { ...border, color: 'hsl(35, 12%, 52%)' }}
              >
                <meta.icon className="w-2.5 h-2.5" /> {meta.label}
              </button>
            );
          })}
          <button
            onClick={() => setShowCargo(!showCargo)}
            className="px-2 py-1 rounded text-[9px] tracking-[0.12em] border transition-colors inline-flex items-center gap-1 ml-auto"
            style={showCargo
              ? { borderColor: 'hsl(38, 72%, 52%)', color: 'hsl(38, 72%, 52%)', background: 'hsl(38, 72%, 52% / 0.1)' }
              : { ...border, color: 'hsl(35, 12%, 52%)' }}
          >
            <Boxes className="w-2.5 h-2.5" /> MY CARGO
          </button>
        </div>
      </div>

      {showCargo ? (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <CargoMarketView />
        </div>
      ) : (
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[240px_1fr]">
        <div className="overflow-y-auto border-b md:border-b-0 md:border-r max-h-44 md:max-h-none" style={border}>
          {isLoading ? (
            <p className="p-4 text-[10px] text-muted-foreground">Loading index…</p>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-center">
              <Database className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-[10px] text-muted-foreground">No materials match.</p>
            </div>
          ) : filtered.map((m) => {
            const meta = matCategoryMeta(m.category);
            const active = selected?.id === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedId(m.id)}
                className="w-full text-left px-3 py-2 border-b flex items-center gap-2 transition-colors"
                style={{
                  ...border,
                  background: active ? 'hsl(38, 72%, 52% / 0.08)' : 'transparent',
                  borderLeft: active ? `2px solid ${meta.color}` : '2px solid transparent',
                }}
              >
                <meta.icon className="w-3.5 h-3.5 shrink-0" style={{ color: meta.color }} />
                <div className="min-w-0">
                  <div className={`text-xs truncate ${active ? 'text-foreground' : 'text-foreground/80'}`}>{m.material_name}</div>
                  <div className="text-[9px] text-muted-foreground">{m.code || meta.label}</div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="overflow-y-auto p-3">
          {selected ? (
            <MaterialDetail material={selected} onOpenApp={onOpenApp} />
          ) : (
            <p className="text-[10px] text-muted-foreground p-4">Select a material to view its dossier.</p>
          )}
        </div>
      </div>
      )}
    </div>
  );
}