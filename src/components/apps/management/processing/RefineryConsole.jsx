import React from 'react';
import ConsoleFold from '@/components/console/ConsoleFold';
import ProductionPipeline from '@/components/apps/management/pipeline/ProductionPipeline';
import RefineYieldPlanner from './RefineYieldPlanner';
import ProcessingTimersPanel from './ProcessingTimersPanel';
import PatchResetConsole from './PatchResetConsole';

/** The refining bench: reckon the load first, then watch the hoppers that are already cooking. */
export default function RefineryConsole() {
  return (
    <div className="space-y-4">
      <ProductionPipeline />
      <RefineYieldPlanner />
      <ProcessingTimersPanel />
      <ConsoleFold label="PATCH RESET CONSOLE — BULK HOPPER CLEAR"><PatchResetConsole /></ConsoleFold>
    </div>
  );
}