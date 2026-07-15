import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch } from 'lucide-react';
import { roundPrice } from '@/lib/pricing';

const DRIFT_THRESHOLD = 5; // % deviation from live market ref before a reprice is flagged

/** Status-bar "Version Updates" panel — flags exactly which salvage
 *  commodities need price or volume adjustments ahead of Alpha 4.9
 *  (salvage price rebalance + cargo/stock reset). */
export default function VersionUpdatesIndicator() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const { data: products = [] } = useQuery({
    queryKey: ['v49_salvage_products'],
    queryFn: () => base44.entities.product.filter({ category: 'salvage_commodity' }),
  });
  const { data: marketPrices = [] } = useQuery({
    queryKey: ['ticker_prices'],
    queryFn: () => base44.entities.commodity_price.filter({ is_best_sell: true }),
  });

  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Best live sell per commodity code
  const bestByCode = {};
  marketPrices.forEach((p) => {
    if (p.commodity_code && (p.price_sell || 0) > (bestByCode[p.commodity_code] || 0)) {
      bestByCode[p.commodity_code] = p.price_sell;
    }
  });

  const rows = products
    .filter((p) => p.code)
    .map((p) => {
      const liveRef = bestByCode[(p.code || '').toUpperCase()];
      const anchored = p.market_ref_auec || 0;
      const drift = liveRef && anchored ? ((liveRef - anchored) / anchored) * 100 : null;
      const needsPrice = liveRef ? (!anchored || Math.abs(drift) >= DRIFT_THRESHOLD) : false;
      const needsVolume = (p.stock || 0) > 0; // 4.9 cargo reset wipes stored salvage stock
      return { ...p, liveRef, drift, needsPrice, needsVolume };
    });

  const actionCount = rows.filter((r) => r.needsPrice || r.needsVolume).length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Alpha 4.9 version updates"
        className="flex items-center gap-1.5 px-1.5 py-0.5 rounded font-mono text-[9px] font-bold tracking-[0.12em] transition-colors hover:bg-muted"
        style={{ color: actionCount ? '#E0A22E' : '#8A8F45', border: `1px solid ${actionCount ? '#5C4424' : '#2A2118'}` }}
      >
        <GitBranch className="w-3 h-3" />
        4.9
        {actionCount > 0 && (
          <span className="px-1 rounded-sm text-[8px]" style={{ background: '#5C4424', color: '#F0B43A' }}>{actionCount}</span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-8 w-80 border font-mono z-[300] p-3 space-y-2"
            style={{ borderColor: '#5C4424', background: '#0C0A07', boxShadow: '0 18px 40px rgba(0,0,0,0.6)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] tracking-[0.22em] font-bold" style={{ color: '#C8893B' }}>VERSION UPDATES — ALPHA 4.9</span>
              <span className="text-[8px]" style={{ color: '#7A6E60' }}>THIS WEEK</span>
            </div>
            <p className="text-[8px] leading-relaxed" style={{ color: '#8A7E6C' }}>
              Salvage price rebalance + stored cargo reset at go-live. Adjustments needed:
            </p>

            {rows.length === 0 ? (
              <p className="text-[9px] py-2" style={{ color: '#7A6E60' }}>No salvage commodity listings found.</p>
            ) : rows.map((r) => (
              <div key={r.id} className="border px-2 py-1.5 space-y-1" style={{ borderColor: r.needsPrice || r.needsVolume ? '#5C4424' : '#2A2118', background: '#0E0C09' }}>
                <div className="flex items-center gap-2">
                  <span className="text-[8px] px-1 border shrink-0" style={{ borderColor: '#3A2F20', color: '#E0A22E' }}>{r.code}</span>
                  <span className="flex-1 text-[9px] font-bold truncate" style={{ color: '#D8CFC0' }}>{r.product_name}</span>
                  {!r.needsPrice && !r.needsVolume && <span className="text-[8px]" style={{ color: '#8A8F45' }}>✓ READY</span>}
                </div>
                {r.needsPrice && (
                  <p className="text-[8px]" style={{ color: '#F0B43A' }}>
                    ▲ PRICE — anchored {roundPrice(r.market_ref_auec).toLocaleString()} vs live {roundPrice(r.liveRef).toLocaleString()} aUEC
                    {r.drift !== null && ` (${r.drift > 0 ? '+' : ''}${r.drift.toFixed(1)}%)`} → re-anchor
                  </p>
                )}
                {!r.needsPrice && r.liveRef && (
                  <p className="text-[8px]" style={{ color: '#6B6155' }}>price within {DRIFT_THRESHOLD}% of live ref</p>
                )}
                {!r.liveRef && (
                  <p className="text-[8px]" style={{ color: '#C05050' }}>▲ PRICE — no live UEX ref cached → resync market data</p>
                )}
                {r.needsVolume && (
                  <p className="text-[8px]" style={{ color: '#D08A6A' }}>
                    ▲ VOLUME — {(r.stock || 0).toLocaleString()} {r.unit || 'SCU'} listed; stored cargo resets at 4.9 → sell down or audit to 0
                  </p>
                )}
              </div>
            ))}

            <p className="text-[8px] leading-relaxed pt-1 border-t" style={{ color: '#5A4A34', borderColor: '#2A2118' }}>
              Run the transition actions in the Management Console (pause → resync → re-anchor → audit).
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}