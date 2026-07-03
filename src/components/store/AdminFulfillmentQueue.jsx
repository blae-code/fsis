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
    queryFn: () => base44.entities.order.list('-created_date', 50),
    refetchInterval: 30000,
  });
  const statusMutation = useMutation({
    mutationFn: ({ orderId, status, trackingCode }) => updateOrderStatus({ order_id: orderId, status, tracking_code: trackingCode }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['storefront_fulfillment_orders'] });
      qc.invalidateQueries({ queryKey: ['tracked_orders'] });
      qc.invalidateQueries({ queryKey: ['my_account_orders'] });
    },
    onError: () => qc.invalidateQueries({ queryKey: ['storefront_fulfillment_orders'] }),
  });
  if (isLoading) {
    return <div className="border p-4 flex justify-center" style={{ borderColor: '#2A2118', background: '#100E0B' }}><Loader2 className="w-4 h-4 animate-spin" style={{ color: '#E0A22E' }} /></div>;
  }
  return <FulfillmentQueue orders={orders} pending={statusMutation.isPending} error={statusMutation.error} onStatus={(orderId, status, trackingCode) => statusMutation.mutate({ orderId, status, trackingCode })} />;
}