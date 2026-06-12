import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lookupRecipe } from '@/functions/lookupRecipe';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Save, Trash2, Recycle, AlertCircle } from 'lucide-react';

const border = { borderColor: 'hsl(33, 18%, 18%)' };
const panel = { ...border, background: 'hsl(30, 10%, 8%)' };

export default function RecipeLibrary() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  const { data: recipes = [] } = useQuery({
    queryKey: ['crafting_recipes'],
    queryFn: () => base44.entities.crafting_recipe.list('-created_date'),
  });

  const { data: materials = [] } = useQuery({
    queryKey: ['materials'],
    queryFn: () => base44.entities.material.list(),
  });

  // Index ref values by code and lowercase name for craft-cost estimates
  const matIndex = {};
  materials.forEach((m) => {
    if (m.ref_value_auec == null) return;
    if (m.code) matIndex[m.code.toUpperCase()] = m.ref_value_auec;
    matIndex[m.material_name.toLowerCase()] = m.ref_value_auec;
  });

  const lookupMutation = useMutation({
    mutationFn: async (name) => {
      const res = await lookupRecipe({ item_name: name });
      return res.data;
    },
    onSuccess: (data) => {
      setError(null);
      if (data?.found === false) {
        setError('No community recipe data found for that item.');
        setPreview(null);
      } else {
        setPreview(data);
      }
    },
    onError: () => setError('Lookup failed — try again.'),
  });

  const saveMutation = useMutation({
    mutationFn: (recipe) => base44.entities.crafting_recipe.create(recipe),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crafting_recipes'] });
      setPreview(null);
      setSearch('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.crafting_recipe.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crafting_recipes'] }),
  });

  const savePreview = () => {
    const { found, ...recipe } = preview;
    saveMutation.mutate(recipe);
  };

  return (
    <div className="p-4 space-y-4 font-mono">
      {/* AI lookup */}
      <div className="p-3 rounded border space-y-2" style={panel}>
        <div className="text-[10px] text-muted-foreground tracking-[0.2em]">AI RECIPE LOOKUP — COMMUNITY DATA (SC 4.2+)</div>
        <div className="flex gap-2">
          <Input
            placeholder="Item name, e.g. Medpen, Cryptokey..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && search && lookupMutation.mutate(search)}
            className="h-8 text-xs" style={border}
          />
          <Button
            size="sm" className="h-8 text-[10px] gap-1.5 shrink-0"
            disabled={!search || lookupMutation.isPending}
            onClick={() => lookupMutation.mutate(search)}
          >
            {lookupMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
            {lookupMutation.isPending ? 'SEARCHING...' : 'LOOKUP'}
          </Button>
        </div>
        {error && (
          <div className="flex items-center gap-1.5 text-[10px] text-destructive">
            <AlertCircle className="w-3 h-3" /> {error}
          </div>
        )}
      </div>

      {/* Preview */}
      {preview && (
        <div className="p-3 rounded border space-y-2" style={{ ...panel, borderColor: 'hsl(38, 72%, 52%, 0.5)' }}>
          <div className="flex items-center justify-between">
            <RecipeHeader recipe={preview} />
            <Button size="sm" className="h-7 text-[10px] gap-1" onClick={savePreview} disabled={saveMutation.isPending}>
              <Save className="w-3 h-3" /> SAVE TO LIBRARY
            </Button>
          </div>
          <MaterialList materials={preview.materials} />
          <CraftCost materials={preview.materials} matIndex={matIndex} />
          {preview.notes && <p className="text-[10px] text-muted-foreground">{preview.notes}</p>}
        </div>
      )}

      {/* Library */}
      <div className="space-y-2">
        <div className="text-[10px] text-muted-foreground tracking-[0.2em]">RECIPE LIBRARY ({recipes.length})</div>
        {recipes.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">No recipes yet — run an AI lookup above</p>
        ) : (
          recipes.map((r) => (
            <div key={r.id} className="p-3 rounded border space-y-2" style={panel}>
              <div className="flex items-center justify-between">
                <RecipeHeader recipe={r} />
                <button
                  onClick={() => deleteMutation.mutate(r.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <MaterialList materials={r.materials} />
              <CraftCost materials={r.materials} matIndex={matIndex} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function RecipeHeader({ recipe }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-bold text-primary">{recipe.item_name}</span>
      {recipe.category && <Badge variant="outline" className="text-[9px] h-4" style={border}>{recipe.category}</Badge>}
      {recipe.uses_salvage_materials && (
        <Badge variant="outline" className="text-[9px] h-4 gap-1 border-primary/40 text-primary">
          <Recycle className="w-2.5 h-2.5" /> SALVAGE
        </Badge>
      )}
      {recipe.confidence && (
        <span className="text-[9px] text-muted-foreground">conf: {recipe.confidence}</span>
      )}
      {recipe.crafted_at && (
        <span className="text-[9px] text-muted-foreground">@ {recipe.crafted_at}</span>
      )}
    </div>
  );
}

// EVE-style industry costing: estimated input cost from MatDex reference values.
function CraftCost({ materials = [], matIndex }) {
  let cost = 0;
  let priced = 0;
  materials.forEach((m) => {
    const ref = matIndex[(m.code || '').toUpperCase()] ?? matIndex[(m.material_name || '').toLowerCase()];
    if (ref != null && m.quantity) {
      cost += ref * m.quantity;
      priced += 1;
    }
  });
  if (priced === 0) return null;
  return (
    <div className="text-[9px] text-muted-foreground">
      EST. INPUT COST: <span className="text-primary font-semibold">{Math.round(cost).toLocaleString()} aUEC</span>
      {priced < materials.length && <span> ({priced}/{materials.length} materials priced in MatDex)</span>}
    </div>
  );
}

function MaterialList({ materials = [] }) {
  if (!materials.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {materials.map((m, i) => (
        <span
          key={i}
          className="text-[10px] px-2 py-0.5 rounded"
          style={{
            background: ['RMC', 'CMR', 'CMS'].includes(m.code) ? 'hsl(38, 72%, 52%, 0.12)' : 'hsl(30, 10%, 14%)',
            color: ['RMC', 'CMR', 'CMS'].includes(m.code) ? 'hsl(42, 85%, 60%)' : 'hsl(38, 20%, 70%)',
          }}
        >
          {m.quantity} {m.unit || ''} {m.code || m.material_name}
        </span>
      ))}
    </div>
  );
}