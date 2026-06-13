import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, ChevronRight, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const STATUS_COLOR = { new: '#C8893B', confirmed: '#E0A22E', in_fulfillment: '#6FA0C8', delivered: '#7BA05B', cancelled: '#5A4E40' };
const STATUS_LABEL = { new: 'RECEIVED', confirmed: 'CONFIRMED', in_fulfillment: 'IN FLIGHT', delivered: 'DELIVERED', cancelled: 'CANCELLED' };

export default function ActiveOrderBanner({ onViewOrders }) {
  const [dismissed, setDismissed] = useState(false);

  const { data: orders = [] } = useQuery({
    queryKey: ['my_active_orders_banner'],
    queryFn: () => base44.entities.order.list('-created_date', 5),
    refetchInterval: 60000,
  });

  const active = orders.filter(o => ['new', 'confirmed', 'in_fulfillment'].includes(o.status));
  if (active.length === 0 || dismissed) return null;

  const latest = active[0];
  const color = STATUS_COLOR[latest.status] || '#E0A22E';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="fixed bottom-16 left-1/2 z-[300] font-mono"
        style={{ transform: 'translateX(-50%)', width: 'min(480px, 92vw)' }}
      >
        <div
          className="flex items-center gap-3 px-4 py-2.5"
          style={{
            background: 'rgba(14,11,8,0.95)',
            border: `1px solid ${color}44`,
            boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${color}22`,
            clipPath: 'polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)',
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Pulse dot */}
          <div className="relative shrink-0">
            <div className="w-2 h-2 rounded-full" style={{ background: color }} />
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ background: color }}
              animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </div>

          <Package className="w-3.5 h-3.5 shrink-0" style={{ color }} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-[0.12em]" style={{ color }}>
                {STATUS_LABEL[latest.status]}
              </span>
              <span className="text-[9px]" style={{ color: '#5A4E40' }}>·</span>
              <span className="text-[9px]" style={{ color: '#7A6E60' }}>
                {latest.tracking_code || `#${latest.id.slice(-6).toUpperCase()}`}
              </span>
              {active.length > 1 && (
                <span className="text-[8px] px-1.5 py-0.5" style={{ background: 'rgba(224,162,46,0.1)', color: '#C8893B', border: '1px solid rgba(224,162,46,0.2)' }}>
                  +{active.length - 1} more
                </span>
              )}
            </div>
            <div className="text-[9px] truncate mt-0.5" style={{ color: '#5A4E40' }}>
              {latest.delivery_location ? `→ ${latest.delivery_location}` : 'Awaiting delivery location'}
            </div>
          </div>

          <button
            onClick={onViewOrders}
            className="flex items-center gap-1 px-2.5 py-1 text-[9px] tracking-[0.1em] shrink-0 transition-all"
            style={{ border: `1px solid ${color}33`, color, background: `${color}0E` }}
            onMouseEnter={e => e.currentTarget.style.background = `${color}1A`}
            onMouseLeave={e => e.currentTarget.style.background = `${color}0E`}
          >
            TRACK <ChevronRight className="w-2.5 h-2.5" />
          </button>

          <button onClick={() => setDismissed(true)} className="shrink-0 p-0.5">
            <X className="w-3 h-3" style={{ color: '#3A2E1E' }} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}