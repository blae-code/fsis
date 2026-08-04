import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DeckPanel from '@/components/console/deck/DeckPanel';
import MissionPickList from './MissionPickList';
import MissionBoardReader from './MissionBoardReader';
import StopPlanRail from './StopPlanRail';
import { buildStopPlan } from '@/lib/cargoRouteOptimizer';

const LIMIT = 10;

/**
 * Chain up to ten cargo contracts and fly them as one route. The order is worked out
 * from the stops rather than the contracts, so the hold is never filled at the cost of
 * a pickup further down the path.
 */
export default function CargoChainConsole() {
  const qc = useQueryClient();
  const [picked, setPicked] = useState(new Set());
  const [hullId, setHullId] = useState('');

  const { data: missions = [] } = useQuery({
    queryKey: ['chain_missions'],
    queryFn: () => base44.entities.freight_mission.list('-created_date', 120),
    refetchInterval: 60000,
  });
  const { data: hulls = [] } = useQuery({
    queryKey: ['fleet_assets'],
    queryFn: () => base44.entities.fleet_asset.filter({ active: true }, 'sort_order', 200),
  });

  const open = useMemo(() => missions.filter((m) => ['planned', 'accepted', 'loaded'].includes(m.status)), [missions]);
  const hull = hulls.find((h) => h.id === hullId);
  const capacity = Number(hull?.capacity_scu) || 0;
  const chosen = useMemo(() => open.filter((m) => picked.has(m.id)), [open, picked]);
  const plan = useMemo(() => buildStopPlan(chosen, capacity), [chosen, capacity]);

  const toggle = (id) => setPicked((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.size < LIMIT && next.add(id);
    return next;
  });

  const commit = useMutation({
    mutationFn: () => base44.entities.freight_mission.bulkUpdate(
      plan.order.map((id, i) => ({
        id,
        chain_position: i + 1,
        status: 'accepted',
        chain_notes: `Flown as stop ${i + 1} of ${plan.order.length}${hull ? ` aboard ${hull.callsign}` : ''}`,
      })),
    ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chain_missions'] }),
  });

  return (
    <div className="h-full min-h-0 grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] p-2">
      <DeckPanel
        glyph="▤"
        title="CONTRACT BOARD"
        meta={`${picked.size}/${LIMIT} TAKEN`}
        notch="br"
        capTop
        footer={
          <div className="flex items-center gap-2 text-[7px] tracking-[0.18em]">
            <button onClick={() => setPicked(new Set())} style={{ color: '#8A7E6C' }}>CLEAR</button>
            <button onClick={() => setPicked(new Set(open.slice(0, LIMIT).map((m) => m.id)))} style={{ color: '#8A7E6C' }}>TAKE FIRST TEN</button>
            <span className="ml-auto tabular-nums" style={{ color: '#5F564A' }}>{plan.totalScu} SCU · {plan.totalReward.toLocaleString()} aUEC</span>
          </div>
        }
      >
        <MissionBoardReader />
        <MissionPickList missions={open} picked={picked} onToggle={toggle} limit={LIMIT} />
      </DeckPanel>

      <DeckPanel
        glyph="▸"
        title="FLIGHT PATH"
        meta={`${plan.stops.length} STOPS`}
        notch="tl"
        bright
        capBottom
        hot={plan.warnings.length > 0}
        footer={
          <div className="flex items-center gap-2">
            <select
              value={hullId}
              onChange={(e) => setHullId(e.target.value)}
              className="h-6 border px-1 text-[8px]"
              style={{ borderColor: '#3A2F20', background: '#0B0906', color: '#EDE5D6' }}
            >
              <option value="">— no hull, ignore capacity —</option>
              {hulls.map((h) => <option key={h.id} value={h.id}>{h.callsign} · {h.capacity_scu || 0} SCU</option>)}
            </select>
            <button
              disabled={!plan.order.length || commit.isPending}
              onClick={() => commit.mutate()}
              className="ml-auto px-2 py-1 text-[8px] font-bold tracking-[0.18em] disabled:opacity-40"
              style={{ boxShadow: 'inset 0 0 0 1px #8A6430', color: '#E0A22E', background: 'linear-gradient(180deg,#1B1309,#0D0A07)' }}
            >
              {commit.isPending ? 'FILING…' : commit.isSuccess ? 'CHAIN FILED' : 'FILE FLIGHT ORDER'}
            </button>
          </div>
        }
      >
        <StopPlanRail plan={plan} capacity={capacity} />
        {plan.stranded.length > 0 && (
          <p className="text-[8px] px-3 pb-2" style={{ color: '#C05050' }}>
            Left behind: {plan.stranded.join(', ')} — the hold cannot carry them on this run.
          </p>
        )}
        {commit.isError && <p className="text-[8px] px-3 pb-2" style={{ color: '#C05050' }}>The flight order did not file. Nothing was changed — try again.</p>}
      </DeckPanel>
    </div>
  );
}