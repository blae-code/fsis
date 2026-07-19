import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle, Loader2, ArrowRight } from 'lucide-react';

import { differenceInDays } from 'date-fns';

const AMBER  = '#E0A22E';
const TEAL   = '#6FA08F';
const DIM    = '#7A6E60';
const DIMMER = '#3A3028';
const PANEL  = { background: '#111009', borderColor: '#2A2118' };

const AGE_WARN  = 3;   // days
const AGE_ALERT = 7;   // days

function ageColor(days) {
  if (days >= AGE_ALERT) return '#C05050';
  if (days >= AGE_WARN)  return '#C8893B';
  return '#7A6E60';
}

const STATUS_NEXT = { raw: 'repairing', repairing: 'repaired', repaired: 'listed', listed: 'sold', sold: 'sold', scrapped: 'scrapped' };
const STATUS_COLOR = { raw: '#7A6E60', repairing: '#C8893B', repaired: '#6FA08F', listed: '#E0A22E', sold: '#7BA05B', scrapped: '#C05050' };

export default function LootInventoryAging() {
  const queryClient = useQueryClient();
  const [threshold, setThreshold] = useState(AGE_WARN);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['loot_items_aging'],
    queryFn: () => base44.entities.loot_item.list('-created_date', 500),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.loot_item.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['loot_items_aging'] }),
  });

  // Filter to unsold/unscrapped items only
  const active = items.filter((i) => !['sold', 'scrapped'].includes(i.status || 'raw'));

  const aged = active
    .map((i) => ({ ...i, ageDays: differenceInDays(new Date(), new Date(i.created_date)) }))
    .filter((i) => i.ageDays >= threshold)
    .sort((a, b) => b.ageDays - a.ageDays);

  const alertCount = aged.filter((i) => i.ageDays >= AGE_ALERT).length;

  return (
    <div className="p-4 space-y-4 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" style={{ color: AMBER }} />
          <span className="text-[10px] tracking-[0.2em]" style={{ color: '#B0793A' }}>INVENTORY AGING</span>
          {alertCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 text-[8px] font-bold" style={{ color: '#C05050', border: '1px solid #C0505055', background: '#C0505018' }}>
              <AlertTriangle className="w-2.5 h-2.5" /> {alertCount} STALE
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-[9px]" style={{ color: DIM }}>
          SHOW ITEMS OLDER THAN
          <input
            type="number" min="1" value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value) || 1)}
            className="w-10 h-6 text-center text-[10px] bg-transparent border font-mono"
            style={{ borderColor: '#2A2118', color: AMBER }}
          />
          DAYS
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'TOTAL ACTIVE', value: active.length, color: TEAL },
          { label: `AGING (${threshold}+ d)`, value: aged.length, color: AMBER },
          { label: `STALE (${AGE_ALERT}+ d)`, value: alertCount, color: '#C05050' },
        ].map((s) => (
          <div key={s.label} className="border p-2.5 text-center" style={PANEL}>
            <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[8px] tracking-[0.16em]" style={{ color: DIMMER }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-4 h-4 animate-spin" style={{ color: AMBER }} /></div>
      ) : aged.length === 0 ? (
        <div className="border p-10 text-center text-[10px]" style={{ ...PANEL, color: DIM }}>
          No items older than {threshold} days — inventory is fresh.
        </div>
      ) : (
        <div className="space-y-1.5">
          {/* Header */}
          <div className="grid grid-cols-[1fr_70px_70px_80px_auto] gap-2 px-2 text-[8px] tracking-[0.16em]" style={{ color: DIMMER }}>
            <span>ITEM</span>
            <span className="text-right">AGE</span>
            <span>STATUS</span>
            <span>CONDITION</span>
            <span />
          </div>

          {aged.map((item, i) => {
            const color = ageColor(item.ageDays);
            const statusColor = STATUS_COLOR[item.status || 'raw'];
            const nextStatus = STATUS_NEXT[item.status || 'raw'];
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className="border"
                style={{ ...PANEL, borderColor: item.ageDays >= AGE_ALERT ? '#5A2A2A' : '#2A2118' }}
              >
                <div className="grid grid-cols-[1fr_70px_70px_80px_auto] gap-2 px-2.5 py-2 items-center">
                  <div className="min-w-0">
                    <div className="text-[11px] truncate" style={{ color: '#D8CFC0' }}>{item.item_name}</div>
                    <div className="text-[8px]" style={{ color: DIM }}>
                      {item.item_type?.replace('_', ' ').toUpperCase()}
                      {item.size_class && item.size_class !== 'N/A' && ` · ${item.size_class}`}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[12px] font-bold" style={{ color }}>{item.ageDays}d</span>
                  </div>

                  <span className="text-[8px] font-bold px-1.5 py-0.5" style={{ color: statusColor, border: `1px solid ${statusColor}44`, background: `${statusColor}14` }}>
                    {(item.status || 'raw').toUpperCase()}
                  </span>

                  <span className="text-[10px]" style={{ color: item.condition_pct >= 60 ? TEAL : '#C8893B' }}>
                    {item.condition_pct || 0}%
                  </span>

                  {/* Suggest next action */}
                  {nextStatus && nextStatus !== item.status && (
                    <button
                      onClick={() => updateMutation.mutate({ id: item.id, data: { status: nextStatus } })}
                      title={`Advance to ${nextStatus}`}
                      className="flex items-center gap-1 px-2 py-0.5 text-[8px] tracking-[0.1em]"
                      style={{ color: AMBER, border: `1px solid ${AMBER}44`, background: `${AMBER}0E` }}
                    >
                      {nextStatus.toUpperCase()} <ArrowRight className="w-2 h-2" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}