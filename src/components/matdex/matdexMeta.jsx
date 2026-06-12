// Shared category metadata for the materials & components index
import { Recycle, Mountain, Layers, Cpu, Fuel, Box } from 'lucide-react';

export const MAT_CATEGORIES = {
  salvage_output: { label: 'SALVAGE OUTPUT', icon: Recycle, color: 'hsl(38, 75%, 52%)' },
  raw_ore: { label: 'RAW ORE', icon: Mountain, color: 'hsl(20, 60%, 50%)' },
  refined_metal: { label: 'REFINED METAL', icon: Layers, color: 'hsl(210, 45%, 55%)' },
  component: { label: 'COMPONENT', icon: Cpu, color: 'hsl(28, 70%, 48%)' },
  fuel_gas: { label: 'FUEL / GAS', icon: Fuel, color: 'hsl(220, 30%, 58%)' },
  other: { label: 'OTHER', icon: Box, color: 'hsl(40, 18%, 65%)' },
};

export function matCategoryMeta(category) {
  return MAT_CATEGORIES[category] || MAT_CATEGORIES.other;
}