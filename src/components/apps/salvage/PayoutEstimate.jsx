import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Calculator, Check } from 'lucide-react';

// Auto-calculates expected payout from cached UEX commodity prices:
// best sell price for the selected commodity × cargo volume (SCU).
export default function PayoutEstimate({ commodityCode, quantityScu, onApply }) {
  const { data: prices = [] } = useQuery({
    queryKey: ['commodity_prices_all'],
    queryFn: () => base44.entities.commodity_price.list('-price_sell', 500),
    staleTime: 5 * 60 * 1000,
  });

  const best = useMemo(() => {
    const matches = prices.filter(
      (p) => p.commodity_code === (commodityCode || '').toUpperCase() && p.price_sell > 0
    );
    if (matches.length === 0) return null;
    return matches.reduce((a, b) => (b.price_sell > a.price_sell ? b : a));
  }, [prices, commodityCode]);

  const scu = parseFloat(quantityScu) || 0;
  if (!best || scu <= 0) return null;

  const estimate = Math.round(best.price_sell * scu);

  return (
    <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
      <Calculator className="w-3 h-3 text-muted-foreground" />
      <span className="text-muted-foreground">
        {scu.toLocaleString()} SCU × {best.price_sell.toLocaleString()} aUEC
        {best.terminal_name && <span> @ {best.terminal_name}</span>}
      </span>
      <span className="text-primary font-semibold">= {estimate.toLocaleString()} aUEC</span>
      <button
        onClick={() => onApply(estimate)}
        className="inline-flex items-center gap-1 px-2 py-0.5 border hover:bg-secondary/50 transition-colors"
        style={{ borderColor: 'hsl(38, 72%, 52%, 0.4)', color: 'hsl(38, 72%, 52%)' }}
      >
        <Check className="w-2.5 h-2.5" /> APPLY
      </button>
    </div>
  );
}