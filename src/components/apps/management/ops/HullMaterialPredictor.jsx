import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import FormRow, { FormBand } from '@/components/apps/management/ops/fleet/FormRow';

const AMBER = '#E0A22E';
const TEAL  = '#5F9A8C';
const DIM   = '#7A6E60';
const PANEL = { background: '#0E0C09', boxShadow: 'inset 0 0 0 1px #2A2118' };
const CONTROL = { borderColor: '#2A2118', background: '#0B0906', color: '#EDE5D6' };

/**
 * What a wreck gives back. RMC comes off the skin by hull scraping; CM Rubble and
 * CM Scraps come from structural salvage of what is left. The yield figures are the
 * yard's own working estimates for a full strip — they are not published numbers,
 * so they are labelled as estimates everywhere they are shown.
 */
const WRECKS = [
  { ship: 'Light fighter',        rmc: 6,  cmr: 3,  cms: 2,  class: 'Small'   },
  { ship: 'Cutlass Black',        rmc: 12, cmr: 6,  cms: 3,  class: 'Small'   },
  { ship: 'Freelancer',           rmc: 14, cmr: 7,  cms: 4,  class: 'Medium'  },
  { ship: 'Constellation',        rmc: 20, cmr: 10, cms: 6,  class: 'Medium'  },
  { ship: 'C2 Hercules',          rmc: 30, cmr: 15, cms: 8,  class: 'Large'   },
  { ship: 'Caterpillar',          rmc: 34, cmr: 17, cms: 9,  class: 'Large'   },
  { ship: 'Hammerhead',           rmc: 40, cmr: 20, cms: 10, class: 'Large'   },
  { ship: 'Carrack',              rmc: 48, cmr: 24, cms: 12, class: 'Large'   },
  { ship: 'Reclaimer',            rmc: 70, cmr: 35, cms: 18, class: 'Capital' },
  { ship: 'Custom…',              rmc: 0,  cmr: 0,  cms: 0,  class: 'Custom'  },
];

/** Real cargo capacities as published for the live game (starcitizen.tools ship cargo stats). */
const HOLD_SIZES = [
  { label: 'Vulture — 12 SCU',        scu: 12 },
  { label: 'Cutlass Black — 46 SCU',  scu: 46 },
  { label: 'Hull A — 64 SCU',         scu: 64 },
  { label: 'Freelancer MAX — 120 SCU', scu: 120 },
  { label: 'Reclaimer — 420 SCU',     scu: 420 },
  { label: 'Hull B — 512 SCU',        scu: 512 },
  { label: 'Caterpillar — 576 SCU',   scu: 576 },
  { label: 'C2 Hercules — 696 SCU',   scu: 696 },
  { label: 'Hull C — 4,608 SCU',      scu: 4608 },
];

const MATERIALS = {
  RMC: { name: 'RECYCLED MATERIAL COMPOSITE', how: 'hull scraping', color: AMBER },
  CMR: { name: 'CM RUBBLE',                   how: 'structural salvage', color: TEAL },
  CMS: { name: 'CM SCRAPS',                   how: 'structural salvage', color: '#9B6FC0' },
};

function fmt(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toFixed(0);
}

export default function HullMaterialPredictor() {
  const [selected, setSelected] = useState(WRECKS[0]);
  const [custom, setCustom] = useState({ rmc: 20, cmr: 10, cms: 5 });
  const [holdScu, setHoldScu] = useState(12);
  const [extractPct, setExtractPct] = useState(85);

  const { data: prices = [] } = useQuery({
    queryKey: ['commodity_prices'],
    queryFn: () => base44.entities.commodity_price.list(),
  });

  const bestPrice = (code) => {
    const ps = prices.filter((p) => p.commodity_code === code);
    if (!ps.length) return null;
    return ps.reduce((best, p) => (p.price_sell > (best?.price_sell || 0) ? p : best), null);
  };

  const isCustom = selected.class === 'Custom';
  const take = (v) => (isCustom ? v : Math.round(v * extractPct / 100));
  const yields = {
    RMC: isCustom ? Number(custom.rmc) || 0 : take(selected.rmc),
    CMR: isCustom ? Number(custom.cmr) || 0 : take(selected.cmr),
    CMS: isCustom ? Number(custom.cms) || 0 : take(selected.cms),
  };
  const total = yields.RMC + yields.CMR + yields.CMS;

  const priced = Object.keys(MATERIALS).map((code) => {
    const bp = bestPrice(code);
    return { code, val: yields[code], price: bp?.price_sell, terminal: bp?.terminal_name, ...MATERIALS[code] };
  });
  const estValue = priced.reduce((s, m) => s + m.val * (m.price || 0), 0);
  const unpriced = priced.filter((m) => m.val > 0 && !m.price).map((m) => m.code);

  const runs = holdScu > 0 ? Math.max(1, Math.ceil(total / holdScu)) : 1;
  const holdPct = holdScu > 0 ? Math.round((total / holdScu) * 100) : 0;
  const fillColour = holdPct >= 100 ? '#C05050' : holdPct > 75 ? AMBER : TEAL;

  return (
    <div className="space-y-3 font-mono p-4">
      <div>
        <div className="text-[9px] tracking-[0.22em]" style={{ color: AMBER }}>◈ HULL-TO-MATERIAL PREDICTOR</div>
        <p className="text-[7px] leading-relaxed mt-1 max-w-2xl" style={{ color: DIM }}>
          What a wreck is likely to give back, and whether your hold can carry it home in one trip.
          Yields are the yard's own estimates for a full strip, not published figures — hold capacities are the real ones.
        </p>
      </div>

      <div className="p-3 space-y-3" style={PANEL}>
        <FormBand glyph="⬡" title="THE WRECK" note="Pick what you are stripping. Efficiency is how clean the strip is — a rushed job under fire leaves material on the hull.">
          <div className="col-span-2 flex flex-wrap gap-1.5">
            {WRECKS.map((h) => (
              <button
                key={h.ship}
                onClick={() => setSelected(h)}
                className="px-2 py-1 text-[8px] tracking-[0.12em] border transition-colors"
                style={{
                  borderColor: selected.ship === h.ship ? AMBER : '#2A2118',
                  color: selected.ship === h.ship ? AMBER : DIM,
                  background: selected.ship === h.ship ? 'rgba(224,162,46,0.08)' : 'transparent',
                }}
              >
                {h.ship}
              </button>
            ))}
          </div>

          {isCustom ? (
            <>
              {['rmc', 'cmr', 'cms'].map((k) => (
                <FormRow key={k} label={`${k.toUpperCase()} — SCU`} hint={MATERIALS[k.toUpperCase()].how}>
                  <input
                    type="number" min="0" value={custom[k]}
                    onChange={(e) => setCustom((p) => ({ ...p, [k]: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
                    className="h-7 border px-2 text-[9px] tabular-nums" style={CONTROL}
                  />
                </FormRow>
              ))}
            </>
          ) : (
            <FormRow label="EXTRACTION EFFICIENCY" hint={`${extractPct}% · ${extractPct < 60 ? 'rushed' : extractPct < 85 ? 'workmanlike' : 'clean strip'}`} span>
              <input
                type="range" min="40" max="100" value={extractPct}
                onChange={(e) => setExtractPct(Number(e.target.value))}
                className="w-full h-1 accent-amber-500"
              />
            </FormRow>
          )}
        </FormBand>
      </div>

      <div className="p-3 space-y-2.5" style={PANEL}>
        <FormBand glyph="◔" title="EXPECTED YIELD" note="Value is read from the best sell price the yard has on record for each material — never a guess at the market." />
        {priced.map(({ code, val, color, name, how, price, terminal }) => (
          <div key={code}>
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <span className="min-w-0">
                <span className="text-[9px] font-bold" style={{ color }}>{code}</span>
                <span className="text-[7px] ml-1.5 tracking-[0.12em]" style={{ color: DIM }}>{name} · {how}</span>
              </span>
              <span className="text-[9px] tabular-nums shrink-0" style={{ color }}>
                {val} SCU{price ? ` ≈ ${fmt(val * price)} aUEC` : ''}
              </span>
            </div>
            <div className="h-2 overflow-hidden" style={{ background: '#1A1410' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${total > 0 ? (val / total) * 100 : 0}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full"
                style={{ background: color }}
              />
            </div>
            {price && terminal && (
              <div className="text-[7px] mt-0.5 tracking-[0.1em]" style={{ color: '#5F564A' }}>BEST SELL · {terminal} · {fmt(price)} aUEC/SCU</div>
            )}
          </div>
        ))}
        <div className="pt-2 flex items-baseline justify-between" style={{ boxShadow: 'inset 0 1px 0 #2A2118' }}>
          <span className="text-[8px] tracking-[0.2em]" style={{ color: DIM }}>TOTAL YIELD</span>
          <span className="text-[15px] font-bold tabular-nums" style={{ color: AMBER }}>{total} SCU</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-[8px] tracking-[0.2em]" style={{ color: DIM }}>EST. VALUE AT BEST TERMINAL</span>
          <span className="text-[11px] font-bold tabular-nums" style={{ color: estValue > 0 ? TEAL : '#5F564A' }}>
            {estValue > 0 ? `${fmt(estValue)} aUEC` : 'NO PRICES ON RECORD'}
          </span>
        </div>
        {unpriced.length > 0 && (
          <p className="text-[7px]" style={{ color: '#8A7E6C' }}>
            {unpriced.join(', ')} carry no price on record, so the figure above understates the haul — sync the market to close the gap.
          </p>
        )}
      </div>

      <div className="p-3 space-y-2.5" style={PANEL}>
        <FormBand glyph="▦" title="THE HOLD" note="Whether one trip carries it. A Vulture holds 12 SCU — a full capital strip is many trips, not one.">
          <FormRow label="YOUR HOLD" hint="PUBLISHED CAPACITY" span>
            <select value={holdScu} onChange={(e) => setHoldScu(Number(e.target.value))} className="h-7 border px-2 text-[9px]" style={CONTROL}>
              {HOLD_SIZES.map((h) => <option key={h.scu} value={h.scu}>{h.label}</option>)}
            </select>
          </FormRow>
        </FormBand>
        <div>
          <div className="text-[7px] mb-1 flex justify-between tracking-[0.16em]" style={{ color: DIM }}>
            <span>FIRST TRIP FILL</span>
            <span style={{ color: fillColour }}>{holdPct}%</span>
          </div>
          <div className="h-3 overflow-hidden" style={{ background: '#1A1410' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, holdPct)}%` }}
              transition={{ duration: 0.5 }}
              className="h-full"
              style={{ background: fillColour }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between pt-2" style={{ boxShadow: 'inset 0 1px 0 #2A2118' }}>
          <span className="text-[8px] tracking-[0.2em]" style={{ color: DIM }}>HAUL TRIPS REQUIRED</span>
          <span className="text-[17px] font-bold tabular-nums" style={{ color: runs > 1 ? '#C05050' : TEAL }}>{runs}×</span>
        </div>
        {runs > 1 && (
          <p className="text-[7px] px-2 py-1.5" style={{ boxShadow: 'inset 0 0 0 1px #C0505040', color: '#C05050', background: '#C0505010' }}>
            ⚠ {runs} trips at {holdScu} SCU — stage an intermediate offload, bring a hauler, or accept leaving material on the wreck.
          </p>
        )}
      </div>
    </div>
  );
}