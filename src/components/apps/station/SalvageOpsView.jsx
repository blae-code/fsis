import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Wrench, TrendingUp } from 'lucide-react';

const ACTIVE_STATUSES = ['planning', 'in-progress', 'hauling'];
const COMMODITIES = ['RMC', 'CMR', 'CMS'];

/** Station view for salvage operators — active runs, uncommitted stock, where to sell */
export default function SalvageOpsView() {
  const { data: sessions = [] } = useQuery({
    queryKey: ['station_sessions'],
    queryFn: () => base44.entities.salvage_session.list('-created_date', 100),
  });
  const { data: prices = [] } = useQuery({
    queryKey: ['commodity_prices'],
    queryFn: () => base44.entities.commodity_price.list(),
  });

  const active = sessions.filter((s) => ACTIVE_STATUSES.includes(s.status));
  const stock = { RMC: 0, CMR: 0, CMS: 0 };
  active.forEach((s) => {
    stock.RMC += s.rmc_scu || 0;
    stock.CMR += s.cmr_scu || 0;
    stock.CMS += s.cms_scu || 0;
  });

  const best = {};
  prices.forEach((p) => {
    if (p.price_sell && (!best[p.commodity_code] || p.price_sell > best[p.commodity_code].price_sell)) {
      best[p.commodity_code] = p;
    }
  });

  return (
    <div className="space-y-4">
      {/* Stock on hand */}
      <div className="grid grid-cols-3 gap-3">
        {COMMODITIES.map((code) => (
          <div key={code} className="rounded border p-3" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 8%)' }}>
            <div className="text-[9px] text-muted-foreground tracking-[0.15em]">{code} UNCOMMITTED</div>
            <div className="text-lg font-bold text-primary mt-1">{stock[code].toLocaleString()} SCU</div>
            {best[code] && (
              <div className="text-[9px] text-muted-foreground mt-0.5">
                Best sell: {best[code].price_sell.toLocaleString()} @ {best[code].terminal_name}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Active runs */}
      <div className="rounded border" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 8%)' }}>
        <div className="flex items-center gap-1.5 px-3 py-2 border-b text-[9px] text-muted-foreground tracking-[0.2em]" style={{ borderColor: 'hsl(33, 18%, 18%)' }}>
          <Wrench className="w-3 h-3" /> ACTIVE SALVAGE RUNS ({active.length})
        </div>
        {active.length === 0 ? (
          <p className="text-xs text-muted-foreground p-4 text-center">No active runs — start a session in the Salvage app.</p>
        ) : (
          active.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-3 py-2 border-b last:border-b-0 text-[10px]" style={{ borderColor: 'hsl(33, 18%, 14%)' }}>
              <div>
                <div className="text-foreground">{s.session_name}</div>
                <div className="text-muted-foreground">{s.ship || '—'} • {s.location || '—'} • {s.status.toUpperCase()}</div>
              </div>
              <div className="text-right">
                <div className="text-primary font-bold">{((s.rmc_scu || 0) + (s.cmr_scu || 0) + (s.cms_scu || 0)).toLocaleString()} SCU</div>
                {s.estimated_value > 0 && <div className="text-muted-foreground">~{s.estimated_value.toLocaleString()} aUEC</div>}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Top sell terminals */}
      <div className="rounded border p-3" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 8%)' }}>
        <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground tracking-[0.2em] mb-2">
          <TrendingUp className="w-3 h-3" /> WHERE TO SELL — CURRENT BEST
        </div>
        {COMMODITIES.filter((c) => best[c]).map((c) => (
          <div key={c} className="flex justify-between text-[10px] py-1">
            <span className="text-foreground">{c} → {best[c].terminal_name}</span>
            <span className="text-primary font-bold">{best[c].price_sell.toLocaleString()} aUEC</span>
          </div>
        ))}
        {COMMODITIES.every((c) => !best[c]) && <p className="text-xs text-muted-foreground text-center py-2">No UEX price data synced yet.</p>}
      </div>
    </div>
  );
}