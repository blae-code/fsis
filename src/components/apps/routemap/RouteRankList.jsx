import React from 'react';
import { MapPin, Zap } from 'lucide-react';

export default function RouteRankList({ routes }) {
  return (
    <div className="space-y-1.5">
      {routes.map((r, i) => (
        <div
          key={r.id || i}
          className="flex items-center gap-3 rounded border px-3 py-2"
          style={{
            borderColor: i === 0 ? 'hsl(38, 72%, 52%, 0.5)' : 'hsl(33, 18%, 18%)',
            background: i === 0 ? 'hsl(38, 72%, 52%, 0.05)' : 'hsl(30, 10%, 8%)',
          }}
        >
          <span className="text-[10px] font-bold w-6 text-center shrink-0" style={{ color: i === 0 ? 'hsl(42, 85%, 60%)' : 'hsl(35, 12%, 52%)' }}>
            {i === 0 ? <Zap className="w-3 h-3 mx-auto" /> : `#${i + 1}`}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-foreground truncate flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5 text-primary shrink-0" />
              {r.destination_terminal}
              {r.destination_system && <span className="text-muted-foreground">({r.destination_system})</span>}
            </div>
            <div className="text-[9px] text-muted-foreground">
              {r.commodity_code} {r.price_destination_sell ? `• sells @ ${Number(r.price_destination_sell).toLocaleString()}/unit` : ''}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] font-bold text-primary">
              {r.distance ? `${Number(r.distance).toLocaleString()} u` : '— dist'}
            </div>
            {r.profit_per_scu != null && (
              <div className="text-[9px]" style={{ color: 'hsl(140, 50%, 50%)' }}>
                +{Number(r.profit_per_scu).toLocaleString()}/SCU
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}