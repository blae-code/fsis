import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import IntakeReviewTable from '@/components/apps/management/proprietor/IntakeReviewTable';
import { cratePayload, gradeFor, groupForProducts, normalizeRows, productCategoryFor, round100, rowToLoot, rowToProduct } from '@/lib/smartInventory';

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

  return <section className="border p-3 space-y-3" style={{ borderColor: '#5C4424', background: '#120D08' }}><div><div className="text-[9px] tracking-[0.22em]" style={{ color: '#E0A22E' }}>SMART INVENTORY INTAKE</div><p className="text-[9px]" style={{ color: '#8A7E6C' }}>Upload or paste stock, review AI suggestions, then sync loot, storefront stock, and warehouse crate records in one approval.</p></div><div className="grid md:grid-cols-5 gap-2"><input placeholder="Source operation" value={sourceOp} onChange={(e) => setSourceOp(e.target.value)} className="bg-transparent border px-2 py-1 text-[10px]" style={{ borderColor: '#3A2F20', color: '#D8CFC0' }} /><input placeholder="Source location" value={sourceLocation} onChange={(e) => setSourceLocation(e.target.value)} className="bg-transparent border px-2 py-1 text-[10px]" style={{ borderColor: '#3A2F20', color: '#D8CFC0' }} /><input placeholder="Crew handle" value={crewHandle} onChange={(e) => setCrewHandle(e.target.value)} className="bg-transparent border px-2 py-1 text-[10px]" style={{ borderColor: '#3A2F20', color: '#D8CFC0' }} /><select value={locationCode} onChange={(e) => setLocationCode(e.target.value)} className="bg-[#0C0A07] border px-2 py-1 text-[10px]" style={{ borderColor: '#3A2F20', color: '#D8CFC0' }}><option value="">No bay assigned</option>{locations.map((l) => <option key={l.id} value={l.code}>{l.code}</option>)}</select><input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-[10px]" style={{ color: '#9C9080' }} /></div><textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Paste item names, quantities, cargo manifests, condition notes, or storefront stock corrections…" className="w-full h-20 bg-transparent border p-2 text-[10px]" style={{ borderColor: '#3A2F20', color: '#D8CFC0' }} /><div className="flex flex-wrap gap-2"><button disabled={analyze.isPending || (!notes.trim() && !file)} onClick={() => analyze.mutate()} className="border px-3 py-2 text-[9px] font-bold disabled:opacity-40" style={{ borderColor: '#8A8F45', color: '#8A8F45' }}>{analyze.isPending ? 'ANALYZING…' : 'ANALYZE INTAKE'}</button><button disabled={save.isPending || rows.length === 0} onClick={() => save.mutate()} className="border px-3 py-2 text-[9px] font-bold disabled:opacity-40" style={{ borderColor: '#C8893B', color: '#E0A22E' }}>{save.isPending ? 'SYNCING…' : `APPROVE + SYNC ${rows.length}`}</button></div>{analyze.isError && <p className="text-[9px]" style={{ color: '#C05050' }}>Intake analysis failed.</p>}{save.isSuccess && <p className="text-[9px]" style={{ color: '#8A8F45' }}>Smart intake synced into loot, storefront stock, and warehouse cargo.</p>}{rows.length > 0 && <IntakeReviewTable rows={rows} setRows={setRows} />}</section>;
}