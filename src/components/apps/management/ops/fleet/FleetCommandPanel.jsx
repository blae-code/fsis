import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DeckPanel from '@/components/console/deck/DeckPanel';
import FleetTree from './FleetTree';
import FleetAssetDetail from './FleetAssetDetail';
import FleetAssetForm from './FleetAssetForm';
import { buildFleetTree, descendantIds } from './fleetMeta';

/**
 * The order of battle. Hulls fly under leads, leads under fleets, and every wing's
 * strength rolls up to the hull that commands it — so a glance answers what can fly today.
 */
export default function FleetCommandPanel() {
  const qc = useQueryClient();
  const [openIds, setOpenIds] = useState(new Set());
  const [selectedId, setSelectedId] = useState(null);

  const { data: assets = [] } = useQuery({
    queryKey: ['fleet_assets'],
    queryFn: () => base44.entities.fleet_asset.filter({ active: true }, 'sort_order', 200),
    refetchInterval: 60000,
  });
  const { data: operations = [] } = useQuery({
    queryKey: ['fleet_operations'],
    queryFn: () => base44.entities.crew_operation.list('-starts_at', 40),
  });

  const done = () => qc.invalidateQueries({ queryKey: ['fleet_assets'] });
  const create = useMutation({ mutationFn: (d) => base44.entities.fleet_asset.create({ ...d, active: true }), onSuccess: done });
  const update = useMutation({ mutationFn: ({ id, data }) => base44.entities.fleet_asset.update(id, data), onSuccess: done });
  const retire = useMutation({ mutationFn: (ids) => base44.entities.fleet_asset.updateMany({ id: { $in: ids } }, { $set: { active: false } }), onSuccess: done });

  const tree = useMemo(() => buildFleetTree(assets), [assets]);
  const flat = useMemo(() => {
    const walk = (nodes) => nodes.flatMap((n) => [n, ...walk(n.children)]);
    return walk(tree);
  }, [tree]);
  const selected = flat.find((n) => n.id === selectedId) || null;

  const toggle = (id) => setOpenIds((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const expandAll = () => setOpenIds(new Set(flat.filter((n) => n.children.length).map((n) => n.id)));

  const total = flat.reduce((acc, n) => ({
    hulls: acc.hulls + 1,
    scu: acc.scu + (n.capacity_scu || 0),
    seats: acc.seats + (n.pilot_handle ? 0 : 1),
    afloat: acc.afloat + (n.status === 'underway' ? 1 : 0),
  }), { hulls: 0, scu: 0, seats: 0, afloat: 0 });

  return (
    <div className="h-full min-h-0 grid gap-2 md:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] p-2">
      <DeckPanel
        glyph="⛭"
        title="ORDER OF BATTLE"
        meta={`${total.hulls} HULLS · ${total.scu} SCU · ${total.afloat} AFLOAT`}
        notch="br"
        capTop
        hot={total.seats > 0}
        footer={
          <div className="flex items-center gap-2 text-[7px] tracking-[0.18em]" style={{ color: '#4A4136' }}>
            <button onClick={expandAll} style={{ color: '#8A7E6C' }}>EXPAND ALL</button>
            <button onClick={() => setOpenIds(new Set())} style={{ color: '#8A7E6C' }}>COLLAPSE</button>
            <span className="ml-auto" style={{ color: total.seats ? '#C05050' : '#5F6B33' }}>{total.seats} SEATS OPEN</span>
          </div>
        }
      >
        <div className="p-1.5">
          {tree.length === 0
            ? <p className="text-[9px] p-2" style={{ color: '#5F564A' }}>No hulls commissioned. Register one below and hang the rest of the fleet beneath it.</p>
            : <FleetTree nodes={tree} openIds={openIds} onToggle={toggle} onSelect={(n) => setSelectedId(n.id)} selectedId={selectedId} />}
        </div>
      </DeckPanel>

      <div className="grid grid-rows-[minmax(0,1fr)_auto] gap-2 min-h-0">
        <DeckPanel glyph="◈" title="HULL DETAIL" meta={selected ? (selected.assigned_operation_name || 'UNCOMMITTED').toUpperCase() : ''} notch="tl" bright>
          <FleetAssetDetail
            node={selected}
            assets={assets}
            operations={operations}
            onUpdate={(id, data) => update.mutate({ id, data })}
            onDelete={(node) => { retire.mutate([node.id, ...descendantIds(node)]); setSelectedId(null); }}
          />
        </DeckPanel>

        <DeckPanel glyph="✛" title="COMMISSION" notch="br" capBottom>
          <FleetAssetForm assets={assets} defaultParent={selectedId} onCreate={(d) => create.mutate(d)} pending={create.isPending} />
        </DeckPanel>
      </div>
    </div>
  );
}