import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, Loader2, Check } from 'lucide-react';

const CATS = ['fuel', 'repairs', 'fees_fines', 'equipment', 'ship_rental', 'other'];
const PANEL = { background: '#0E0C09', borderColor: '#2A2118' };
const DIM = '#7A6E60';

/**
 * Photograph a refuel, repair, rearm or component-shop screen and have every charge on it
 * become an expense line. A receipt has several charges on it; typing them one field at a
 * time is how the small costs quietly stop being recorded at all.
 */
export default function ExpenseReceiptReader() {
  const qc = useQueryClient();
  const [file, setFile] = useState(null);
  const [lines, setLines] = useState([]);
  const today = new Date().toISOString().slice(0, 10);

  const read = useMutation({
    mutationFn: async () => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const r = await base44.integrations.Core.InvokeLLM({
        prompt: `This is a screenshot of a Star Citizen refuelling, repair, rearming, component shop or fine/fee screen. Read every individual charge shown: what was bought or paid for, the amount in aUEC, and which category it belongs to (${CATS.join(', ')}). Also read the station or location name if visible. Omit any charge whose amount you cannot actually read. Do not include totals as a separate line if the individual charges are already listed.`,
        file_urls: [file_url],
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            location: { type: 'string' },
            lines: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  description: { type: 'string' },
                  amount_auec: { type: 'number' },
                  category: { type: 'string', enum: CATS },
                },
                required: ['description', 'amount_auec'],
              },
            },
          },
          required: ['lines'],
        },
      });
      const rows = (r.lines || [])
        .filter((l) => Number(l.amount_auec) > 0)
        .map((l) => ({
          description: r.location ? `${l.description} — ${r.location}` : l.description,
          amount_auec: Math.round(Number(l.amount_auec)),
          category: CATS.includes(l.category) ? l.category : 'other',
        }));
      if (!rows.length) throw new Error('No charge could be read from that shot.');
      return rows;
    },
    onSuccess: (rows) => { setLines(rows); setFile(null); },
  });

  const commit = useMutation({
    mutationFn: () => base44.entities.ledger_entry.bulkCreate(lines.map((l) => ({
      entry_type: 'expense',
      category: l.category,
      amount_auec: l.amount_auec,
      description: l.description,
      entry_date: today,
      source: 'manual',
      notes: 'Read from a receipt photograph.',
    }))),
    onSuccess: () => { setLines([]); qc.invalidateQueries({ queryKey: ['ledger_today'] }); },
  });

  const total = lines.reduce((s, l) => s + l.amount_auec, 0);

  return (
    <div className="border p-3 space-y-2 font-mono" style={PANEL}>
      <div className="flex items-center gap-2">
        <span className="text-[8px] tracking-[0.18em] flex items-center gap-1 shrink-0" style={{ color: '#8A8F45' }}>
          <Camera className="w-3 h-3" /> READ A RECEIPT
        </span>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="text-[8px] flex-1 min-w-0"
          style={{ color: DIM }}
        />
        <button
          disabled={!file || read.isPending}
          onClick={() => read.mutate()}
          className="px-2 py-1 border text-[8px] font-bold tracking-[0.14em] inline-flex items-center gap-1 disabled:opacity-40 shrink-0"
          style={{ borderColor: '#8A6430', color: '#E0A22E' }}
        >
          {read.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null} READ CHARGES
        </button>
      </div>

      {read.isError && <p className="text-[8px]" style={{ color: '#C05050' }}>{read.error?.message || 'That receipt could not be read.'}</p>}

      {lines.length > 0 && (
        <div className="space-y-1">
          {lines.map((l, i) => (
            <div key={i} className="flex items-center gap-2 text-[9px]">
              <input
                value={l.description}
                onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))}
                className="flex-1 min-w-0 bg-transparent border px-1.5 py-1 text-[9px] outline-none"
                style={{ borderColor: '#2A2118', color: '#D8CFC0' }}
              />
              <select
                value={l.category}
                onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, category: e.target.value } : x)))}
                className="border px-1 py-1 text-[8px]"
                style={{ borderColor: '#2A2118', background: '#0B0906', color: DIM }}
              >
                {CATS.map((c) => <option key={c} value={c}>{c.replace('_', ' ').toUpperCase()}</option>)}
              </select>
              <input
                type="number"
                value={l.amount_auec}
                onChange={(e) => setLines((ls) => ls.map((x, j) => (j === i ? { ...x, amount_auec: Number(e.target.value) || 0 } : x)))}
                className="w-24 bg-transparent border px-1.5 py-1 text-[9px] text-right tabular-nums outline-none"
                style={{ borderColor: '#2A2118', color: '#C05050' }}
              />
              <button onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))} className="text-[9px] shrink-0" style={{ color: DIM }}>✕</button>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[8px] tracking-[0.16em]" style={{ color: DIM }}>{lines.length} CHARGES · {total.toLocaleString()} aUEC</span>
            <button
              disabled={commit.isPending}
              onClick={() => commit.mutate()}
              className="ml-auto px-2 py-1 border text-[8px] font-bold tracking-[0.14em] inline-flex items-center gap-1 disabled:opacity-40"
              style={{ borderColor: '#E0A22E', color: '#E0A22E' }}
            >
              {commit.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} LOG ALL
            </button>
          </div>
          {commit.isError && <p className="text-[8px]" style={{ color: '#C05050' }}>Nothing was logged — try again.</p>}
        </div>
      )}
    </div>
  );
}