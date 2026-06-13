import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { differenceInHours, differenceInDays } from 'date-fns';
import { motion } from 'framer-motion';

export default function StalenessIndicator() {
  const { data: prices = [] } = useQuery({
    queryKey: ['uex_staleness'],
    queryFn: () => base44.entities.commodity_price.list('-synced_at', 1),
    staleTime: 300000,
  });

  const lastSync = prices[0]?.synced_at ? new Date(prices[0].synced_at) : null;

  if (!lastSync) return null;

  const hoursOld = differenceInHours(new Date(), lastSync);
  const daysOld  = differenceInDays(new Date(), lastSync);

  const isStale   = hoursOld >= 24;
  const isCritical = daysOld >= 3;

  if (!isStale) return null;

  const color = isCritical ? '#C05050' : '#C8893B';
  const label = daysOld >= 1 ? `UEX ${daysOld}d OLD` : `UEX ${hoursOld}h OLD`;

  return (
    <motion.div
      className="flex items-center gap-1 px-2 py-0.5 border"
      style={{ borderColor: `${color}44`, background: `${color}12` }}
      animate={{ opacity: [1, 0.6, 1] }}
      transition={{ duration: 2.5, repeat: Infinity }}
      title={`Last UEX sync: ${lastSync.toLocaleString()}. Market prices may be outdated.`}
    >
      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
        <path d="M4 1V4L6 5" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
        <circle cx="4" cy="4" r="3.2" stroke={color} strokeWidth="0.8"/>
      </svg>
      <span className="font-mono text-[8px] font-bold" style={{ color }}>
        {label}
      </span>
    </motion.div>
  );
}