import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Loader2, Check } from 'lucide-react';

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Photograph a station's local inventory screen and set the storefront count to what is
 * actually sitting there. This is a count, not an addition — the reconciliation gap comes
 * from stock that was sold, lost or moved and never written down anywhere.
 */
export default function StationSweepPanel() {
  const qc = useQueryClient();
  const [file, setFile] = useState(null);
  const [station, setStation] = useState('');
  const [rows, setRows] = useState([]);

  const { data: products = [] } = useQuery({
    queryKey: ['products_admin'],
    queryFn: () => base44.entities.product.list('-updated_date', 300),
  });

  const read = useMutation({
    mutationFn: async () => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const r = await base44.integrations.Core.InvokeLLM({
        prompt: 'This is a screenshot of a Star Citizen local inventory screen at a station or a personal/ship storage screen. Read every item held and its quantity. Also read the station or location name if it is shown. Omit anything whose name you cannot actually read.',
        file_urls: [file_url],
        model: 'gemini_3_flash',
        response_json_schema: {
          type: 'object',
          properties: {
            station: { type: 'string' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: { item_name: { type: 'string' }, quantity: { type: 'number' } },
                required: ['item_name'],
              },
            },
          },
          required: ['items'],
        },
      });
      const items = (r.items || []).filter((i) => i.item_name);
      if (!items.length) throw new Error('No item could be read from that shot.');
      return {
        station: r.station || '',
        rows: items.map((i) => {
          const match = products.find((p) => norm(p.product_name) === norm(i.item_name))
            || products.find((p) => norm(p.product_name).includes(norm(i.item_name)) && norm(i.item_name).length > 4);
          return {
            item_name: i.item_name,
            counted: Math.max(0, Math.round(Number(i.quantity) || 0)),
            product_id: match?.id || null,
            product_name: match?.product_name || null,
            on_book: match ? Number(match.stock || 0) : null,
          };
        }),
      };
    },
    onSuccess: (r) => { setRows(r.rows); setStation((s) => s || r.station); setFile(null); },
  });

  const matched = rows.filter((r) => r.product_id && r.counted !== r.on_book);

  const commit = useMutation({
    mutationFn: () => base44.entities.product.bulkUpdate(matched.map((r) => ({
      id: r.product_id,
      stock: r.counted,
      available: r.counted > 0,
      notes: `Counted ${r.counted} at ${station || 'an unnamed station'} from an inventory photograph.`,
    }))),
    onSuccess: () => { setRows([]); qc.invalidateQueries({ queryKey: ['products_admin'] }); qc.invalidateQueries({ queryKey: ['products'] }); },
  });

  return (
    <div className="border p-3 space-y-2 font-mono" style={{ borderColor: '#3A2F20', background: '#0C0A07' }}>
      <div className="flex items-center gap-2">
        <span className="text-[8px] tracking-[0.18em] flex items-center gap-1 shrink-0" style={{ color: '#8A8F45' }}>
          <Camera className="w-3 h-3" /> SWEEP A STATION
        </span>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="text-[8px] flex-1 min-w-0"
          style={{ color: '#8A7E6C' }}
        />
        <button
          disabled={!file || read.isPending}
          onClick={() => read.mutate()}
          className="px-2 py-1 border text-[8px] font-bold tracking-[0.14em] inline-flex items-center gap-1 disabled:opacity-40 shrink-0"
          style={{ borderColor: '#8A6430', color: '#E0A22E' }}
        >
          {read.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null} COUNT IT
        </button>
      </div>
      <p className="text-[7px] leading-relaxed" style={{ color: '#5F564A' }}>
        This sets the count to what the screen shows rather than adding to it — a sweep is how stock that was sold,
        lost or moved without a word gets corrected on the books.
      </p>

      {read.isError && <p className="text-[8px]" style={{ color: '#C05050' }}>{read.error?.message || 'That screen could not be read.'}</p>}

      {rows.length > 0 && (
        <div className="space-y-1.5">
          <input
            value={station}
            onChange={(e) => setStation(e.target.value)}
            placeholder="Which station was counted"
            className="w-full h-7 border px-2 text-[9px]"
            style={{ borderColor: '#3A2F20', background: '#0B0906', color: '#EDE5D6' }}
          />
          <div className="divide-y" style={{ borderColor: '#1A150F' }}>
            {rows.map((r, i) => {
              const unmatched = !r.product_id;
              const delta = unmatched ? null : r.counted - r.on_book;
              return (
                <div key={i} className="flex items-baseline gap-2 py-1">
                  <span className="text-[9px] flex-1 truncate" style={{ color: unmatched ? '#5F564A' : '#EDE5D6' }}>
                    {r.product_name || r.item_name}
                  </span>
                  <span className="text-[8px] tabular-nums w-20 text-right" style={{ color: '#8A7E6C' }}>
                    {unmatched ? 'NOT LISTED' : `BOOK ${r.on_book}`}
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={r.counted}
                    onChange={(e) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, counted: Math.max(0, Number(e.target.value) || 0) } : x)))}
                    className="w-16 border px-1 py-0.5 text-[9px] text-right tabular-nums"
                    style={{ borderColor: '#2A2118', background: '#0B0906', color: '#EDE5D6' }}
                  />
                  <span className="text-[8px] tabular-nums w-12 text-right" style={{ color: !delta ? '#4A4136' : delta > 0 ? '#8A8F45' : '#C05050' }}>
                    {delta === null ? '—' : delta === 0 ? 'AGREES' : delta > 0 ? `+${delta}` : delta}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[8px] tracking-[0.16em]" style={{ color: '#5F564A' }}>
              {matched.length ? `${matched.length} LISTING${matched.length > 1 ? 'S' : ''} DISAGREE` : 'THE BOOKS AGREE WITH THE SCREEN'}
            </span>
            <button
              disabled={!matched.length || commit.isPending}
              onClick={() => commit.mutate()}
              className="ml-auto px-2 py-1 border text-[8px] font-bold tracking-[0.14em] inline-flex items-center gap-1 disabled:opacity-40"
              style={{ borderColor: '#E0A22E', color: '#E0A22E' }}
            >
              {commit.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} CORRECT THE BOOKS
            </button>
          </div>
          {commit.isError && <p className="text-[8px]" style={{ color: '#C05050' }}>Nothing was corrected — try again.</p>}
        </div>
      )}
    </div>
  );
}