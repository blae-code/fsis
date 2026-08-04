import React from 'react';
import ConsoleFold from '@/components/console/ConsoleFold';
import RefineYieldPlanner from './RefineYieldPlanner';
import ProcessingTimersPanel from './ProcessingTimersPanel';
import PatchResetConsole from './PatchResetConsole';

/** The refining bench: reckon the load first, then watch the hoppers that are already cooking. */
export default function RefineryConsole() {
  return (
    <div className="space-y-4">
      <RefineYieldPlanner />
      <ProcessingTimersPanel />
      <ConsoleFold label="PATCH RESET CONSOLE — BULK HOPPER CLEAR"><PatchResetConsole /></ConsoleFold>
    </div>
  );
}