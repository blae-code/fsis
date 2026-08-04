import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import DeckPanel from '@/components/console/deck/DeckPanel';
import FleetTree from './FleetTree';
import FleetAssetDetail from './FleetAssetDetail';
import FleetAssetForm from './FleetAssetForm';
import FleetBulkBar from './FleetBulkBar';
import { buildFleetTree, descendantIds } from './fleetMeta';

/**
 * The order of battle. Hulls fly under leads, leads under fleets, and every wing's
 * strength rolls up to the hull that commands it — so a glance answers what can fly today.
 */
export default function FleetCommandPanel() {
  const qc = useQueryClient();
  const [openIds, setOpenIds] = useState(new Set());
  const [selectedId, setSelectedId] = useState(null);
  const [checkedIds, setCheckedIds] = useState(new Set());

  const { data: assets = [] } = useQuery({
    queryKey: ['fleet_assets'],
    queryFn: () => base44.entities.fleet_asset.filter({ active: true }, 'sort_order', 200),
    refetchInterval: 60000,
  });
  const { data: operations = [] } = useQuery({
    queryKey: ['fleet_operations'],
    queryFn: () => base44.entities.crew_operation.list('-starts_at', 40),
  });
  const { data: crew = [] } = useQuery({
    queryKey: ['fleet_crew'],
    queryFn: () => base44.entities.crew_member.filter({ active: true }, 'handle', 200),
  });
  const { data: berths = [] } = useQuery({
    queryKey: ['fleet_berths'],
    queryFn: () => base44.entities.warehouse_location.list('code', 100),
  });

  /** Who can be put in a seat, and where a hull can sit — offered rather than remembered. */
  const pilots = useMemo(() => Array.from(new Set(crew.map((c) => c.handle).filter(Boolean))), [crew]);
  const locations = useMemo(
    () => Array.from(new Set([...berths.map((b) => b.name || b.code), ...assets.map((a) => a.home_location)].filter(Boolean))),
    [berths, assets],
  );

  const done = () => qc.invalidateQueries({ queryKey: ['fleet_assets'] });
  const create = useMutation({ mutationFn: (d) => base44.entities.fleet_asset.create({ ...d, active: true }), onSuccess: done });
  const update = useMutation({ mutationFn: ({ id, data }) => base44.entities.fleet_asset.update(id, data), onSuccess: done });
  const retire = useMutation({ mutationFn: (ids) => base44.entities.fleet_asset.updateMany({ id: { $in: ids } }, { $set: { active: false } }), onSuccess: done });
  /** One order signed off against many hulls — the same fields the detail sheet writes, written once. */
  const bulk = useMutation({
    mutationFn: ({ ids, patch }) => base44.entities.fleet_asset.bulkUpdate(ids.map((id) => ({ id, ...patch }))),
    onSuccess: done,
  });

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

  /** Ticking a lead takes its whole wing — an order given to a lead is given to those under it. */
  const check = (node, on) => setCheckedIds((prev) => {
    const next = new Set(prev);
    [node.id, ...descendantIds(node)].forEach((id) => (on ? next.add(id) : next.delete(id)));
    return next;
  });
  const checkedList = useMemo(() => flat.filter((n) => checkedIds.has(n.id)).map((n) => n.id), [flat, checkedIds]);
  const musters = useMemo(
    () => operations.filter((o) => ['scheduled', 'mustering', 'underway'].includes(o.status)),
    [operations],
  );

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
            <button onClick={() => setCheckedIds(new Set(flat.map((n) => n.id)))} style={{ color: '#8A7E6C' }}>SELECT ALL</button>
            <span className="ml-auto" style={{ color: total.seats ? '#C05050' : '#5F6B33' }}>{total.seats} SEATS OPEN</span>
          </div>
        }
      >
        <div className="p-1.5 space-y-1.5">
          {checkedList.length > 0 && (
            <FleetBulkBar
              count={checkedList.length}
              pilots={pilots}
              operations={musters}
              pending={bulk.isPending || retire.isPending}
              onClear={() => setCheckedIds(new Set())}
              onApply={(patch) => bulk.mutate({ ids: checkedList, patch })}
              onRetire={() => { retire.mutate(checkedList); setCheckedIds(new Set()); setSelectedId(null); }}
            />
          )}
          {(bulk.isError || retire.isError) && (
            <p className="text-[8px] px-1" style={{ color: '#C05050' }}>The order did not go through. Nothing was changed — try again.</p>
          )}
          {tree.length === 0
            ? <p className="text-[9px] p-2" style={{ color: '#5F564A' }}>No hulls commissioned. Register one below and hang the rest of the fleet beneath it.</p>
            : <FleetTree nodes={tree} openIds={openIds} onToggle={toggle} onSelect={(n) => setSelectedId(n.id)} selectedId={selectedId} checkedIds={checkedIds} onCheck={check} />}
        </div>
      </DeckPanel>

      <div className="grid grid-rows-[minmax(0,1fr)_auto] gap-2 min-h-0">
        <DeckPanel glyph="◈" title="HULL DETAIL" meta={selected ? (selected.assigned_operation_name || 'UNCOMMITTED').toUpperCase() : ''} notch="tl" bright>
          <FleetAssetDetail
            node={selected}
            assets={assets}
            operations={operations}
            pilots={pilots}
            locations={locations}
            onUpdate={(id, data) => update.mutate({ id, data })}
            onDelete={(node) => { retire.mutate([node.id, ...descendantIds(node)]); setSelectedId(null); }}
          />
        </DeckPanel>

        <DeckPanel glyph="✛" title="COMMISSION" notch="br" capBottom>
          <FleetAssetForm assets={assets} defaultParent={selectedId} pilots={pilots} locations={locations} onCreate={(d) => create.mutate(d)} pending={create.isPending} />
        </DeckPanel>
      </div>
    </div>
  );
}