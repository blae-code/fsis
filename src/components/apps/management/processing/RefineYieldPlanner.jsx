import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import FormRow, { FormBand } from '@/components/apps/management/ops/fleet/FormRow';
import { FEEDSTOCKS, METHODS, feedMeta, methodMeta, refineEstimate } from './refineryMethods';

const CONTROL = { borderColor: '#3A2F20', background: '#0B0906', color: '#EDE5D6' };
const num = (n) => Math.round(n).toLocaleString();

/** Reckon the hopper before it is filled: method against yield, wait and fee. */
export default function RefineYieldPlanner() {
  const [feedId, setFeedId] = useState('quantanium');
  const [methodId, setMethodId] = useState('dinyx');
  const [scu, setScu] = useState(100);
  const [price, setPrice] = useState('');

  const { data: prices = [] } = useQuery({
    queryKey: ['refine_prices'],
    queryFn: () => base44.entities.commodity_price.list('-updated_date', 300),
  });

  const feed = feedMeta(feedId);
  const marketPrice = useMemo(() => {
    const hit = prices.find((p) => String(p.commodity_name || '').toLowerCase().includes(feed.label.split(' ')[0].toLowerCase()));
    return Number(hit?.sell_price || hit?.price_auec || 0);
  }, [prices, feed]);
  const unitPrice = price === '' ? marketPrice : Number(price) || 0;

  const est = refineEstimate({ feedId, methodId, scu, unitPrice });
  const ranked = useMemo(
    () => METHODS.map((m) => ({ m, e: refineEstimate({ feedId, methodId: m.id, scu, unitPrice }) })).sort((a, b) => b.e.net - a.e.net),
    [feedId, scu, unitPrice],
  );
  const best = ranked[0];

  return (
    <div className="space-y-3 font-mono">
      <FormBand glyph="⚗" title="THE HOPPER" note="What goes in, by which method. Yield, wait and fee all move together — the fastest method is rarely the one that returns most.">
        <FormRow label="FEEDSTOCK" hint={feed.kind === 'salvage' ? 'SCRAPED MATERIAL' : 'RAW ORE'}>
          <select value={feedId} onChange={(e) => setFeedId(e.target.value)} className="h-7 border px-2 text-[9px]" style={CONTROL}>
            {FEEDSTOCKS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
          </select>
        </FormRow>
        <FormRow label="METHOD" hint={methodMeta(methodId).note.toUpperCase()}>
          <select value={methodId} onChange={(e) => setMethodId(e.target.value)} className="h-7 border px-2 text-[9px]" style={CONTROL}>
            {METHODS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </FormRow>
        <FormRow label="RAW QUANTITY" hint="SCU INTO THE HOPPER">
          <input type="number" value={scu} onChange={(e) => setScu(e.target.value)} className="h-7 border px-2 text-[9px]" style={CONTROL} />
        </FormRow>
        <FormRow label="REFINED UNIT PRICE" hint={price === '' ? (marketPrice ? `MARKET ${num(marketPrice)} aUEC` : 'NO MARKET READING') : 'STATED BY HAND'}>
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder={marketPrice ? String(marketPrice) : 'aUEC per SCU'} className="h-7 border px-2 text-[9px]" style={CONTROL} />
        </FormRow>
      </FormBand>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-px" style={{ background: '#241C14' }}>
        {[
          { k: 'COMES OUT', v: `${est.outScu} SCU`, s: `${est.yieldPct}% OF ${est.input} SCU`, c: '#E0A22E' },
          { k: 'LOST TO REFINING', v: `${est.lostScu} SCU`, s: 'NEVER LEAVES THE HOPPER', c: '#C05050' },
          { k: 'WAIT', v: `${est.hours} H`, s: est.readyAt.toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' }).toUpperCase(), c: '#8A7E6C' },
          { k: 'NET AFTER FEE', v: `${num(est.net)}`, s: `FEE ${num(est.cost)} aUEC`, c: est.net > 0 ? '#5F6B33' : '#C05050' },
        ].map((t) => (
          <div key={t.k} className="p-2" style={{ background: '#0B0906' }}>
            <p className="text-[7px] tracking-[0.2em]" style={{ color: '#5F564A' }}>{t.k}</p>
            <p className="text-[15px] tabular-nums leading-tight" style={{ color: t.c }}>{t.v}</p>
            <p className="text-[7px] tracking-[0.12em]" style={{ color: '#4A4136' }}>{t.s}</p>
          </div>
        ))}
      </div>

      {best && best.m.id !== methodId && (
        <p className="text-[8px]" style={{ color: '#E0A22E' }}>
          {best.m.label} returns {num(best.e.net - est.net)} aUEC more on this load ({best.e.hours} h wait against {est.hours} h).
        </p>
      )}

      <div>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-[7px] font-bold tracking-[0.24em]" style={{ color: '#EDE5D6' }}>METHOD COMPARISON</span>
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg,#3A2F20,transparent)' }} />
        </div>
        <div className="divide-y" style={{ borderColor: '#1A150F' }}>
          {ranked.map(({ m, e }) => (
            <button
              key={m.id}
              onClick={() => setMethodId(m.id)}
              className="w-full flex items-baseline gap-2 px-1 py-1 text-left"
              style={{ background: m.id === methodId ? 'linear-gradient(90deg,#1B1309,#0B0906)' : 'transparent' }}
            >
              <span className="text-[8px] w-40 truncate" style={{ color: m.id === methodId ? '#F0E7D6' : '#B8AC9A' }}>{m.label}</span>
              <span className="text-[7px] tabular-nums w-20" style={{ color: '#8A7E6C' }}>{e.outScu} SCU</span>
              <span className="text-[7px] tabular-nums w-16" style={{ color: '#8A7E6C' }}>{e.hours} H</span>
              <span className="text-[7px] tabular-nums ml-auto" style={{ color: e.net > 0 ? '#5F6B33' : '#C05050' }}>{num(e.net)} aUEC</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}