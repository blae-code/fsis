import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const AMBER = '#E0A22E';
const TEAL  = '#5F9A8C';
const DIM   = '#7A6E60';
const PANEL = { background: '#0E0C09', borderColor: '#2A2118' };

// Hull volume data (SCU equivalent yield estimates by ship class)
const HULL_DATA = [
  { ship: 'Reclaimer',       rmc: 512, cmr: 256, cms: 128, hold: 756, class: 'Capital' },
  { ship: 'Vulture',         rmc: 48,  cmr: 24,  cms: 12,  hold: 64,  class: 'Light' },
  { ship: 'Hull C (wreck)',  rmc: 192, cmr: 96,  cms: 48,  hold: 330, class: 'Heavy' },
  { ship: 'Caterpillar',     rmc: 96,  cmr: 48,  cms: 24,  hold: 174, class: 'Medium' },
  { ship: 'Constellation',   rmc: 64,  cmr: 32,  cms: 16,  hold: 96,  class: 'Medium' },
  { ship: 'Hammerhead',      rmc: 128, cmr: 64,  cms: 32,  hold: 216, class: 'Heavy' },
  { ship: 'Carrack',         rmc: 80,  cmr: 40,  cms: 20,  hold: 144, class: 'Heavy' },
  { ship: 'Hercules C2',     rmc: 72,  cmr: 36,  cms: 18,  hold: 120, class: 'Medium' },
  { ship: 'Merchantman',     rmc: 220, cmr: 110, cms: 55,  hold: 378, class: 'Capital' },
  { ship: 'Javelin',         rmc: 640, cmr: 320, cms: 160, hold: 1200, class: 'Capital' },
  { ship: 'Bengal',          rmc: 1024,cmr: 512, cms: 256, hold: 2048, class: 'Capital' },
  { ship: 'Freelancer MAX',  rmc: 32,  cmr: 16,  cms: 8,   hold: 48,  class: 'Light' },
  { ship: 'Custom…',         rmc: 0,   cmr: 0,   cms: 0,   hold: 0,   class: 'Custom' },
];

const HOLD_SIZES = [
  { label: 'Vulture (64 SCU)',     scu: 64  },
  { label: 'Hull A (12 SCU)',      scu: 12  },
  { label: 'Cutlass Black (40 SCU)', scu: 40 },
  { label: 'Hull B (96 SCU)',      scu: 96  },
  { label: 'Hull C (330 SCU)',     scu: 330 },
  { label: 'Hull D (552 SCU)',     scu: 552 },
  { label: 'Reclaimer (756 SCU)',  scu: 756 },
];

function fmt(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toFixed(0);
}

export default function HullMaterialPredictor() {
  const [selected, setSelected] = useState(HULL_DATA[0]);
  const [customRmc, setCustomRmc] = useState(100);
  const [customCmr, setCustomCmr] = useState(50);
  const [customCms, setCustomCms] = useState(25);
  const [holdScu, setHoldScu] = useState(756);
  const [extractPct, setExtractPct] = useState(85);

  const { data: prices = [] } = useQuery({
    queryKey: ['commodity_prices'],
    queryFn: () => base44.entities.commodity_price.list(),
  });

  const bestPrice = (code) => {
    const ps = prices.filter(p => p.commodity_code === code);
    if (!ps.length) return null;
    return ps.reduce((best, p) => p.price_sell > (best?.price_sell || 0) ? p : best, null);
  };

  const isCustom = selected.class === 'Custom';
  const rmc = isCustom ? customRmc : Math.round(selected.rmc * extractPct / 100);
  const cmr = isCustom ? customCmr : Math.round(selected.cmr * extractPct / 100);
  const cms = isCustom ? customCms : Math.round(selected.cms * extractPct / 100);
  const total = rmc + cmr + cms;

  const bpRmc = bestPrice('RMC');
  const bpCmr = bestPrice('CMR');
  const bpCms = bestPrice('CMS');

  const estValue =
    (rmc * (bpRmc?.price_sell || 0)) +
    (cmr * (bpCmr?.price_sell || 0)) +
    (cms * (bpCms?.price_sell || 0));

  const runs = holdScu > 0 ? Math.ceil(total / holdScu) : 1;
  const holdPct = Math.min(100, Math.round((total / holdScu) * 100));

  const bars = [
    { code: 'RMC', val: rmc, color: AMBER,  price: bpRmc?.price_sell },
    { code: 'CMR', val: cmr, color: TEAL,   price: bpCmr?.price_sell },
    { code: 'CMS', val: cms, color: '#9B6FC0', price: bpCms?.price_sell },
  ];

  return (
    <div className="space-y-4 font-mono p-4">
      {/* Header */}
      <div className="text-[9px] tracking-[0.2em]" style={{ color: DIM }}>◈ HULL-TO-MATERIAL PREDICTOR</div>

      {/* Ship selector */}
      <div className="border p-3 space-y-3" style={PANEL}>
        <div className="text-[8px] tracking-[0.18em] mb-1" style={{ color: DIM }}>TARGET HULL</div>
        <div className="flex flex-wrap gap-2">
          {HULL_DATA.map((h) => (
            <button
              key={h.ship}
              onClick={() => setSelected(h)}
              className="px-2.5 py-1 text-[9px] tracking-[0.1em] border transition-all"
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

        {/* Custom inputs */}
        {isCustom && (
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[['RMC', customRmc, setCustomRmc], ['CMR', customCmr, setCustomCmr], ['CMS', customCms, setCustomCms]].map(([label, val, setter]) => (
              <div key={label}>
                <div className="text-[8px] mb-1" style={{ color: DIM }}>{label} (SCU)</div>
                <input
                  type="number" min="0" value={val}
                  onChange={e => setter(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-transparent border px-2 py-1 text-[10px] outline-none"
                  style={{ borderColor: '#2A2118', color: AMBER }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Extraction efficiency slider */}
        {!isCustom && (
          <div>
            <div className="text-[8px] mb-1 flex justify-between" style={{ color: DIM }}>
              <span>EXTRACTION EFFICIENCY</span>
              <span style={{ color: AMBER }}>{extractPct}%</span>
            </div>
            <input type="range" min="40" max="100" value={extractPct}
              onChange={e => setExtractPct(Number(e.target.value))}
              className="w-full h-1 accent-amber-500"
            />
            <div className="flex justify-between text-[8px] mt-0.5" style={{ color: DIM }}>
              <span>40% rough</span><span>100% perfect</span>
            </div>
          </div>
        )}
      </div>

      {/* Yield breakdown */}
      <div className="border p-3 space-y-3" style={PANEL}>
        <div className="text-[8px] tracking-[0.18em]" style={{ color: DIM }}>EXPECTED YIELD</div>
        {bars.map(({ code, val, color, price }) => (
          <div key={code}>
            <div className="flex justify-between text-[9px] mb-1">
              <span style={{ color }}>{code}</span>
              <span style={{ color }}>
                {val} SCU {price ? `≈ ${fmt(val * price)} aUEC` : ''}
              </span>
            </div>
            <div className="h-2 rounded-sm overflow-hidden" style={{ background: '#1A1410' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${total > 0 ? (val / total) * 100 : 0}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full"
                style={{ background: color }}
              />
            </div>
          </div>
        ))}
        <div className="pt-2 border-t flex justify-between" style={{ borderColor: '#2A2118' }}>
          <span className="text-[9px]" style={{ color: DIM }}>TOTAL YIELD</span>
          <span className="text-[13px] font-bold" style={{ color: AMBER }}>{total} SCU</span>
        </div>
        {estValue > 0 && (
          <div className="flex justify-between">
            <span className="text-[9px]" style={{ color: DIM }}>EST. VALUE</span>
            <span className="text-[11px] font-bold" style={{ color: TEAL }}>{fmt(estValue)} aUEC</span>
          </div>
        )}
      </div>

      {/* Hold analysis */}
      <div className="border p-3 space-y-3" style={PANEL}>
        <div className="text-[8px] tracking-[0.18em]" style={{ color: DIM }}>HOLD CAPACITY PLANNING</div>
        <div>
          <div className="text-[8px] mb-1" style={{ color: DIM }}>YOUR HOLD</div>
          <select
            value={holdScu}
            onChange={e => setHoldScu(Number(e.target.value))}
            className="w-full bg-transparent border px-2 py-1.5 text-[10px] outline-none"
            style={{ borderColor: '#2A2118', color: AMBER }}
          >
            {HOLD_SIZES.map(h => <option key={h.scu} value={h.scu} style={{ background: '#0E0C09' }}>{h.label}</option>)}
          </select>
        </div>
        <div>
          <div className="text-[8px] mb-1 flex justify-between" style={{ color: DIM }}>
            <span>HOLD FILL</span>
            <span style={{ color: holdPct >= 100 ? '#C05050' : holdPct > 75 ? AMBER : TEAL }}>{holdPct}%</span>
          </div>
          <div className="h-3 rounded-sm overflow-hidden" style={{ background: '#1A1410' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, holdPct)}%` }}
              transition={{ duration: 0.6 }}
              className="h-full"
              style={{ background: holdPct >= 100 ? '#C05050' : holdPct > 75 ? AMBER : TEAL }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: '#2A2118' }}>
          <span className="text-[9px]" style={{ color: DIM }}>HAUL RUNS REQUIRED</span>
          <span className="text-[18px] font-bold" style={{ color: runs > 1 ? '#C05050' : TEAL }}>{runs}×</span>
        </div>
        {runs > 1 && (
          <div className="text-[8px] px-2 py-1.5 border" style={{ borderColor: '#C0505040', color: '#C05050', background: '#C0505010' }}>
            ⚠ MULTI-RUN — plan for an intermediate offload or upsize your haul ship
          </div>
        )}
      </div>
    </div>
  );
}