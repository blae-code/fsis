import React from 'react';
import { base44 } from '@/api/base44Client';
import { updateOrderStatus } from '@/functions/updateOrderStatus';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ClipboardList, MapPin } from 'lucide-react';
import OrderPriceAdjust from '@/components/apps/orders/OrderPriceAdjust';
import HandoffCoordinator from '@/components/apps/orders/HandoffCoordinator';
import { C, panel } from '@/components/console/theme';

const STATUSES = ['new', 'confirmed', 'in_fulfillment', 'delivered', 'cancelled'];

const STATUS_COLORS = {
  new: '#6FA0C8',
  confirmed: '#C8893B',
  in_fulfillment: '#E0A22E',
  delivered: '#7BA05B',
  cancelled: '#C05050',
};

export default function OrdersContent() {
  const queryClient = useQueryClient();

  const { data: orders = [] } = useQuery({
    queryKey: ['all_orders'],
    queryFn: () => base44.entities.order.list('-created_date', 100),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => updateOrderStatus({ order_id: id, status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all_orders'] }),
  });

  const open = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status));
  const revenue = orders.filter((o) => o.status === 'delivered').reduce((s, o) => s + (o.total_auec || 0), 0);

  return (
    <div className="h-full flex flex-col font-mono">
      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-px border-b" style={{ borderColor: '#2A2118', background: '#2A2118' }}>
        {[
          { label: 'OPEN ORDERS', value: open.length },
          { label: 'TOTAL ORDERS', value: orders.length },
          { label: 'DELIVERED REVENUE', value: `${revenue.toLocaleString()} aUEC` },
        ].map((kpi) => (
          <div key={kpi.label} className="p-3 text-center" style={{ background: '#0C0A07' }}>
            <div className="text-[8px] tracking-[0.22em]" style={{ color: C.faint }}>{kpi.label}</div>
            <div className="text-sm font-bold" style={{ color: C.amber }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-2">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList className="w-6 h-6 mx-auto mb-2" style={{ color: C.dimmer }} />
            <p className="text-xs" style={{ color: C.dim }}>No orders yet — they'll appear here when customers transmit them.</p>
          </div>
        ) : (
          orders.map((o) => {
            const sc = STATUS_COLORS[o.status] || C.dim;
            return (
              <div key={o.id} className="border p-3 space-y-2" style={{ ...panel, borderLeft: `2px solid ${sc}66` }}>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold" style={{ color: C.parchment }}>{o.guest_number || o.customer_handle}</span>
                    <span className="text-[8px] font-bold tracking-[0.12em] px-2 py-0.5 border" style={{ borderColor: `${sc}55`, color: sc, background: `${sc}10` }}>
                      {(o.status || 'new').replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="text-[9px]" style={{ color: C.dim }}>{new Date(o.created_date).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <OrderPriceAdjust order={o} />
                    <Select value={o.status} onValueChange={(status) => updateMutation.mutate({ id: o.id, status })}>
                      <SelectTrigger className="h-7 w-36 text-[10px] font-mono" style={{ borderColor: '#3A2F20', background: '#0A0806', color: C.bone }}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s} value={s} className="text-xs font-mono">{s.replace('_', ' ')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="text-[10px]" style={{ color: C.parchment }}>
                  {(o.items || []).map((i) => `${i.quantity} ${i.unit || ''} ${i.code || i.product_name} @ ${i.unit_price?.toLocaleString()}`).join(' • ')}
                </div>

                <div className="flex items-center gap-3 text-[9px] flex-wrap" style={{ color: C.dim }}>
                  {o.delivery_location && (
                    <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" /> {o.delivery_location}</span>
                  )}
                  {o.customer_notes && <span>"{o.customer_notes}"</span>}
                  <span className="ml-auto" style={{ color: C.amber }}>{(o.total_auec || 0).toLocaleString()} ¤</span>
                </div>

                {/* Handoff coordination */}
                {!['delivered', 'cancelled'].includes(o.status) && (
                  <div className="pt-1 border-t" style={{ borderColor: '#1E1810' }}>
                    <HandoffCoordinator order={o} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}