import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RecipeLibrary from '@/components/apps/fabrication/RecipeLibrary';
import MaterialPlanner from '@/components/apps/fabrication/MaterialPlanner';

// FABRICATION — crafting recipes (AI community lookup), material planner,
// and salvage-output linking for the SC 4.2+ crafting system.
export default function FabricationContent() {
  return (
    <div className="h-full flex flex-col industrial-interior">
      <Tabs defaultValue="planner" className="flex-1 flex flex-col min-h-0">
        <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 h-auto" style={{ borderColor: 'hsl(170, 25%, 18%)' }}>
          <TabsTrigger
            value="planner"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs font-mono"
          >
            PLANNER
          </TabsTrigger>
          <TabsTrigger
            value="recipes"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2 text-xs font-mono"
          >
            RECIPES
          </TabsTrigger>
        </TabsList>

        <TabsContent value="planner" className="flex-1 overflow-auto m-0">
          <MaterialPlanner />
        </TabsContent>

        <TabsContent value="recipes" className="flex-1 overflow-auto m-0">
          <RecipeLibrary />
        </TabsContent>
      </Tabs>

      <div className="p-2 border-t text-center" style={{ borderColor: 'hsl(170, 25%, 18%)', background: 'hsl(180, 12%, 6%)' }}>
        <p className="text-[9px] font-mono text-muted-foreground">
          Recipe data is AI-sourced from community references and may differ from the live build — verify in game.
        </p>
      </div>
    </div>
  );
}