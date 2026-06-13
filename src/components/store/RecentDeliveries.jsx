import React from 'react';
import { motion } from 'framer-motion';
import { recentDeliveries } from '@/functions/recentDeliveries';
import { useQuery } from '@tanstack/react-query';
import { PackageCheck } from 'lucide-react';

function timeAgo(date) {
  const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/** Anonymized recent-deliveries trust strip — proves the operation is active. */
export default function RecentDeliveries() {
  const { data: deliveries = [] } = useQuery({
    queryKey: ['recent_deliveries'],
    queryFn: () => recentDeliveries({}).then((r) => r.data?.deliveries || []),
    refetchInterval: 2 * 60 * 1000,
  });

  if (deliveries.length === 0) return null;

  return (
    <div className="border p-3" style={{ borderColor: '#2A2118', background: '#0F0D0B' }}>
      <p className="font-mono text-[9px] tracking-[0.25em] mb-2 flex items-center gap-1.5" style={{ color: '#6FA08F' }}>
        <PackageCheck className="w-3 h-3" /> RECENT DELIVERIES
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
        {deliveries.map((d, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04, duration: 0.2 }}
            whileHover={{ x: 2, color: '#C8B89A' }}
            className="flex items-center justify-between font-mono text-[10px] gap-2 cursor-default"
          >
            <span className="truncate" style={{ color: '#A89C8A' }}>
              <span style={{ color: '#C8B89A' }}>{d.code}</span>
              {d.units > 0 && <span style={{ color: '#6B6155' }}> • {d.units} units</span>}
              <span style={{ color: '#6B6155' }}> → {d.location}</span>
            </span>
            <span className="shrink-0" style={{ color: '#7BA05B' }}>{timeAgo(d.delivered_at)}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}