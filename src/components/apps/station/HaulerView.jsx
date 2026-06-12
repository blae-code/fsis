import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Truck, Route, PackageCheck } from 'lucide-react';

/** Station view for cargo haulers — lots awaiting haul, deliveries due, saved routes */
export default function HaulerView() {
  const { data: lots = [] } = useQuery({
    queryKey: ['station_cargo_lots'],
    queryFn: () => base44.entities.cargo_lot.list('-created_date', 100),
  });
  const { data: orders = [] } = useQuery({
    queryKey: ['station_orders'],
    queryFn: () => base44.entities.order.list('-created_date', 100),
  });
  const { data: routes = [] } = useQuery({
    queryKey: ['station_routes'],
    queryFn: () => base44.entities.route_template.list('-created_date', 20),
  });

  const awaiting = lots.filter((l) => ['collected', 'processed'].includes(l.status));
  const awaitingScu = awaiting.reduce((s, l) => s + (l.quantity_scu || 0), 0);
  const deliveries = orders.filter((o) => ['confirmed', 'in_fulfillment'].includes(o.status));

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded border p-3" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 8%)' }}>
          <div className="text-[9px] text-muted-foreground tracking-[0.15em]">LOTS AWAITING HAUL</div>
          <div className="text-lg font-bold mt-1" style={{ color: 'hsl(210, 45%, 55%)' }}>{awaiting.length}</div>
        </div>
        <div className="rounded border p-3" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 8%)' }}>
          <div className="text-[9px] text-muted-foreground tracking-[0.15em]">CARGO TO MOVE</div>
          <div className="text-lg font-bold text-primary mt-1">{awaitingScu.toLocaleString()} SCU</div>
        </div>
        <div className="rounded border p-3" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 8%)' }}>
          <div className="text-[9px] text-muted-foreground tracking-[0.15em]">DELIVERIES DUE</div>
          <div className="text-lg font-bold mt-1" style={{ color: 'hsl(20, 60%, 50%)' }}>{deliveries.length}</div>
        </div>
      </div>

      {/* Lots to haul */}
      <div className="rounded border" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 8%)' }}>
        <div className="flex items-center gap-1.5 px-3 py-2 border-b text-[9px] text-muted-foreground tracking-[0.2em]" style={{ borderColor: 'hsl(33, 18%, 18%)' }}>
          <Truck className="w-3 h-3" /> CARGO LOTS AWAITING HAUL ({awaiting.length})
        </div>
        {awaiting.length === 0 ? (
          <p className="text-xs text-muted-foreground p-4 text-center">Nothing waiting — check the Salvage haul board for incoming lots.</p>
        ) : (
          awaiting.map((l) => (
            <div key={l.id} className="flex items-center justify-between px-3 py-2 border-b last:border-b-0 text-[10px]" style={{ borderColor: 'hsl(33, 18%, 14%)' }}>
              <div>
                <div className="text-foreground">{l.lot_name}</div>
                <div className="text-muted-foreground">{l.origin || '—'} → {l.destination || 'TBD'} • {l.status.toUpperCase()}</div>
              </div>
              <div className="text-right">
                <div className="text-primary font-bold">{(l.quantity_scu || 0).toLocaleString()} SCU {l.commodity_code || ''}</div>
                {l.est_value_auec > 0 && <div className="text-muted-foreground">~{l.est_value_auec.toLocaleString()} aUEC</div>}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Customer deliveries */}
      <div className="rounded border" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 8%)' }}>
        <div className="flex items-center gap-1.5 px-3 py-2 border-b text-[9px] text-muted-foreground tracking-[0.2em]" style={{ borderColor: 'hsl(33, 18%, 18%)' }}>
          <PackageCheck className="w-3 h-3" /> CUSTOMER DELIVERIES ({deliveries.length})
        </div>
        {deliveries.length === 0 ? (
          <p className="text-xs text-muted-foreground p-4 text-center">No confirmed orders awaiting delivery.</p>
        ) : (
          deliveries.map((o) => (
            <div key={o.id} className="flex items-center justify-between px-3 py-2 border-b last:border-b-0 text-[10px]" style={{ borderColor: 'hsl(33, 18%, 14%)' }}>
              <div>
                <div className="text-foreground">{o.tracking_code} — {o.customer_handle}</div>
                <div className="text-muted-foreground">{o.delivery_location || 'TBD'} • {o.status.replace('_', ' ').toUpperCase()}</div>
              </div>
              <div className="text-primary font-bold">{(o.total_auec || 0).toLocaleString()} aUEC</div>
            </div>
          ))
        )}
      </div>

      {/* Saved routes */}
      {routes.length > 0 && (
        <div className="rounded border p-3" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 8%)' }}>
          <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground tracking-[0.2em] mb-2">
            <Route className="w-3 h-3" /> SAVED ROUTES
          </div>
          {routes.map((r) => (
            <div key={r.id} className="flex justify-between text-[10px] py-1">
              <span className="text-foreground">{r.template_name} ({r.commodity_code || '—'})</span>
              <span className="text-muted-foreground">
                {r.origin || '—'} → {r.destination || '—'}
                {r.expected_payout_auec > 0 && <span className="text-primary ml-2">~{r.expected_payout_auec.toLocaleString()} aUEC</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}