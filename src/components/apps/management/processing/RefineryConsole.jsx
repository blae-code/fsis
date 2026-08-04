import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import DeckChevronRail from '@/components/console/deck/DeckChevronRail';
import DeckPanel from '@/components/console/deck/DeckPanel';
import ProductionPipeline from '@/components/apps/management/pipeline/ProductionPipeline';
import RefineryThroughputDashboard from './RefineryThroughputDashboard';
import RefineYieldPlanner from './RefineYieldPlanner';
import ProcessingTimersPanel from './ProcessingTimersPanel';
import PatchResetConsole from './PatchResetConsole';

/** The refining bench, read in stages: reckon the load, fill the hopper, collect it, clear the bench on a patch. */
const STAGES = [
  { id: 'floor',   label: 'THE FLOOR', glyph: '◉', tone: 'hot', desc: 'Throughput, capacity in use and expected turnaround on every batch' },
  { id: 'plan',    label: 'RECKON',   glyph: '⚗', tone: 'hot', desc: 'Method against yield, wait and fee before the hopper is filled' },
  { id: 'hoppers', label: 'HOPPERS',  glyph: '⧗', tone: 'hot', desc: 'What is cooking, what is ready, and what is owed collecting' },
  { id: 'reset',   label: 'PATCH',    glyph: '⚠',              desc: 'Clear hoppers wiped by a game patch' },
];

export default function RefineryConsole() {
  const [stage, setStage] = useState('floor');
  const active = STAGES.find((s) => s.id === stage);

  const { data: jobs = [] } = useQuery({
    queryKey: ['pipeline_jobs'],
    queryFn: () => base44.entities.processing_job.list('-created_date', 200),
    refetchInterval: 60000,
  });

  const counts = useMemo(() => ({
    floor: jobs.filter((j) => j.status === 'running' || j.status === 'ready').length,
    hoppers: jobs.filter((j) => j.status === 'running' || j.status === 'ready').length,
  }), [jobs]);

  return (
    <div className="space-y-3">
      <ProductionPipeline onGo={(t) => setStage(t === 'refining' ? 'hoppers' : stage)} />

      <DeckChevronRail
        railId="refinery"
        items={STAGES}
        active={stage}
        onSelect={setStage}
        counts={counts}
        spine="THE REFINING LOOP"
      />

      <DeckPanel glyph={active?.glyph} title={active?.label} meta={active?.desc?.toUpperCase()} notch="both" bright capBottom>
        <AnimatePresence mode="wait">
          <motion.div
            key={stage}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16 }}
            className="p-3"
          >
            {stage === 'floor' && <RefineryThroughputDashboard />}
            {stage === 'plan' && <RefineYieldPlanner />}
            {stage === 'hoppers' && <ProcessingTimersPanel />}
            {stage === 'reset' && <PatchResetConsole />}
          </motion.div>
        </AnimatePresence>
      </DeckPanel>
    </div>
  );
}