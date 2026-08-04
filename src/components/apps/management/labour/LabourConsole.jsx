import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import DeckPanel from '@/components/console/deck/DeckPanel';
import DeckChevronRail from '@/components/console/deck/DeckChevronRail';
import LabourSignalBoard from '@/components/apps/management/labour/LabourSignalBoard';
import LabourGauges from '@/components/apps/management/labour/LabourGauges';
import LabourDesk from '@/components/apps/management/labour/LabourDesk';
import { labourModel } from '@/components/apps/management/labour/labourSignals';

/**
 * The Labour deck, to the same standard as Command, Trade and the Yard: the way
 * labour actually moves stamped along the top, what is owing to a hand down the
 * left, the hall's vitals down the right, one desk mounted in the middle.
 */
const DESKS = [
  { id: 'tasks',    label: 'TASKS',    glyph: '⌗', tone: 'hot', blurb: 'Work posted, taken up, filed and credited.' },
  { id: 'runs',     label: 'RUNS',     glyph: '◎', tone: 'hot', blurb: 'Musters called, seats taken, hauls closed.' },
  { id: 'payday',   label: 'PAYDAY',   glyph: '◉',              blurb: 'The pool, the elections and what each share pays.' },
  { id: 'standing', label: 'STANDING', glyph: '✶', tone: 'hot', blurb: 'Marks, appeals and who holds what standing.' },
  { id: 'review',   label: 'REVIEW',   glyph: '▤',              blurb: 'The month read whole — hours filed, work credited, standing moved.' },
];

export default function LabourConsole() {
  const [desk, setDesk] = useState('tasks');

  const { data: tasks = [] } = useQuery({
    queryKey: ['labour_tasks_deck'],
    queryFn: () => base44.entities.labour_task.list('-created_date', 300),
    refetchInterval: 60000,
  });
  const { data: operations = [] } = useQuery({
    queryKey: ['labour_operations_deck'],
    queryFn: () => base44.entities.crew_operation.list('-starts_at', 100),
    refetchInterval: 60000,
  });
  const { data: events = [] } = useQuery({
    queryKey: ['labour_standing_deck'],
    queryFn: () => base44.entities.standing_event.list('-created_date', 200),
    refetchInterval: 120000,
  });
  const { data: cycles = [] } = useQuery({
    queryKey: ['labour_cycles_deck'],
    queryFn: () => base44.entities.payday_cycle.list('-payday_date', 12),
    refetchInterval: 120000,
  });
  const { data: elections = [] } = useQuery({
    queryKey: ['labour_elections_deck'],
    queryFn: () => base44.entities.payday_election.list('-decided_at', 200),
    refetchInterval: 120000,
  });

  const { counts, signals, gauges } = useMemo(
    () => labourModel({ tasks, operations, events, cycles, elections }),
    [tasks, operations, events, cycles, elections],
  );
  const active = DESKS.find((d) => d.id === desk) || DESKS[0];

  return (
    <div className="relative h-full flex flex-col min-h-0 font-mono" style={{ background: '#080604' }}>
      <div className="relative z-10 flex flex-col min-h-0 h-full p-3 gap-3">
        <DeckChevronRail railId="labour" items={DESKS} active={desk} onSelect={setDesk} counts={counts} spine="HOW LABOUR MOVES" />

        <div className="flex-1 min-h-0 grid gap-3 lg:grid-cols-[250px_minmax(0,1fr)_200px]">
          <div className="hidden lg:block min-h-0">
            <LabourSignalBoard signals={signals} activeDesk={desk} onGo={setDesk} />
          </div>

          <div className="min-h-0">
            <DeckPanel
              glyph={active.glyph}
              title={active.label}
              meta={active.blurb}
              notch="both"
              bright
              footer={<Link to="/work" className="text-[7px] tracking-[0.2em]" style={{ color: '#8A7E6C' }}>WORK BOARD ↗</Link>}
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
                  <LabourDesk desk={desk} />
                </motion.div>
              </AnimatePresence>
            </DeckPanel>
          </div>

          <div className="hidden lg:block min-h-0">
            <LabourGauges g={gauges} />
          </div>
        </div>
      </div>
    </div>
  );
}