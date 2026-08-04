import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import SalvageTelemetry from '@/components/apps/management/ops/SalvageTelemetry';
import HullMaterialPredictor from '@/components/apps/management/ops/HullMaterialPredictor';
import HaulStrategyMapper from '@/components/apps/management/ops/HaulStrategyMapper';
import MicroExpenseLogger from '@/components/apps/management/ops/MicroExpenseLogger';
import LootRapidSort from '@/components/apps/management/ops/LootRapidSort';
import RapidLootIntakePanel from '@/components/apps/management/proprietor/RapidLootIntakePanel';
import MarketWatchBar from '@/components/apps/management/ops/MarketWatchBar';
import OpsBoard from '@/components/apps/management/ops/OpsBoard';
import FleetGauges from '@/components/apps/management/ops/FleetGauges';
import DeckChevronRail from '@/components/console/deck/DeckChevronRail';
import DeckPanel from '@/components/console/deck/DeckPanel';
import FleetCommandPanel from '@/components/apps/management/ops/fleet/FleetCommandPanel';
import CargoChainConsole from '@/components/apps/management/ops/missions/CargoChainConsole';
import SalvageOrchestrationConsole from '@/components/apps/management/ops/salvage/SalvageOrchestrationConsole';
import { buildOpsSignals, fleetModel } from '@/components/apps/management/ops/opsSignals';

/** The run, read left to right: what is afloat, what it will yield, where it sells, what it cost, what came back. */
const TOOLS = [
  { id: 'fleet',     label: 'FLEET',     glyph: '⛭', tone: 'hot', desc: 'Order of battle — wings, orders and hulls' },
  { id: 'telemetry', label: 'AFLOAT',    glyph: '◉', tone: 'hot', desc: 'Live session pulse — hull, hold and phase' },
  { id: 'cargo',     label: 'CARGO RUN', glyph: '▤', tone: 'hot', desc: 'Chain up to ten cargo contracts into one sorted flight path' },
  { id: 'salvops',   label: 'SALV OPS',  glyph: '⬡', tone: 'hot', desc: 'Break salvage contracts into trades and work several at once' },
  { id: 'hull',      label: 'HULL PRED', glyph: '⬡',              desc: 'Predict RMC/CMR/CMS yield by ship type' },
  { id: 'haul',      label: 'HAUL MAP',  glyph: '▸',              desc: 'Best terminal for the current loadout' },
  { id: 'expense',   label: 'EXPENSE',   glyph: '◆',              desc: 'One-tap mid-run expense logging' },
  { id: 'loot',      label: 'LOOT SORT', glyph: '✦', tone: 'hot', desc: 'Rapid-queue looted gear and components' },
];

export default function OpsCommandDeck() {
  const [stage, setStage] = useState('fleet');
  const active = TOOLS.find((t) => t.id === stage);

  const { data: operations = [] } = useQuery({
    queryKey: ['ops_deck_operations'],
    queryFn: () => base44.entities.crew_operation.list('-starts_at', 60),
    refetchInterval: 60000,
  });
  const { data: plans = [] } = useQuery({
    queryKey: ['ops_deck_plans'],
    queryFn: () => base44.entities.freight_plan.list('-updated_date', 60),
    refetchInterval: 120000,
  });
  const { data: crates = [] } = useQuery({
    queryKey: ['ops_deck_crates'],
    queryFn: () => base44.entities.cargo_crate.list('-updated_date', 120),
    refetchInterval: 120000,
  });

  const { data: hulls = [] } = useQuery({
    queryKey: ['fleet_assets'],
    queryFn: () => base44.entities.fleet_asset.filter({ active: true }, 'sort_order', 200),
    refetchInterval: 60000,
  });

  const signals = useMemo(() => buildOpsSignals({ operations, plans, crates, fleet: hulls }), [operations, plans, crates, hulls]);
  const fleet = useMemo(() => fleetModel({ operations, plans, crates }), [operations, plans, crates]);
  const counts = useMemo(
    () => signals.reduce((acc, s) => ({ ...acc, [s.stage]: (acc[s.stage] || 0) + s.count }), {}),
    [signals],
  );

  return (
    <div className="relative h-full flex flex-col min-h-0 font-mono" style={{ background: '#080604' }}>
      <MarketWatchBar />

      <div className="flex flex-col min-h-0 flex-1 p-3 gap-3">
        <DeckChevronRail
          railId="opsdeck"
          items={TOOLS}
          active={stage}
          onSelect={setStage}
          counts={counts}
          spine="THE RUN LOOP"
        />

        <div className="flex-1 min-h-0 grid gap-3 lg:grid-cols-[260px_minmax(0,1fr)_210px]">
          <div className="hidden lg:block min-h-0">
            <OpsBoard signals={signals} onGo={setStage} activeStage={stage} />
          </div>

          <div className="min-h-0">
            {stage === 'fleet' ? (
              <FleetCommandPanel />
            ) : stage === 'cargo' ? (
              <CargoChainConsole />
            ) : stage === 'salvops' ? (
              <SalvageOrchestrationConsole />
            ) : (
            <DeckPanel glyph={active?.glyph} title={active?.label} meta={active?.desc?.toUpperCase()} notch="both" bright>
              <AnimatePresence mode="wait">
                <motion.div
                  key={stage}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.16 }}
                >
                  {stage === 'telemetry' && <SalvageTelemetry />}
                  {stage === 'hull' && <HullMaterialPredictor />}
                  {stage === 'haul' && <HaulStrategyMapper />}
                  {stage === 'expense' && <MicroExpenseLogger />}
                  {stage === 'loot' && (
                    <div className="p-3 space-y-3">
                      <RapidLootIntakePanel />
                      <LootRapidSort />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </DeckPanel>
            )}
          </div>

          <div className="hidden lg:block min-h-0">
            <FleetGauges f={fleet} />
          </div>
        </div>
      </div>
    </div>
  );
}