import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Briefcase } from 'lucide-react';

/** Station view for management — top-line ops summary across all divisions */
export default function ManagementView() {
  const { data: sessions = [] } = useQuery({
    queryKey: ['station_sessions'],
    queryFn: () => base44.entities.salvage_session.list('-created_date', 100),
  });
  const { data: orders = [] } = useQuery({
    queryKey: ['station_orders'],
    queryFn: () => base44.entities.order.list('-created_date', 100),
  });
  const { data: lots = [] } = useQuery({
    queryKey: ['station_cargo_lots'],
    queryFn: () => base44.entities.cargo_lot.list('-created_date', 100),
  });
  const { data: workOrders = [] } = useQuery({
    queryKey: ['station_work_orders'],
    queryFn: () => base44.entities.work_order.filter({ status: 'open' }),
  });

  const activeSessions = sessions.filter((s) => ['planning', 'in-progress', 'hauling'].includes(s.status)).length;
  const openOrders = orders.filter((o) => ['new', 'confirmed', 'in_fulfillment'].includes(o.status)).length;
  const lotsInMotion = lots.filter((l) => l.status !== 'sold').length;

  const tiles = [
    { label: 'ACTIVE SALVAGE RUNS', value: activeSessions, color: 'hsl(42, 85%, 60%)' },
    { label: 'OPEN CUSTOMER ORDERS', value: openOrders, color: 'hsl(205, 45%, 55%)' },
    { label: 'CARGO LOTS IN MOTION', value: lotsInMotion, color: 'hsl(20, 60%, 50%)' },
    { label: 'UNSETTLED WORK ORDERS', value: workOrders.length, color: 'hsl(42, 60%, 50%)' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map((t) => (
          <div key={t.label} className="rounded border p-3" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 8%)' }}>
            <div className="text-[9px] text-muted-foreground tracking-[0.15em]">{t.label}</div>
            <div className="text-2xl font-bold mt-1" style={{ color: t.color }}>{t.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded border p-3 text-[10px] text-muted-foreground flex items-center gap-2" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 8%)' }}>
        <Briefcase className="w-3.5 h-3.5 shrink-0" style={{ color: 'hsl(42, 60%, 50%)' }} />
        Full detail lives in the dedicated apps: Salvage (runs & market), Orders (fulfillment), FairShare (payroll), Ledger (finances), Performance (analytics).
      </div>
    </div>
  );
}