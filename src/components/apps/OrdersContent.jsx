import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, MapPin } from 'lucide-react';
import OrderPriceAdjust from '@/components/apps/orders/OrderPriceAdjust';

const STATUSES = ['new', 'confirmed', 'in_fulfillment', 'delivered', 'cancelled'];

const STATUS_COLORS = {
  new: 'hsl(205, 45%, 55%)',
  confirmed: 'hsl(28, 70%, 48%)',
  in_fulfillment: 'hsl(40, 70%, 50%)',
  delivered: 'hsl(140, 50%, 45%)',
  cancelled: 'hsl(0, 60%, 50%)',
};

export default function OrdersContent() {
  const queryClient = useQueryClient();

  const { data: orders = [] } = useQuery({
    queryKey: ['all_orders'],
    queryFn: () => base44.entities.order.list('-created_date', 100),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.order.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['all_orders'] }),
  });

  const open = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status));
  const revenue = orders.filter((o) => o.status === 'delivered').reduce((s, o) => s + (o.total_auec || 0), 0);

  return (
    <div className="h-full flex flex-col industrial-interior font-mono" style={{ background: 'hsl(28, 8%, 9%)' }}>
      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-px border-b" style={{ borderColor: 'hsl(33, 18%, 17%)' }}>
        {[
          { label: 'OPEN ORDERS', value: open.length },
          { label: 'TOTAL ORDERS', value: orders.length },
          { label: 'DELIVERED REVENUE', value: `${revenue.toLocaleString()} aUEC` },
        ].map((kpi) => (
          <div key={kpi.label} className="p-3 text-center" style={{ background: 'hsl(30, 12%, 7%)' }}>
            <div className="text-[9px] text-muted-foreground tracking-[0.2em]">{kpi.label}</div>
            <div className="text-sm font-bold text-primary">{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-2">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <ClipboardList className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">No orders yet — they'll appear here when customers transmit them.</p>
          </div>
        ) : (
          orders.map((o) => (
            <div key={o.id} className="rounded border p-3 space-y-2" style={{ borderColor: 'hsl(33, 18%, 17%)', background: 'hsl(30, 12%, 8%)' }}>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">{o.customer_handle}</span>
                  <Badge variant="outline" className="text-[9px] h-4" style={{ borderColor: STATUS_COLORS[o.status], color: STATUS_COLORS[o.status] }}>
                    {(o.status || 'new').replace('_', ' ').toUpperCase()}
                  </Badge>
                  <span className="text-[9px] text-muted-foreground">{new Date(o.created_date).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <OrderPriceAdjust order={o} />
                  <Select value={o.status} onValueChange={(status) => updateMutation.mutate({ id: o.id, status })}>
                    <SelectTrigger className="h-7 w-36 text-[10px]" style={{ borderColor: 'hsl(33, 18%, 17%)' }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="text-xs">{s.replace('_', ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="text-[10px] text-foreground/80">
                {(o.items || []).map((i) => `${i.quantity} ${i.unit || ''} ${i.code || i.product_name} @ ${i.unit_price?.toLocaleString()}`).join(' • ')}
              </div>

              <div className="flex items-center gap-3 text-[9px] text-muted-foreground flex-wrap">
                {o.delivery_location && (
                  <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" /> {o.delivery_location}</span>
                )}
                {o.customer_notes && <span>"{o.customer_notes}"</span>}
                <span>contact: {o.created_by}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}