import React from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Radio } from 'lucide-react';
import { FSIS, FLEET_REGISTRY } from '@/lib/fsisLore';

const LORE_LINES = [
  `${FLEET_REGISTRY[0].name} (${FLEET_REGISTRY[0].hull}) on station — Aaron Halo AO`,
  `Salvage license ${FSIS.license} verified nominal`,
  'Reclaimer claw recertified — hull scraping ops green',
  `Org rate active for ${FSIS.org} members`,
  'OD3ICA relay link stable — all FSIS nets readable',
];

/** Anonymized live ops feed strip — real market telemetry mixed with fleet status */
export default function OpsFeed() {
  const { data: prices = [] } = useQuery({
    queryKey: ['ticker_prices'],
    queryFn: () => base44.entities.commodity_price.filter({ is_best_sell: true }),
    refetchInterval: 5 * 60 * 1000,
    refetchIntervalInBackground: true,
  });

  const best = {};
  prices.forEach((p) => {
    if (!best[p.commodity_code] || (p.price_sell || 0) > (best[p.commodity_code].price_sell || 0)) best[p.commodity_code] = p;
  });

  const events = [
    ...Object.values(best).map((p) => `${p.commodity_code} clearing ${(p.price_sell || 0).toLocaleString()} aUEC @ ${p.terminal_name}`),
    ...LORE_LINES,
  ];
  if (events.length === 0) return null;

  const Row = () => (
    <div className="flex items-center gap-6 shrink-0 pr-6">
      {events.map((e, i) => (
        <span key={i} className="flex items-center gap-2 font-mono text-[9px] tracking-[0.08em] whitespace-nowrap" style={{ color: '#9C9080' }}>
          <span className="w-1 h-1 rounded-full shrink-0" style={{ background: '#B0793A' }} />
          {e}
        </span>
      ))}
    </div>
  );

  return (
    <div className="border-t overflow-hidden flex items-center" style={{ borderColor: '#2A2118', background: '#0A0908' }}>
      <span className="flex items-center gap-1.5 px-3 py-1 font-mono text-[8px] tracking-[0.25em] shrink-0 border-r" style={{ color: '#B0793A', borderColor: '#2A2118' }}>
        <Radio className="w-3 h-3" /> OPS FEED
      </span>
      <div className="flex-1 overflow-hidden">
        <motion.div
          className="flex w-max"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
        >
          <Row />
          <Row />
        </motion.div>
      </div>
    </div>
  );
}