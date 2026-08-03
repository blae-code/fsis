import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Boxes } from 'lucide-react';

const PANEL = { background: '#0E0C09', borderColor: '#2A2118' };
const DIM = '#6B6155';

const CLASSES = [
  { key: 'commodity', label: 'COMMODITY', color: '#E0A22E' },
  { key: 'gear',      label: 'GEAR',      color: '#5F9A8C' },
  { key: 'component', label: 'COMPONENT', color: '#6FA0C8' },
  { key: 'weapon',    label: 'WEAPON',    color: '#C05050' },
];

const STAGES = [
  { key: 'collected', label: 'COLLECTED — NOT YET WORKED', color: '#C8893B' },
  { key: 'processed', label: 'PROCESSED — READY TO SELL',  color: '#8A8F45' },
];

const fmt = (n) => Math.round(Number(n) || 0).toLocaleString();

/**
 * Stock on hand, by class.
 *
 * Only lots not yet sold are counted: a sold lot is money that already came in, and adding it to
 * stock levels would read the same value twice. The resale figure is an ESTIMATE carried on each lot
 * and is labelled as one — it is what we expect, never what we have.
 */
export default function StockByClassPanel() {
  const [stage, setStage] = useState('');

  const { data: lots = [], isLoading } = useQuery({
    queryKey: ['stock_by_class'],
    queryFn: () => base44.entities.cargo_lot.list('-created_date', 500),
  });

  const held = useMemo(
    () => lots.filter((l) => l.status !== 'sold' && (!stage || l.status === stage)),
    [lots, stage],
  );

  const byClass = useMemo(() => CLASSES.map((c) => {
    const rows = held.filter((l) => (l.lot_type || 'commodity') === c.key);
    const scu = rows.reduce((s, l) => s + (Number(l.quantity_scu) || 0), 0);
    const value = rows.reduce((s, l) => s + (Number(l.est_value_auec) || 0), 0);
    const codes = {};
    rows.forEach((l) => {
      const code = (l.commodity_code || '').toUpperCase() || 'UNCODED';
      codes[code] = codes[code] || { code, scu: 0, value: 0 };
      codes[code].scu += Number(l.quantity_scu) || 0;
      codes[code].value += Number(l.est_value_auec) || 0;
    });
    return { ...c, lots: rows.length, scu, value, codes: Object.values(codes).sort((a, b) => b.value - a.value) };
  }), [held]);

  const totals = byClass.reduce(
    (a, c) => ({ scu: a.scu + c.scu, value: a.value + c.value, lots: a.lots + c.lots }),
    { scu: 0, value: 0, lots: 0 },
  );
  const maxValue = Math.max(...byClass.map((c) => c.value), 1);
  const unpriced = held.filter((l) => !(Number(l.est_value_auec) > 0)).length;

  return (
    <div className="space-y-3 font-mono">
      <div className="flex items-center gap-2 text-[9px] tracking-[0.22em]" style={{ color: '#E0A22E' }}>
        <Boxes className="w-3.5 h-3.5" /> STOCK ON HAND — BY CLASS
      </div>

      <div className="flex flex-wrap gap-1">
        {[{ key: '', label: 'EVERYTHING HELD', color: '#E0A22E' }, ...STAGES].map((s) => (
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
        <div className="flex justify-center py-10"><Loader2 className="w-4 h-4 animate-spin" style={{ color: '#E0A22E' }} /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {[
              { label: 'VOLUME HELD', value: `${fmt(totals.scu)} SCU`, color: '#E0A22E' },
              { label: 'ESTIMATED RESALE', value: `${fmt(totals.value)} aUEC`, color: '#8A8F45' },
              { label: 'LOTS HELD', value: fmt(totals.lots), color: '#6FA0C8' },
              { label: 'LOTS WITH NO ESTIMATE', value: fmt(unpriced), color: unpriced > 0 ? '#C8893B' : DIM },
            ].map((k) => (
              <div key={k.label} className="border p-3" style={PANEL}>
                <div className="text-[8px] tracking-[0.18em] mb-1" style={{ color: DIM }}>{k.label}</div>
                <div className="text-xl font-bold" style={{ color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>

          {unpriced > 0 && (
            <p className="text-[9px] border px-2 py-1.5 leading-relaxed" style={{ color: '#C8A05B', borderColor: '#4A3A22', background: '#14100A' }}>
              {unpriced} lot{unpriced === 1 ? '' : 's'} carry no estimate, so the resale figure above is short by
              whatever they are worth. It is stated as a gap rather than filled in with a guess.
            </p>
          )}

          <div className="space-y-2">
            {byClass.map((c) => (
              <div key={c.key} className="border p-3 space-y-2" style={PANEL}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold tracking-[0.15em]" style={{ color: c.color }}>{c.label}</span>
                    <span className="text-[8px]" style={{ color: DIM }}>{c.lots} LOT{c.lots === 1 ? '' : 'S'}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold" style={{ color: c.color }}>{fmt(c.value)} <span className="text-[8px]">aUEC EST</span></div>
                    <div className="text-[9px]" style={{ color: DIM }}>{fmt(c.scu)} SCU</div>
                  </div>
                </div>

                <div className="h-2 rounded-sm overflow-hidden" style={{ background: '#1A1208' }}>
                  <div className="h-full rounded-sm" style={{ width: `${Math.min(100, (c.value / maxValue) * 100)}%`, background: c.color }} />
                </div>

                {c.codes.length > 0 ? (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-0.5">
                    {c.codes.map((k) => (
                      <div key={k.code} className="flex items-center gap-2 text-[9px]">
                        <span style={{ color: '#C6BCAB' }}>{k.code}</span>
                        <span className="ml-auto" style={{ color: DIM }}>{fmt(k.scu)} SCU</span>
                        <span style={{ color: c.color }}>{fmt(k.value)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[9px]" style={{ color: DIM }}>Nothing of this class held.</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}