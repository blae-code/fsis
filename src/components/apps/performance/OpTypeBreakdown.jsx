import React from 'react';
import { motion } from 'framer-motion';

const AMBER  = '#E0A22E';
const TEAL   = '#6FA08F';
const DIM    = '#7A6E60';
const DIMMER = '#3A3028';
const PANEL  = { background: '#0E0C09', borderColor: '#2A2118' };

const OP_COLOR = {
  salvage: AMBER, bounty: '#C05050', cargo: TEAL,
  piracy: '#9B6FC0', escort: '#6FA08F', other: DIM,
};

export default function OpTypeBreakdown({ workOrders = [] }) {
  if (workOrders.length === 0) return null;

  const breakdown = {};
  workOrders.forEach((o) => {
    const t = o.op_type || 'other';
    if (!breakdown[t]) breakdown[t] = { count: 0, gross: 0, settled: 0 };
    breakdown[t].count++;
    breakdown[t].gross += o.gross_auec || 0;
    if (o.status === 'settled') breakdown[t].settled++;
  });

  const maxCount = Math.max(1, ...Object.values(breakdown).map((b) => b.count));

  return (
    <div className="border" style={PANEL}>
      <div className="px-3 py-2 border-b text-[9px] tracking-[0.18em]" style={{ borderColor: '#2A2118', color: DIM }}>
        ◆ OPERATIONS BY TYPE
      </div>
      <div className="p-3 space-y-2">
        {Object.entries(breakdown)
          .sort(([, a], [, b]) => b.count - a.count)
          .map(([type, b], i) => {
            const color = OP_COLOR[type] || DIM;
            const settleRate = b.count > 0 ? Math.round((b.settled / b.count) * 100) : 0;
            return (
              <div key={type}>
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 shrink-0" style={{ background: color }} />
                    <span className="text-[9px] tracking-[0.1em] font-mono" style={{ color }}>{type.toUpperCase()}</span>
                    <span className="text-[8px]" style={{ color: DIMMER }}>{b.count} ops · {settleRate}% settled</span>
                  </div>
                  <span className="text-[10px] font-bold" style={{ color }}>{b.gross.toLocaleString()} aUEC</span>
                </div>
                <div className="h-1" style={{ background: DIMMER }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(b.count / maxCount) * 100}%` }}
                    transition={{ delay: i * 0.06, duration: 0.4 }}
                    className="h-full"
                    style={{ background: color }}
                  />
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}