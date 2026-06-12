import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Save, FolderOpen } from 'lucide-react';
import SalvageStock from '@/components/apps/fabrication/SalvageStock';

const border = { borderColor: 'hsl(33, 18%, 18%)' };
const panel = { ...border, background: 'hsl(30, 10%, 8%)' };

export default function MaterialPlanner() {
  const queryClient = useQueryClient();
  const [queue, setQueue] = useState([]); // [{recipe_id, item_name, quantity}]
  const [selectedRecipeId, setSelectedRecipeId] = useState('');
  const [projectName, setProjectName] = useState('');

  const { data: recipes = [] } = useQuery({
    queryKey: ['crafting_recipes'],
    queryFn: () => base44.entities.crafting_recipe.list('-created_date'),
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['fab_projects'],
    queryFn: () => base44.entities.fab_project.list('-updated_date'),
  });

  const saveMutation = useMutation({
    mutationFn: () => base44.entities.fab_project.create({ project_name: projectName, items: queue, status: 'planning' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fab_projects'] });
      setProjectName('');
    },
  });

  const deleteProjectMutation = useMutation({
    mutationFn: (id) => base44.entities.fab_project.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['fab_projects'] }),
  });

  const addToQueue = () => {
    const recipe = recipes.find((r) => r.id === selectedRecipeId);
    if (!recipe) return;
    const existing = queue.find((q) => q.recipe_id === recipe.id);
    if (existing) {
      setQueue(queue.map((q) => q.recipe_id === recipe.id ? { ...q, quantity: q.quantity + 1 } : q));
    } else {
      setQueue([...queue, { recipe_id: recipe.id, item_name: recipe.item_name, quantity: 1 }]);
    }
  };

  const setQty = (recipeId, qty) => {
    setQueue(queue.map((q) => q.recipe_id === recipeId ? { ...q, quantity: Math.max(1, qty) } : q));
  };

  // Aggregate material requirements across the queue
  const totals = {}; // key -> {material_name, code, quantity, unit}
  queue.forEach((q) => {
    const recipe = recipes.find((r) => r.id === q.recipe_id);
    if (!recipe?.materials) return;
    const crafts = Math.ceil(q.quantity / (recipe.output_quantity || 1));
    recipe.materials.forEach((m) => {
      const key = m.code || m.material_name;
      if (!totals[key]) totals[key] = { ...m, quantity: 0 };
      totals[key].quantity += (m.quantity || 0) * crafts;
    });
  });

  const salvageRequired = {
    RMC: totals.RMC?.quantity || 0,
    CMR: totals.CMR?.quantity || 0,
    CMS: totals.CMS?.quantity || 0,
  };

  return (
    <div className="p-4 space-y-4 font-mono">
      {/* Build queue */}
      <div className="p-3 rounded border space-y-2" style={panel}>
        <div className="text-[10px] text-muted-foreground tracking-[0.2em]">FABRICATION QUEUE</div>
        <div className="flex gap-2">
          <Select value={selectedRecipeId} onValueChange={setSelectedRecipeId}>
            <SelectTrigger className="h-8 text-xs" style={border}>
              <SelectValue placeholder={recipes.length ? 'Select recipe...' : 'No recipes — add some in RECIPES tab'} />
            </SelectTrigger>
            <SelectContent>
              {recipes.map((r) => (
                <SelectItem key={r.id} value={r.id}>{r.item_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" className="h-8 text-[10px] gap-1 shrink-0" onClick={addToQueue} disabled={!selectedRecipeId}>
            <Plus className="w-3 h-3" /> QUEUE
          </Button>
        </div>

        {queue.map((q) => (
          <div key={q.recipe_id} className="flex items-center gap-2 text-xs">
            <span className="flex-1 text-foreground truncate">{q.item_name}</span>
            <Input
              type="number" min="1" value={q.quantity}
              onChange={(e) => setQty(q.recipe_id, parseInt(e.target.value) || 1)}
              className="h-7 w-20 text-xs" style={border}
            />
            <button onClick={() => setQueue(queue.filter((x) => x.recipe_id !== q.recipe_id))} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Aggregated materials */}
      {queue.length > 0 && (
        <>
          <div className="p-3 rounded border space-y-1.5" style={panel}>
            <div className="text-[10px] text-muted-foreground tracking-[0.2em]">TOTAL MATERIALS REQUIRED</div>
            {Object.values(totals).map((m, i) => (
              <div key={i} className="flex justify-between text-xs">
                <span className={['RMC', 'CMR', 'CMS'].includes(m.code) ? 'text-primary' : 'text-foreground/90'}>
                  {m.code || m.material_name}
                </span>
                <span className="text-foreground">{m.quantity.toFixed(1)} {m.unit || ''}</span>
              </div>
            ))}
          </div>

          <SalvageStock required={salvageRequired} />

          {/* Save project */}
          <div className="flex gap-2">
            <Input
              placeholder="Project name..."
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="h-8 text-xs" style={border}
            />
            <Button
              size="sm" variant="outline" className="h-8 text-[10px] gap-1 shrink-0" style={border}
              disabled={!projectName || saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              <Save className="w-3 h-3" /> SAVE PROJECT
            </Button>
          </div>
        </>
      )}

      {/* Saved projects */}
      {projects.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] text-muted-foreground tracking-[0.2em]">SAVED PROJECTS</div>
          {projects.map((p) => (
            <div key={p.id} className="flex items-center gap-2 p-2 rounded border text-xs" style={panel}>
              <FolderOpen className="w-3 h-3 text-primary shrink-0" />
              <span className="flex-1 truncate text-foreground">{p.project_name}</span>
              <span className="text-[9px] text-muted-foreground">{(p.items || []).length} item(s) • {p.status}</span>
              <Button
                size="sm" variant="ghost" className="h-6 px-2 text-[9px]"
                onClick={() => setQueue(p.items || [])}
              >
                LOAD
              </Button>
              <button onClick={() => deleteProjectMutation.mutate(p.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}