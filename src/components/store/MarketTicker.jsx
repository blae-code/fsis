import React from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp } from 'lucide-react';

// Live best-sell market strip sourced from the UEX cache
export default function MarketTicker() {
  const { data: prices = [] } = useQuery({
    queryKey: ['ticker_prices'],
    queryFn: () => base44.entities.commodity_price.filter({ is_best_sell: true }),
    refetchInterval: 5 * 60 * 1000,
    refetchIntervalInBackground: true,
  });

  if (prices.length === 0) return null;

  // One best entry per commodity code
  const best = {};
  prices.forEach((p) => {
    if (!best[p.commodity_code] || (p.price_sell || 0) > (best[p.commodity_code].price_sell || 0)) {
      best[p.commodity_code] = p;
    }
  });
  const entries = Object.values(best);

  // Duplicate the track so the marquee loops seamlessly
  const track = (keyPrefix) =>
    entries.map((p) => (
      <span key={`${keyPrefix}-${p.commodity_code}`} className="text-[10px] shrink-0 mx-2.5">
        <span style={{ color: '#D8CFC0' }} className="font-bold">{p.commodity_code}</span>
        <span style={{ color: '#E0A22E' }} className="ml-1.5 font-bold">{(p.price_sell || 0).toLocaleString()}</span>
        <span style={{ color: '#8A7E6C' }} className="ml-1">aUEC</span>
        <span style={{ color: '#6B6155' }} className="ml-1.5">@ {p.terminal_name}</span>
        <span className="ml-2.5" style={{ color: '#3A2F20' }}>◆</span>
      </span>
    ));

  return (
    <div className="border-b overflow-hidden flex items-center" style={{ borderColor: '#2A2118', background: '#0F0D0B' }}>
      <span
        className="flex items-center gap-1.5 text-[9px] tracking-[0.2em] shrink-0 px-4 py-1.5 font-mono z-10 border-r"
        style={{ color: '#B0793A', background: '#0F0D0B', borderColor: '#2A2118' }}
      >
        <TrendingUp className="w-3 h-3" /> LIVE MARKET
      </span>
      <div className="flex-1 overflow-hidden py-1.5">
        <motion.div
          className="flex whitespace-nowrap font-mono w-max"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: Math.max(20, entries.length * 9), repeat: Infinity, ease: 'linear' }}
        >
          {track('a')}
          {track('b')}
        </motion.div>
      </div>
    </div>
  );
}