import React from 'react';
import { base44 } from '@/api/base44Client';
import { updateOrderStatus } from '@/functions/updateOrderStatus';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import FulfillmentQueue from '@/components/apps/management/proprietor/FulfillmentQueue';

export default function AdminFulfillmentQueue() {
  const qc = useQueryClient();
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['storefront_fulfillment_orders'],
    queryFn: async () => {
      const fresh = await base44.entities.order.list('-created_date', 50);
      // List reads can lag behind status updates — never let a stale refetch
      // revert an order we already hold a newer version of in the cache.
      const prev = qc.getQueryData(['storefront_fulfillment_orders']) || [];
      const prevMap = new Map(prev.map((o) => [o.id, o]));
      return fresh.map((o) => {
        const p = prevMap.get(o.id);
        return p && new Date(p.updated_date) > new Date(o.updated_date) ? p : o;
      });
    },
    refetchInterval: 30000,
  });
  const statusMutation = useMutation({
    mutationFn: ({ orderId, status, trackingCode }) => updateOrderStatus({ order_id: orderId, status, tracking_code: trackingCode }),
    onSuccess: (res) => {
      // Apply the server-returned order directly so the queue reflects the new
      // state immediately, even if a list refetch would return stale data.
      const updated = res?.data?.order;
      if (updated?.id) {
        qc.setQueryData(['storefront_fulfillment_orders'], (old = []) => old.map((o) => (o.id === updated.id ? updated : o)));
      } else {
        qc.invalidateQueries({ queryKey: ['storefront_fulfillment_orders'] });
      }
      qc.invalidateQueries({ queryKey: ['tracked_orders'] });
      qc.invalidateQueries({ queryKey: ['my_account_orders'] });
    },
    onError: () => qc.invalidateQueries({ queryKey: ['storefront_fulfillment_orders'] }),
  });
  if (isLoading) {
    return <div className="border p-4 flex justify-center" style={{ borderColor: '#2A2118', background: '#100E0B' }}><Loader2 className="w-4 h-4 animate-spin" style={{ color: '#E0A22E' }} /></div>;
  }
  const done = statusMutation.data?.data?.order;
  const lastSuccess = done ? `ORDER ${done.tracking_code || done.id} → ${(done.status || '').replace('_', ' ').toUpperCase()}${done.status === 'delivered' ? ' — INVOICE MARKED PAID' : ''}` : null;
  return <FulfillmentQueue orders={orders} pending={statusMutation.isPending} error={statusMutation.error} lastSuccess={lastSuccess} onStatus={(orderId, status, trackingCode) => statusMutation.mutate({ orderId, status, trackingCode })} />;
}