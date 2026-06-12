import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { PackageCheck } from 'lucide-react';

const STATUS_STYLES = {
  new: 'border-primary/40 text-primary',
  confirmed: 'border-chart-2 text-accent-foreground',
  in_fulfillment: 'border-yellow-600/50 text-yellow-500',
  delivered: 'border-green-600/50 text-green-500',
  cancelled: 'border-destructive/50 text-destructive',
};

export default function MyOrders() {
  const { data: orders = [] } = useQuery({
    queryKey: ['my_orders'],
    queryFn: () => base44.entities.order.list('-created_date', 20),
  });

  if (orders.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 font-mono text-xs tracking-[0.2em]" style={{ color: '#C8A05B' }}>
        <PackageCheck className="w-3.5 h-3.5" /> YOUR ORDERS
      </div>
      {orders.map((o) => (
        <div key={o.id} className="border p-3 flex items-center justify-between gap-3" style={{ borderColor: '#2A2118', background: '#121110' }}>
          <div className="min-w-0">
            <div className="text-xs font-mono truncate" style={{ color: '#D8CFC0' }}>
              {(o.items || []).map((i) => `${i.quantity}x ${i.code || i.product_name}`).join(', ')}
            </div>
            <div className="text-[10px] font-mono text-muted-foreground">
              {new Date(o.created_date).toLocaleDateString()} {o.delivery_location && `• ${o.delivery_location}`}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs font-mono font-bold" style={{ color: '#E0A22E' }}>{(o.total_auec || 0).toLocaleString()} aUEC</div>
            <Badge variant="outline" className={`text-[9px] font-mono h-4 ${STATUS_STYLES[o.status] || ''}`}>
              {(o.status || 'new').replace('_', ' ').toUpperCase()}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  );
}