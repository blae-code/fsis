import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { formatDistanceToNow } from 'date-fns';

export default function UexStalenessIndicator() {
  const { data: prices = [] } = useQuery({
    queryKey: ['uex_staleness'],
    queryFn: () => base44.entities.commodity_price.list('-synced_at', 1),
    refetchInterval: 300000,
  });

  const latest = prices[0];
  if (!latest?.synced_at) return null;

  const ageMs = Date.now() - new Date(latest.synced_at);
  const ageDays = ageMs / 86400000;
  const isStale = ageDays > 1;
  const isCritical = ageDays > 3;

  const label = formatDistanceToNow(new Date(latest.synced_at), { addSuffix: true });

  if (!isStale) return null;

  return (
    <div className="flex items-center gap-1.5 px-2 py-0.5 font-mono"
      style={{
        background: isCritical ? 'rgba(192,80,80,0.12)' : 'rgba(200,137,59,0.1)',
        border: `1px solid ${isCritical ? 'rgba(192,80,80,0.3)' : 'rgba(200,137,59,0.25)'}`,
      }}
      title={`UEX market prices last synced ${label}`}
    >
      <AlertTriangle className="w-2.5 h-2.5" style={{ color: isCritical ? '#C05050' : '#C8893B' }} />
      <span className="text-[8px] tracking-[0.12em]" style={{ color: isCritical ? '#C05050' : '#C8893B' }}>
        UEX {isCritical ? 'STALE' : 'AGING'} · {label}
      </span>
    </div>
  );
}