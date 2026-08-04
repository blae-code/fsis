import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DeckPanel from '@/components/console/deck/DeckPanel';
import ContractOrchestrationCard from './ContractOrchestrationCard';
import { hullConflicts, statusMeta, ASPECTS } from './salvageOrchestration';

const LIVE = ['open', 'accepted', 'in_progress'];

/**
 * Several contracts, several hulls, several trades — running at once. A contract is broken
 * into the work it actually takes, each piece given to a hull, and any ship booked onto two
 * jobs at the same moment is called out rather than discovered over the belt.
 */
export default function SalvageOrchestrationConsole() {
  const qc = useQueryClient();

  const { data: contracts = [] } = useQuery({
    queryKey: ['salvage_contracts'],
    queryFn: () => base44.entities.contract.list('-created_date', 80),
    refetchInterval: 60000,
  });
  const { data: assignments = [] } = useQuery({
    queryKey: ['salvage_assignments'],
    queryFn: () => base44.entities.salvage_assignment.list('sort_order', 300),
    refetchInterval: 30000,
  });
  const { data: hulls = [] } = useQuery({
    queryKey: ['fleet_assets'],
    queryFn: () => base44.entities.fleet_asset.filter({ active: true }, 'sort_order', 200),
  });

  const live = useMemo(
    () => contracts.filter((c) => c.contract_type === 'salvage_op' && LIVE.includes(c.status)),
    [contracts],
  );
  const byContract = useMemo(() => {
    const m = new Map();
    assignments.forEach((a) => m.set(a.contract_id, [...(m.get(a.contract_id) || []), a]));
    return m;
  }, [assignments]);
  const conflicts = useMemo(() => hullConflicts(assignments), [assignments]);
  const conflictHulls = conflicts.map((c) => c.hull_id);

  const done = () => qc.invalidateQueries({ queryKey: ['salvage_assignments'] });
  const add = useMutation({ mutationFn: (d) => base44.entities.salvage_assignment.create(d), onSuccess: done });
  const update = useMutation({ mutationFn: ({ id, patch }) => base44.entities.salvage_assignment.update(id, patch), onSuccess: done });
  const drop = useMutation({ mutationFn: (id) => base44.entities.salvage_assignment.update(id, { status: 'dropped' }), onSuccess: done });

  const totals = assignments.filter((a) => a.status === 'underway');
  const busyHulls = new Set(totals.map((a) => a.hull_id).filter(Boolean));

  return (
    <div className="h-full min-h-0 grid gap-2 lg:grid-cols-[minmax(0,1fr)_220px] p-2">
      <DeckPanel
        glyph="⬡"
        title="CONTRACT ORCHESTRATION"
        meta={`${live.length} LIVE · ${totals.length} TRADES AFLOAT`}
        notch="both"
        capTop
        bright
        hot={conflicts.length > 0}
      >
        <div className="p-2 space-y-2">
          {conflicts.map((c) => (
            <p key={c.hull_id} className="text-[8px] px-1" style={{ color: '#C05050' }}>
              {c.callsign} is underway on {c.contracts.length} contracts at once — {c.contracts.join(' and ')}. A hull can only be in one place.
            </p>
          ))}
          {live.length === 0 ? (
            <p className="text-[9px]" style={{ color: '#5F564A' }}>
              No live salvage contracts. Raise one in the Hall room with type “salvage op”, then break it into trades here.
            </p>
          ) : (
            live.map((c) => (
              <ContractOrchestrationCard
                key={c.id}
                contract={c}
                rows={(byContract.get(c.id) || []).filter((a) => a.status !== 'dropped')}
                hulls={hulls}
                conflictHulls={conflictHulls}
                onAdd={(aspect) => add.mutate({ contract_id: c.id, contract_title: c.title, aspect, status: 'planned', sort_order: (byContract.get(c.id) || []).length })}
                onUpdate={(id, patch) => update.mutate({ id, patch })}
                onDrop={(id) => drop.mutate(id)}
              />
            ))
          )}
          {(add.isError || update.isError || drop.isError) && (
            <p className="text-[8px]" style={{ color: '#C05050' }}>That change did not save. Nothing was written — try again.</p>
          )}
        </div>
      </DeckPanel>

      <DeckPanel glyph="⛭" title="HULL LOAD" meta={`${busyHulls.size}/${hulls.length} COMMITTED`} notch="tl" capBottom>
        <div className="p-2 space-y-1">
          {hulls.length === 0 && <p className="text-[8px]" style={{ color: '#5F564A' }}>No hulls commissioned yet.</p>}
          {hulls.map((h) => {
            const rows = totals.filter((a) => a.hull_id === h.id);
            const clash = conflictHulls.includes(h.id);
            return (
              <div key={h.id} className="flex items-baseline gap-1.5">
                <span className="text-[8px] truncate" style={{ color: clash ? '#C05050' : rows.length ? '#F0E7D6' : '#5F564A' }}>{h.callsign}</span>
                <div className="flex-1 h-px" style={{ background: '#1E1811' }} />
                <span className="text-[7px] tracking-[0.14em]" style={{ color: rows.length ? statusMeta('underway').color : '#4A4136' }}>
                  {rows.length ? rows.map((r) => (ASPECTS.find((a) => a.id === r.aspect)?.label || r.aspect)).join(' · ') : 'IDLE'}
                </span>
              </div>
            );
          })}
        </div>
      </DeckPanel>
    </div>
  );
}