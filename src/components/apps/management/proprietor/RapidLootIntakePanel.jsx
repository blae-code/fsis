import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import IntakeReviewTable from '@/components/apps/management/proprietor/IntakeReviewTable';

const gradeFor = (pct) => pct >= 95 ? 'new' : pct >= 80 ? 'refurb' : pct >= 55 ? 'used' : 'worn';
const round100 = (n) => Math.round(Number(n || 0) / 100) * 100;

export default function RapidLootIntakePanel() {
  const qc = useQueryClient();
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [sourceOp, setSourceOp] = useState('');
  const [sourceLocation, setSourceLocation] = useState('');
  const [crewHandle, setCrewHandle] = useState('');
  const { data: specs = [] } = useQuery({ queryKey: ['item_specs_intake'], queryFn: () => base44.entities.item_spec.list('item_name', 120) });
  const { data: existingLoot = [] } = useQuery({ queryKey: ['loot_intake_duplicates'], queryFn: () => base44.entities.loot_item.list('-created_date', 300) });
  const specHint = useMemo(() => specs.slice(0, 80).map((s) => ({ item_name: s.item_name, item_type: s.item_type, size_class: s.size_class, manufacturer: s.manufacturer, base_value_auec: s.base_value_auec })).filter((s) => s.item_name), [specs]);
  const duplicateCount = (item) => existingLoot.filter((l) => String(l.item_name || '').toLowerCase() === String(item.item_name || '').toLowerCase() && String(l.source_op || '') === sourceOp).length;

  const analyze = useMutation({ mutationFn: async () => {
    let fileUrl = null;
    if (file) fileUrl = (await base44.integrations.Core.UploadFile({ file })).file_url;
    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Extract Star Citizen loot inventory from the provided notes and/or screenshot. Normalize names against this known catalog when possible: ${JSON.stringify(specHint)}. Estimate resale value in aUEC using condition and catalog base values when available. Notes: ${notes || 'none'}`,
      file_urls: fileUrl ? [fileUrl] : null,
      response_json_schema: { type: 'object', properties: { items: { type: 'array', items: { type: 'object', properties: { item_name: { type: 'string' }, item_type: { type: 'string', enum: ['fps_gear', 'weapon', 'ship_component', 'vehicle_component', 'bulk_cargo'] }, manufacturer: { type: 'string' }, size_class: { type: 'string' }, quantity: { type: 'number' }, condition_pct: { type: 'number' }, est_sell_auec: { type: 'number' }, notes: { type: 'string' }, confidence: { type: 'number' } }, required: ['item_name'] } } }, required: ['items'] },
    });
    return (result.items || []).map((i) => ({ ...i, quantity: i.quantity || 1, size_class: i.size_class || 'N/A', condition_pct: i.condition_pct || 100, condition_grade: gradeFor(i.condition_pct || 100), est_sell_auec: round100(i.est_sell_auec), duplicate_count: duplicateCount(i) }));
  }, onSuccess: setRows });

  const save = useMutation({ mutationFn: () => base44.entities.loot_item.bulkCreate(rows.filter((r) => r.item_name).map((r) => ({ item_name: r.item_name, item_type: r.item_type || 'ship_component', manufacturer: r.manufacturer || '', size_class: r.size_class || 'N/A', quantity: Number(r.quantity || 1), condition_pct: Number(r.condition_pct || 100), condition_grade: gradeFor(Number(r.condition_pct || 100)), source_op: sourceOp, source_location: sourceLocation, crew_handle: crewHandle, status: 'raw', est_sell_auec: round100(r.est_sell_auec), notes: [r.notes, r.confidence ? `AI confidence: ${Math.round(r.confidence * 100)}%` : ''].filter(Boolean).join('\n') }))), onSuccess: () => { setRows([]); setNotes(''); setFile(null); qc.invalidateQueries({ queryKey: ['loot_command'] }); } });

  return (
    <section className="border p-3 space-y-3" style={{ borderColor: '#5C4424', background: '#120D08' }}>
      <div><div className="text-[9px] tracking-[0.22em]" style={{ color: '#E0A22E' }}>RAPID LOOT INTAKE</div><p className="text-[9px]" style={{ color: '#8A7E6C' }}>Upload an inventory screenshot or paste a haul list, then review before adding to stock.</p></div>
      <div className="grid md:grid-cols-4 gap-2"><input placeholder="Source operation" value={sourceOp} onChange={(e) => setSourceOp(e.target.value)} className="bg-transparent border px-2 py-1 text-[10px]" style={{ borderColor: '#3A2F20', color: '#D8CFC0' }} /><input placeholder="Source location" value={sourceLocation} onChange={(e) => setSourceLocation(e.target.value)} className="bg-transparent border px-2 py-1 text-[10px]" style={{ borderColor: '#3A2F20', color: '#D8CFC0' }} /><input placeholder="Crew handle" value={crewHandle} onChange={(e) => setCrewHandle(e.target.value)} className="bg-transparent border px-2 py-1 text-[10px]" style={{ borderColor: '#3A2F20', color: '#D8CFC0' }} /><input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="text-[10px]" style={{ color: '#9C9080' }} /></div>
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Paste item names, quantities, notes, or condition details…" className="w-full h-20 bg-transparent border p-2 text-[10px]" style={{ borderColor: '#3A2F20', color: '#D8CFC0' }} />
      <div className="flex flex-wrap gap-2"><button disabled={analyze.isPending || (!notes.trim() && !file)} onClick={() => analyze.mutate()} className="border px-3 py-2 text-[9px] font-bold disabled:opacity-40" style={{ borderColor: '#8A8F45', color: '#8A8F45' }}>{analyze.isPending ? 'ANALYZING…' : 'ANALYZE INTAKE'}</button><button disabled={save.isPending || rows.length === 0} onClick={() => save.mutate()} className="border px-3 py-2 text-[9px] font-bold disabled:opacity-40" style={{ borderColor: '#C8893B', color: '#E0A22E' }}>{save.isPending ? 'SAVING…' : `SAVE ${rows.length} ITEM${rows.length === 1 ? '' : 'S'}`}</button></div>
      {analyze.isError && <p className="text-[9px]" style={{ color: '#C05050' }}>Intake analysis failed.</p>}
      {save.isSuccess && <p className="text-[9px]" style={{ color: '#8A8F45' }}>Loot inventory saved.</p>}
      {rows.length > 0 && <IntakeReviewTable rows={rows} setRows={setRows} />}
    </section>
  );
}