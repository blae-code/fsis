import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Boxes, AlertCircle } from 'lucide-react';
import CommodityIcon from '@/components/brand/CommodityIcon';

const CODES = ['RMC', 'CMR', 'CMS'];
const FIELD = { RMC: 'rmc_scu', CMR: 'cmr_scu', CMS: 'cms_scu' };
const NAMES = { RMC: 'Recycled Material Composite', CMR: 'Construction Mat. (Reclaimed)', CMS: 'Construction Mat. (Salvaged)' };
const ACTIVE_STATUSES = ['planning', 'in-progress', 'hauling'];

const panel = { borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 8%)' };

export default function InventoryView({ bestPrices }) {
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['salvage_sessions_inventory'],
    queryFn: () => base44.entities.salvage_session.list('-updated_date', 200),
  });

  const active = sessions.filter((s) => ACTIVE_STATUSES.includes(s.status));

  const totals = CODES.reduce((acc, code) => {
    acc[code] = active.reduce((sum, s) => sum + (s[FIELD[code]] || 0), 0);
    return acc;
  }, {});

  // 1 SCU = 100 units for commodity pricing
  const valueOf = (code, scu) => Math.round(scu * 100 * (bestPrices?.[code]?.price_sell || 0));
  const totalValue = CODES.reduce((sum, code) => sum + valueOf(code, totals[code]), 0);

  if (isLoading) {
    return <div className="text-center py-12 text-xs font-mono text-muted-foreground">Loading inventory…</div>;
  }

  return (
    <div className="p-4 space-y-4 font-mono">
      {/* Stock totals */}
      <div className="grid grid-cols-3 gap-3">
        {CODES.map((code) => {
          const scu = totals[code];
          const value = valueOf(code, scu);
          return (
            <div key={code} className="p-3 rounded border text-center space-y-1.5" style={panel}>
              <div className="flex justify-center"><CommodityIcon code={code} size={30} /></div>
              <div className="text-[9px] text-muted-foreground tracking-[0.15em]">{code}</div>
              <div className="text-xl font-bold text-primary xian-glow-subtle">{scu.toLocaleString()}</div>
              <div className="text-[9px] text-muted-foreground">SCU IN STOCK</div>
              {value > 0 && (
                <div className="text-[10px] text-foreground/80 pt-1 border-t" style={{ borderColor: 'hsl(33, 18%, 18%)' }}>
                  ~{value.toLocaleString()} aUEC
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Total estimated value */}
      <div className="p-3 rounded border flex items-center justify-between" style={panel}>
        <span className="flex items-center gap-2 text-[10px] text-muted-foreground tracking-[0.2em]">
          <Boxes className="w-3.5 h-3.5 text-primary" /> TOTAL STOCK VALUE (@ BEST SELL)
        </span>
        <span className="text-sm font-bold text-primary">
          {totalValue > 0 ? `${totalValue.toLocaleString()} aUEC` : 'No price data synced'}
        </span>
      </div>

      {/* Per-session breakdown */}
      <div className="space-y-1.5">
        <div className="text-[10px] text-muted-foreground tracking-[0.2em]">HOLDINGS BY SESSION ({active.length} ACTIVE)</div>
        {active.length === 0 ? (
          <div className="text-center py-8 rounded border" style={panel}>
            <AlertCircle className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
            <p className="text-[10px] text-muted-foreground">No active salvage sessions holding stock.</p>
            <p className="text-[9px] text-muted-foreground mt-1">Stock counts sessions in planning, in-progress, or hauling status.</p>
          </div>
        ) : active.map((s) => (
          <div key={s.id} className="p-2.5 rounded border flex items-center gap-3" style={panel}>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-foreground truncate">{s.session_name}</div>
              <div className="text-[9px] text-muted-foreground">{s.ship || 'Unknown ship'} • {s.status.toUpperCase()}{s.location ? ` • ${s.location}` : ''}</div>
            </div>
            <div className="flex gap-3 shrink-0 text-right">
              {CODES.map((code) => (
                <div key={code}>
                  <div className="text-[8px] text-muted-foreground">{code}</div>
                  <div className={`text-[11px] font-bold ${(s[FIELD[code]] || 0) > 0 ? 'text-primary' : 'text-muted-foreground/50'}`}>
                    {(s[FIELD[code]] || 0).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-[9px] text-muted-foreground/60">
        Inventory aggregates {NAMES.RMC}, {NAMES.CMR}, and {NAMES.CMS} across active salvage sessions. Values use best sell prices from the UEX cache (1 SCU = 100 units).
      </p>
    </div>
  );
}