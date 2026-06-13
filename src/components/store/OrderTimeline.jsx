import React from 'react';
import { motion } from 'framer-motion';
import { Inbox, CheckCircle2, Truck, PackageCheck, XCircle } from 'lucide-react';

const STEPS = [
  { id: 'new', label: 'RECEIVED', icon: Inbox },
  { id: 'confirmed', label: 'CONFIRMED', icon: CheckCircle2 },
  { id: 'in_fulfillment', label: 'IN FULFILLMENT', icon: Truck },
  { id: 'delivered', label: 'DELIVERED', icon: PackageCheck },
];

/** Horizontal buyer-facing status timeline for an order */
export default function OrderTimeline({ status }) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center gap-1.5 font-mono text-[10px]" style={{ color: '#C05050' }}>
        <XCircle className="w-3.5 h-3.5" /> ORDER CANCELLED
      </div>
    );
  }

  const currentIdx = Math.max(0, STEPS.findIndex((s) => s.id === status));

  return (
    <div className="flex items-center">
      {STEPS.map(({ id, label, icon: Icon }, idx) => {
        const done = idx <= currentIdx;
        const isCurrent = idx === currentIdx && status !== 'delivered';
        return (
          <React.Fragment key={id}>
            {idx > 0 && (
              <div className="flex-1 h-px mx-1 relative overflow-hidden" style={{ background: idx <= currentIdx ? '#E0A22E' : '#3A2F20' }}>
                {idx === currentIdx + 1 && status !== 'delivered' && status !== 'cancelled' && (
                  <motion.span
                    className="absolute inset-y-0 w-1/2"
                    style={{ background: 'linear-gradient(90deg, transparent, rgba(224, 162, 46, 0.7), transparent)' }}
                    animate={{ x: ['-100%', '250%'] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                  />
                )}
              </div>
            )}
            <div className="relative flex flex-col items-center gap-1 shrink-0">
              {isCurrent && (
                <motion.span
                  className="absolute -top-1 w-8 h-8 pointer-events-none"
                  style={{ border: '1px solid rgba(224, 162, 46, 0.6)', clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}
                  animate={{ scale: [1, 1.35], opacity: [0.7, 0] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                />
              )}
              <div
                className="w-6 h-6 flex items-center justify-center border"
                style={{
                  borderColor: done ? '#B0793A' : '#3A2F20',
                  background: done ? 'rgba(224, 162, 46, 0.15)' : '#121110',
                  color: done ? '#E0A22E' : '#5C5246',
                  clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)',
                  boxShadow: isCurrent ? '0 0 10px rgba(224, 162, 46, 0.4)' : 'none',
                }}
              >
                <Icon className="w-3 h-3" />
              </div>
              <span className="font-mono text-[8px] tracking-wider" style={{ color: done ? '#C8A05B' : '#5C5246' }}>
                {label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}