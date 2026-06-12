import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp } from 'lucide-react';

// Live best-sell market strip sourced from the UEX cache
export default function MarketTicker() {
  const { data: prices = [] } = useQuery({
    queryKey: ['ticker_prices'],
    queryFn: () => base44.entities.commodity_price.filter({ is_best_sell: true }),
    staleTime: 5 * 60 * 1000,
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

  return (
    <div className="border-b overflow-x-auto" style={{ borderColor: '#2A2118', background: '#0F0D0B' }}>
      <div className="max-w-6xl mx-auto px-4 py-1.5 flex items-center gap-5 whitespace-nowrap font-mono">
        <span className="flex items-center gap-1.5 text-[9px] tracking-[0.2em] shrink-0" style={{ color: '#B0793A' }}>
          <TrendingUp className="w-3 h-3" /> LIVE MARKET
        </span>
        {entries.map((p) => (
          <span key={p.commodity_code} className="text-[10px] shrink-0">
            <span style={{ color: '#D8CFC0' }} className="font-bold">{p.commodity_code}</span>
            <span style={{ color: '#E0A22E' }} className="ml-1.5 font-bold">{(p.price_sell || 0).toLocaleString()}</span>
            <span style={{ color: '#8A7E6C' }} className="ml-1">aUEC</span>
            <span style={{ color: '#6B6155' }} className="ml-1.5">@ {p.terminal_name}</span>
          </span>
        ))}
      </div>
    </div>
  );
}