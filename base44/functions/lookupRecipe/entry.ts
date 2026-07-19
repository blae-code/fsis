import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// AI lookup of community crafting data for a Star Citizen item (4.2+ crafting system).
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { item_name } = await req.json();
    if (typeof item_name !== 'string' || !item_name.trim()) {
      return Response.json({ error: 'item_name is required' }, { status: 400 });
    }
    if (item_name.length > 200) {
      return Response.json({ error: 'item_name is too long' }, { status: 400 });
    }

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `You are a Star Citizen crafting data researcher. Using current community sources (wikis, UEX, Reddit, patch notes for Star Citizen 4.2 and later crafting/engineering system), find the crafting recipe for the item: "${item_name}".

Return the materials required to craft it, where it is crafted (workbench/fabricator type and tier), output quantity per craft, and approximate craft time if known.

Material naming: use the in-game material names. If a material is a salvage output, use these codes: RMC (Recycled Material Composite), CMR (Construction Materials Reclaimed), CMS (Construction Materials Salvaged). For other materials leave code as an empty string.

Set uses_salvage_materials true if any material is RMC, CMR, or CMS.
Set confidence to high/medium/low based on how well-sourced the data is. If you cannot find any recipe data, set found to false.`,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          found: { type: 'boolean' },
          item_name: { type: 'string' },
          category: { type: 'string', enum: ['component', 'weapon', 'armor', 'consumable', 'ship_part', 'base_module', 'tool', 'other'] },
          materials: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                material_name: { type: 'string' },
                code: { type: 'string' },
                quantity: { type: 'number' },
                unit: { type: 'string' }
              }
            }
          },
          output_quantity: { type: 'number' },
          crafted_at: { type: 'string' },
          craft_time: { type: 'string' },
          patch_version: { type: 'string' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          uses_salvage_materials: { type: 'boolean' },
          notes: { type: 'string' }
        }
      }
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});