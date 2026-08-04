import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import IntakeReviewTable from '@/components/apps/management/proprietor/IntakeReviewTable';
import { cratePayload, gradeFor, groupForProducts, normalizeRows, productCategoryFor, round100, rowToLoot, rowToProduct } from '@/lib/smartInventory';
import FormRow, { FormBand } from '@/components/apps/management/ops/fleet/FormRow';
import IntakeStageRail from '@/components/apps/management/proprietor/IntakeStageRail';

const CONTROL = { borderColor: '#3A2F20', background: '#0B0906', color: '#EDE5D6' };

export default function RapidLootIntakePanel() {
  const qc = useQueryClient();
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [sourceOp, setSourceOp] = useState('');
  const [sourceLocation, setSourceLocation] = useState('');
  const [crewHandle, setCrewHandle] = useState('');
  const [locationCode, setLocationCode] = useState('');
  const { data: specs = [] } = useQuery({ queryKey: ['item_specs_intake'], queryFn: () => base44.entities.item_spec.list('item_name', 120) });
  const { data: existingLoot = [] } = useQuery({ queryKey: ['loot_intake_duplicates'], queryFn: () => base44.entities.loot_item.list('-created_date', 300) });
  const { data: products = [] } = useQuery({ queryKey: ['products_admin'], queryFn: () => base44.entities.product.list('-updated_date', 300) });
  const { data: locations = [] } = useQuery({ queryKey: ['warehouse_locations'], queryFn: () => base44.entities.warehouse_location.list('code', 100) });
  const specHint = useMemo(() => specs.slice(0, 80).map((s) => ({ item_name: s.item_name, item_type: s.item_type, size_class: s.size_class, manufacturer: s.manufacturer, base_value_auec: s.base_value_auec })).filter((s) => s.item_name), [specs]);
  const duplicateCount = (item) => existingLoot.filter((l) => String(l.item_name || '').toLowerCase() === String(item.item_name || '').toLowerCase() && String(l.source_op || '') === sourceOp).length + products.filter((p) => String(p.product_name || '').toLowerCase() === String(item.item_name || '').toLowerCase()).length;

  const analyze = useMutation({ mutationFn: async () => {
    let fileUrl = null;
    if (file) fileUrl = (await base44.integrations.Core.UploadFile({ file })).file_url;
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Extract Star Citizen inventory from notes and/or screenshot. Normalize names against this catalog when possible: ${JSON.stringify(specHint)}. Identify quantity, type, manufacturer, size, condition, likely storefront category, and resale value. Notes: ${notes || 'none'}`,
      file_urls: fileUrl ? [fileUrl] : null,
      response_json_schema: { type: 'object', properties: { items: { type: 'array', items: { type: 'object', properties: { item_name: { type: 'string' }, item_type: { type: 'string', enum: ['fps_gear', 'weapon', 'ship_component', 'vehicle_component', 'bulk_cargo'] }, manufacturer: { type: 'string' }, size_class: { type: 'string' }, quantity: { type: 'number' }, condition_pct: { type: 'number' }, est_sell_auec: { type: 'number' }, notes: { type: 'string' }, confidence: { type: 'number' } }, required: ['item_name'] } } }, required: ['items'] },
    });
    return (result.items || []).map((i) => ({ ...i, quantity: i.quantity || 1, size_class: i.size_class || 'N/A', condition_pct: i.condition_pct || 100, condition_grade: gradeFor(i.condition_pct || 100), est_sell_auec: round100(i.est_sell_auec), duplicate_count: duplicateCount(i), stock_action: productCategoryFor(i.item_type) }));
  }, onSuccess: setRows });

  const save = useMutation({ mutationFn: async () => {
    const approved = normalizeRows(rows);
    const meta = { sourceOp, sourceLocation, crewHandle, locationCode };
    if (!approved.length) return { saved: 0 };
    await base44.entities.loot_item.bulkCreate(approved.map((r) => rowToLoot(r, meta)));
    const grouped = groupForProducts(approved, products);
    const updates = grouped.filter((g) => g.match).map(({ row, match }) => ({ id: match.id, stock: Number(match.stock || 0) + row.quantity, price_auec: row.est_sell_auec || match.price_auec, available: true, condition_grade: row.condition_grade, condition_pct: row.condition_pct }));
    const creates = grouped.filter((g) => !g.match).map(({ row }) => rowToProduct(row));
    if (updates.length) await base44.entities.product.bulkUpdate(updates);
    if (creates.length) await base44.entities.product.bulkCreate(creates);
    await base44.entities.cargo_crate.create(cratePayload(approved, meta));
    return { saved: approved.length, updated: updates.length, created: creates.length };
  }, onSuccess: () => { setRows([]); setNotes(''); setFile(null); qc.invalidateQueries({ queryKey: ['loot_command'] }); qc.invalidateQueries({ queryKey: ['products_admin'] }); qc.invalidateQueries({ queryKey: ['products'] }); qc.invalidateQueries({ queryKey: ['warehouse_crates'] }); } });

  const hasManifest = Boolean(notes.trim() || file);
  const units = rows.reduce((s, r) => s + (Number(r.quantity) || 0), 0);
  const flagged = rows.filter((r) => (r.duplicate_count || 0) > 0).length;
  const stage = rows.length ? 'review' : hasManifest ? 'manifest' : 'source';

  return (
    <section className="font-mono" style={{ background: '#0B0906', boxShadow: 'inset 0 0 0 1px #2E2519' }}>
      <div className="h-[3px]" style={{ background: 'repeating-linear-gradient(45deg,#3F3018 0 5px,#120D08 5px 10px)' }} />

      <div className="flex items-center gap-2 px-3 py-2" style={{ background: 'linear-gradient(180deg,#1B1309,#0D0A07)', boxShadow: 'inset 0 -1px 0 #3A2F20' }}>
        <span className="text-[11px] leading-none" style={{ color: '#E0A22E', filter: 'drop-shadow(0 0 8px rgba(224,162,46,.5))' }}>✦</span>
        <span className="text-[8px] font-bold tracking-[0.28em]" style={{ color: '#F0E7D6' }}>SMART INVENTORY INTAKE</span>
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg,#3A2F20,transparent)' }} />
        <span className="text-[7px] tracking-[0.2em] tabular-nums" style={{ color: '#5F564A' }}>
          {rows.length ? `${rows.length} LINES · ${units} UNITS` : 'NO MANIFEST READ'}
        </span>
      </div>

      <div className="p-3 space-y-3">
        <IntakeStageRail at={stage} />

        <p className="text-[7px] leading-relaxed" style={{ color: '#6B6155' }}>
          One approval writes three records: the loot ledger, storefront stock, and a warehouse crate. Say where it came from
          first — a haul with no provenance cannot be paid against, appraised, or traced back to the hands that lifted it.
        </p>

        <FormBand glyph="◈" title="PROVENANCE" note="Where the haul came from and who brought it in. Carried onto every line in this intake.">
          <FormRow label="SOURCE OPERATION" hint="THE RUN IT CAME OFF">
            <input value={sourceOp} onChange={(e) => setSourceOp(e.target.value)} placeholder="e.g. Aaron Halo sweep" className="h-7 border px-2 text-[9px]" style={CONTROL} />
          </FormRow>
          <FormRow label="SOURCE LOCATION" hint="WHERE IT WAS LIFTED">
            <input value={sourceLocation} onChange={(e) => setSourceLocation(e.target.value)} placeholder="e.g. Yela belt" className="h-7 border px-2 text-[9px]" style={CONTROL} />
          </FormRow>
          <FormRow label="CREW HANDLE" hint="WHOSE LABOUR">
            <input value={crewHandle} onChange={(e) => setCrewHandle(e.target.value)} placeholder="comrade handle" className="h-7 border px-2 text-[9px]" style={CONTROL} />
          </FormRow>
          <FormRow label="STOWED IN" hint={locationCode || 'NO BAY ASSIGNED'}>
            <select value={locationCode} onChange={(e) => setLocationCode(e.target.value)} className="h-7 border px-2 text-[9px]" style={CONTROL}>
              <option value="">— no bay assigned —</option>
              {locations.map((l) => <option key={l.id} value={l.code}>{l.code} · {l.name}</option>)}
            </select>
          </FormRow>
        </FormBand>

        <FormBand glyph="▤" title="THE MANIFEST" note="Paste the list, photograph the hold, or both — the reading is only a proposal and every line can be corrected below.">
          <FormRow label="TYPED MANIFEST" hint="NAMES, QUANTITIES, CONDITION" span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Paste item names, quantities, cargo manifests, condition notes, or storefront stock corrections…"
              className="h-20 border p-2 text-[9px] leading-relaxed"
              style={CONTROL}
            />
          </FormRow>
          <FormRow label="HOLD PHOTOGRAPH" hint={file ? file.name : 'OPTIONAL'} span>
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-[9px] py-1" style={{ color: '#9C9080' }} />
          </FormRow>
        </FormBand>

        <div className="flex flex-wrap items-center gap-2">
          <button
            disabled={analyze.isPending || !hasManifest}
            onClick={() => analyze.mutate()}
            className="px-3 py-2 text-[8px] font-bold tracking-[0.2em] disabled:opacity-40"
            style={{ boxShadow: 'inset 0 0 0 1px #8A8F45', color: '#8A8F45', background: '#0D0A07' }}
          >
            {analyze.isPending ? 'READING MANIFEST…' : 'READ MANIFEST'}
          </button>
          <button
            disabled={save.isPending || rows.length === 0}
            onClick={() => save.mutate()}
            className="px-3 py-2 text-[8px] font-bold tracking-[0.2em] disabled:opacity-40"
            style={{ boxShadow: 'inset 0 0 0 1px #8A6430', color: '#E0A22E', background: 'linear-gradient(180deg,#1B1309,#0D0A07)' }}
          >
            {save.isPending ? 'COMMITTING…' : rows.length ? `APPROVE + COMMIT ${rows.length} LINES` : 'NOTHING TO COMMIT'}
          </button>
          {!hasManifest && <span className="text-[7px]" style={{ color: '#5F564A' }}>Paste a manifest or attach a photograph to begin.</span>}
        </div>

        {analyze.isError && <p className="text-[8px]" style={{ color: '#C05050' }}>The manifest could not be read. Try a plainer list, or a clearer photograph of the hold.</p>}
        {save.isError && <p className="text-[8px]" style={{ color: '#C05050' }}>The intake did not commit. Nothing was written — try again.</p>}
        {save.isSuccess && <p className="text-[8px]" style={{ color: '#8A8F45' }}>Committed — loot ledger, storefront stock and a warehouse crate all updated from this intake.</p>}

        {rows.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-baseline gap-2">
              <span className="text-[7px] font-bold tracking-[0.24em]" style={{ color: '#EDE5D6' }}>REVIEW THE READING</span>
              <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg,#3A2F20,transparent)' }} />
              <span className="text-[7px] tracking-[0.14em] tabular-nums" style={{ color: flagged ? '#E0A22E' : '#5F564A' }}>
                {flagged ? `${flagged} POSSIBLE DUPLICATE${flagged > 1 ? 'S' : ''}` : 'NO DUPLICATES SEEN'}
              </span>
            </div>
            <IntakeReviewTable rows={rows} setRows={setRows} />
          </div>
        )}
      </div>

      <div className="h-[3px]" style={{ background: 'repeating-linear-gradient(45deg,#3F3018 0 5px,#120D08 5px 10px)' }} />
    </section>
  );
}