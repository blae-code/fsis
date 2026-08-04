import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import DeckPanel from '@/components/console/deck/DeckPanel';
import DeckChevronRail from '@/components/console/deck/DeckChevronRail';
import YardSignalBoard from '@/components/apps/management/yard/YardSignalBoard';
import YardGauges from '@/components/apps/management/yard/YardGauges';
import YardDesk from '@/components/apps/management/yard/YardDesk';
import { yardModel } from '@/components/apps/management/yard/yardSignals';

/**
 * The Yard deck, built to the Watchfloor's standard: the path goods actually take
 * stamped along the top, what is standing about unworked down the left, the floor's
 * vitals down the right, and only the desk in hand mounted in the middle.
 */
const DESKS = [
  { id: 'scan',      label: 'SCAN DESK',    glyph: '◎', blurb: 'Read a screenshot into the ledger and the shelves.' },
  { id: 'intake',    label: 'LOOT INTAKE',  glyph: '⬚', blurb: 'What came off the run, named and valued.' },
  { id: 'warehouse', label: 'WAREHOUSE',    glyph: '▦', blurb: 'Crates, bays and what is staged to move.', tone: 'hot' },
  { id: 'inventory', label: 'INVENTORY',    glyph: '▤', blurb: 'What is actually on the shelf, counted.' },
  { id: 'refining',  label: 'REFINING',     glyph: '⚗', blurb: 'Hoppers running, and what is out and waiting.', tone: 'hot' },
  { id: 'fab',       label: 'FABRICATION',  glyph: '⚙', blurb: 'Runs planned, gathering and on the bench.' },
  { id: 'salvage',   label: 'YIELD',        glyph: '◈', blurb: 'What the hauls were worth, run by run.' },
];

export default function YardConsole() {
  const [desk, setDesk] = useState('intake');

  const { data: loot = [] } = useQuery({ queryKey: ['loot_command'], queryFn: () => base44.entities.loot_item.list('-created_date', 300) });
  const { data: crates = [] } = useQuery({ queryKey: ['warehouse_crates'], queryFn: () => base44.entities.cargo_crate.list('-updated_date', 200) });
  const { data: jobs = [] } = useQuery({ queryKey: ['processing_jobs'], queryFn: () => base44.entities.processing_job.list('-created_date', 100) });
  const { data: fabs = [] } = useQuery({ queryKey: ['fab_projects'], queryFn: () => base44.entities.fab_project.list('-created_date', 100) });

  const { counts, signals, gauges } = useMemo(() => yardModel({ loot, crates, jobs, fabs }), [loot, crates, jobs, fabs]);
  const active = DESKS.find((d) => d.id === desk) || DESKS[0];

  return (
    <div className="relative h-full flex flex-col min-h-0 font-mono" style={{ background: '#080604' }}>
      <div className="relative z-10 flex flex-col min-h-0 h-full p-3 gap-3">
        <DeckChevronRail railId="yard" items={DESKS} active={desk} onSelect={setDesk} counts={counts} spine="THE PATH GOODS TAKE" />

        <div className="flex-1 min-h-0 grid gap-3 lg:grid-cols-[250px_minmax(0,1fr)_200px]">
          <div className="hidden lg:block min-h-0">
            <YardSignalBoard signals={signals} activeDesk={desk} onGo={setDesk} />
          </div>

          <div className="min-h-0">
            <DeckPanel
              glyph={active.glyph}
              title={active.label}
              meta={active.blurb}
              notch="both"
              bright
              footer={<Link to="/loot" className="text-[7px] tracking-[0.2em]" style={{ color: '#8A7E6C' }}>LOOT TRACKER ↗</Link>}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={desk}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.16, ease: 'easeOut' }}
                  className="p-3"
                >
                  <YardDesk desk={desk} />
                </motion.div>
              </AnimatePresence>
            </DeckPanel>
          </div>

          <div className="hidden lg:block min-h-0">
            <YardGauges g={gauges} />
          </div>
        </div>
      </div>
    </div>
  );
}