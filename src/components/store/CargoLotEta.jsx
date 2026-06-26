import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Truck, Package, CheckCircle } from 'lucide-react';

const STATUS_META = {
  collected: { label: 'CARGO COLLECTED — AWAITING HAUL', color: '#C8893B', icon: Package },
  processed: { label: 'EN ROUTE TO DELIVERY', color: '#6FA08F', icon: Truck },
  sold:       { label: 'DELIVERED TO TERMINAL', color: '#7BA05B', icon: CheckCircle },
};

/**
 * Looks up active cargo lots for commodities in the order and surfaces
 * their current pipeline status as a live delivery context strip.
 */
export default function CargoLotEta({ order }) {
  // Extract commodity codes from the order items
  const codes = [...new Set((order.items || []).map((i) => i.code).filter(Boolean))];

  const { data: lots = [] } = useQuery({
    queryKey: ['cargo_lots_for_order', codes.join(',')],
    queryFn: async () => {
      if (codes.length === 0) return [];
      const results = await Promise.all(
        codes.map((code) =>
          base44.entities.cargo_lot.filter({ commodity_code: code }, '-created_date', 5).catch(() => [])
        )
      );
      return results.flat().filter((l) => l.status !== 'sold');
    },
    enabled: codes.length > 0,
    staleTime: 60 * 1000,
  });

  if (lots.length === 0) return null;

  return (
    <div className="border-t pt-2.5 space-y-1.5" style={{ borderColor: '#2A2118' }}>
      <div className="font-mono text-[8px] tracking-[0.2em]" style={{ color: '#4A3A28' }}>CARGO PIPELINE</div>
      {lots.slice(0, 3).map((lot) => {
        const meta = STATUS_META[lot.status] || STATUS_META.collected;
        const Icon = meta.icon;
        return (
          <div key={lot.id} className="flex items-center gap-2 font-mono text-[9px]">
            <Icon className="w-3 h-3 shrink-0" style={{ color: meta.color }} />
            <span style={{ color: '#A89C8A' }}>{lot.commodity_code}</span>
            <span style={{ color: '#5A4A38' }}>·</span>
            <span style={{ color: lot.status === 'processed' ? meta.color : '#6A5A48' }}>{meta.label}</span>
            {lot.destination && (
              <>
                <span style={{ color: '#3A2A18' }}>→</span>
                <span style={{ color: '#7A6A58' }}>{lot.destination}</span>
              </>
            )}
            {lot.quantity_scu > 0 && (
              <span className="ml-auto shrink-0" style={{ color: '#4A3A28' }}>{lot.quantity_scu} SCU</span>
            )}
          </div>
        );
      })}
    </div>
  );
}