import React from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Satellite } from 'lucide-react';
import { FSIS, FLEET_REGISTRY, FLEET_NOTE } from '@/lib/fsisLore';

/** Patch / fleet / relay status panel for the About tab */
export default function SystemStatus() {
  const { data: prices = [] } = useQuery({
    queryKey: ['ticker_prices'],
    queryFn: () => base44.entities.commodity_price.filter({ is_best_sell: true }),
  });
  const patch = prices[0]?.patch_version;
  const latest = prices.reduce((m, p) => ((p.synced_at || '') > m ? p.synced_at : m), '');

  const cells = [
    { k: 'GAME PATCH', v: patch || '—' },
    { k: 'UEX RELAY', v: latest ? `SYNCED ${new Date(latest).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'AWAITING' },
    { k: 'OPERATING REGION', v: 'STANTON — microTech AO' },
    { k: 'FLEET', v: `${FLEET_REGISTRY[0].hull} ${FLEET_REGISTRY[0].name} — ON STATION` },
  ];

  return (
    <div className="border p-4 mb-4 max-w-3xl" style={{ borderColor: '#5C4A33', background: '#14110D' }}>
      <div className="flex items-center gap-2 font-mono text-[9px] tracking-[0.25em] mb-3" style={{ color: '#B0793A' }}>
        <Satellite className="w-3 h-3" /> SYSTEM STATUS — {FSIS.abbr} OPERATIONS
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cells.map((c) => (
          <motion.div
            key={c.k}
            whileHover={{ y: -1, borderColor: '#3C5A50', boxShadow: '0 0 10px rgba(111,160,143,0.1)' }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
            className="border p-2.5"
            style={{ borderColor: '#2A2118', background: '#0E0C09' }}
          >
            <div className="font-mono text-[8px] tracking-[0.2em]" style={{ color: '#8A7E6C' }}>{c.k}</div>
            <div className="font-mono text-[10px] font-bold mt-1" style={{ color: '#D8CFC0' }}>{c.v}</div>
          </motion.div>
        ))}
      </div>
      <p className="font-mono text-[9px] mt-3" style={{ color: '#6B6155' }}>{FLEET_NOTE}</p>
    </div>
  );
}