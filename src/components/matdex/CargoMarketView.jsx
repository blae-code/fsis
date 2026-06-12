import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Boxes, TrendingUp, MapPin } from 'lucide-react';

const panel = { borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 8%)' };

// Matches the operator's current (unsold) cargo lots against cached UEX prices
// and shows the best-paying terminals for each commodity on hand.
export default function CargoMarketView() {
  const { data: lots = [] } = useQuery({
    queryKey: ['cargo_lots'],
    queryFn: () => base44.entities.cargo_lot.list('-created_date', 100),
  });

  const { data: prices = [] } = useQuery({
    queryKey: ['commodity_prices_all'],
    queryFn: () => base44.entities.commodity_price.list('-price_sell', 500),
    staleTime: 5 * 60 * 1000,
  });

  // Aggregate unsold cargo by commodity
  const holdings = {};
  for (const lot of lots) {
    if (lot.status === 'sold' || !lot.commodity_code) continue;
    holdings[lot.commodity_code] = (holdings[lot.commodity_code] || 0) + (lot.quantity_scu || 0);
  }
  const codes = Object.keys(holdings);

  if (codes.length === 0) {
    return (
      <div className="p-8 text-center">
        <Boxes className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
        <p className="text-[10px] text-muted-foreground font-mono">
          No active cargo on the haul board. Add lots in the Salvage app's BOARD tab.
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3 font-mono">
      {codes.map((code) => {
        const scu = holdings[code];
        const top = prices
          .filter((p) => p.commodity_code === code && p.price_sell > 0)
          .sort((a, b) => b.price_sell - a.price_sell)
          .slice(0, 4);
        return (
          <div key={code} className="p-3 rounded border space-y-2" style={panel}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Boxes className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-bold text-foreground">{code}</span>
                <span className="text-[10px] text-muted-foreground">{scu.toLocaleString()} SCU IN HOLD</span>
              </div>
              <TrendingUp className="w-3 h-3 text-primary" />
            </div>
            {top.length === 0 ? (
              <p className="text-[10px] text-muted-foreground">No cached price data for {code}.</p>
            ) : top.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between text-xs gap-2">
                <span className="flex items-center gap-1.5 min-w-0 text-foreground/90">
                  {i === 0 && <span className="text-[8px] px-1 rounded" style={{ background: 'hsl(38, 72%, 52% / 0.15)', color: 'hsl(38, 72%, 52%)' }}>BEST</span>}
                  <MapPin className="w-2.5 h-2.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{p.terminal_name}{p.star_system ? ` — ${p.star_system}` : ''}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="text-muted-foreground text-[10px]">{p.price_sell.toLocaleString()} × {scu.toLocaleString()} = </span>
                  <span className="text-primary font-bold">{Math.round(p.price_sell * scu).toLocaleString()} aUEC</span>
                </span>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}