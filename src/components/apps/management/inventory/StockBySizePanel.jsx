import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Ruler } from 'lucide-react';

const PANEL = { background: '#0E0C09', borderColor: '#2A2118' };
const DIM = '#6B6155';
const AMBER = '#E0A22E';

const SIZES = ['S1', 'S2', 'S3', 'S4', 'S5', 'M', 'L', 'XL', 'N/A'];

/** Stock still on the shelf — sold and scrapped items are gone and are not stock. */
const HELD = ['raw', 'repairing', 'repaired', 'listed'];

const STAGES = [
  { key: 'raw',       label: 'RAW',       color: '#C8893B' },
  { key: 'repairing', label: 'IN REPAIR', color: '#6FA0C8' },
  { key: 'repaired',  label: 'REPAIRED',  color: '#8A8F45' },
  { key: 'listed',    label: 'LISTED',    color: '#5F9A8C' },
];

const fmt = (n) => Math.round(Number(n) || 0).toLocaleString();

/**
 * Salvaged loot held, by size class.
 *
 * Volume is counted in UNITS, not SCU: a size class is a fitting dimension and there is no honest
 * SCU figure on a component. The resale total is the estimate carried on each item, and items with
 * no estimate are reported as a gap rather than treated as worthless.
 */
export default function StockBySizePanel() {
  const [stage, setStage] = useState('');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['stock_by_size'],
    queryFn: () => base44.entities.loot_item.list('-created_date', 500),
  });

  const held = useMemo(
    () => items.filter((i) => HELD.includes(i.status || 'raw') && (!stage || i.status === stage)),
    [items, stage],
  );

  const bySize = useMemo(() => SIZES.map((size) => {
    const rows = held.filter((i) => (i.size_class || 'N/A') === size);
    return {
      size,
      lines: rows.length,
      units: rows.reduce((s, i) => s + (Number(i.quantity) || 1), 0),
      value: rows.reduce((s, i) => s + (Number(i.est_sell_auec) || 0) * (Number(i.quantity) || 1), 0),
    };
  }).filter((r) => r.lines > 0), [held]);

  const totals = bySize.reduce(
    (a, r) => ({ units: a.units + r.units, value: a.value + r.value }),
    { units: 0, value: 0 },
  );
  const maxValue = Math.max(...bySize.map((r) => r.value), 1);
  const unpriced = held.filter((i) => !(Number(i.est_sell_auec) > 0)).length;

  return (
    <div className="space-y-3 font-mono">
      <div className="flex items-center gap-2 text-[9px] tracking-[0.22em]" style={{ color: AMBER }}>
        <Ruler className="w-3.5 h-3.5" /> SALVAGED LOOT HELD — BY SIZE CLASS
      </div>

      <div className="flex flex-wrap gap-1">
        {[{ key: '', label: 'EVERYTHING HELD', color: AMBER }, ...STAGES].map((s) => (
          <button
            key={s.key || 'all'}
            onClick={() => setStage(s.key)}
            className="h-8 px-3 border text-[8px] font-bold tracking-[0.12em]"
            style={{
              borderColor: stage === s.key ? s.color : '#2E2519',
              color: stage === s.key ? s.color : DIM,
              background: stage === s.key ? `${s.color}14` : '#0C0A07',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-4 h-4 animate-spin" style={{ color: AMBER }} /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {[
              { label: 'UNITS HELD', value: fmt(totals.units), color: AMBER },
              { label: 'ESTIMATED RESALE', value: `${fmt(totals.value)} aUEC`, color: '#8A8F45' },
              { label: 'SIZE CLASSES IN STOCK', value: fmt(bySize.length), color: '#6FA0C8' },
              { label: 'ITEMS WITH NO ESTIMATE', value: fmt(unpriced), color: unpriced > 0 ? '#C8893B' : DIM },
            ].map((k) => (
              <div key={k.label} className="border p-3" style={PANEL}>
                <div className="text-[8px] tracking-[0.18em] mb-1" style={{ color: DIM }}>{k.label}</div>
                <div className="text-xl font-bold" style={{ color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>

          {unpriced > 0 && (
            <p className="text-[9px] border px-2 py-1.5 leading-relaxed" style={{ color: '#C8A05B', borderColor: '#4A3A22', background: '#14100A' }}>
              {unpriced} item{unpriced === 1 ? '' : 's'} carry no estimate, so the resale figure is short by whatever
              they are worth. Stated as a gap rather than filled in with a guess.
            </p>
          )}

          {bySize.length === 0 ? (
            <p className="text-[9px] py-6 text-center border" style={{ color: DIM, borderColor: '#2E2519' }}>
              No salvaged loot held at this stage.
            </p>
          ) : (
            <div className="border divide-y" style={{ borderColor: '#241C12' }}>
              {bySize.map((r) => (
                <div key={r.size} className="px-3 py-2 space-y-1.5" style={{ borderColor: '#1C1610' }}>
                  <div className="flex items-center gap-2 text-[9px]">
                    <span className="font-bold tracking-[0.15em] w-10" style={{ color: AMBER }}>{r.size}</span>
                    <span style={{ color: DIM }}>{r.lines} LINE{r.lines === 1 ? '' : 'S'}</span>
                    <span className="ml-auto" style={{ color: '#C6BCAB' }}>{fmt(r.units)} UNITS</span>
                    <span className="w-28 text-right font-bold" style={{ color: '#8A8F45' }}>{fmt(r.value)} aUEC</span>
                  </div>
                  <div className="h-1.5 rounded-sm overflow-hidden" style={{ background: '#1A1208' }}>
                    <div className="h-full rounded-sm" style={{ width: `${Math.min(100, (r.value / maxValue) * 100)}%`, background: AMBER }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}