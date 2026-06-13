import React from 'react';
import { motion } from 'framer-motion';

const AMBER  = '#E0A22E';
const DIM    = '#7A6E60';
const DIMMER = '#3A3028';
const PANEL  = { background: '#0E0C09', borderColor: '#2A2118' };

export default function CrewEarnings({ workOrders = [], crew = [] }) {
  if (workOrders.length === 0) return null;

  // Roll up per-handle earnings from settled work orders
  const earnings = {};
  workOrders.filter((o) => o.status === 'settled').forEach((o) => {
    const gross = o.gross_auec || 0;
    const exp   = (o.expenses || []).reduce((s, e) => s + (e.amount_auec || 0), 0);
    const net   = gross - exp;
    const totalShares = (o.crew_shares || []).reduce((s, c) => s + (c.shares || 0), 0);
    (o.crew_shares || []).forEach((c) => {
      const payout = totalShares > 0 ? (net * c.shares) / totalShares : 0;
      earnings[c.handle] = (earnings[c.handle] || 0) + payout;
    });
  });

  const sorted = Object.entries(earnings).sort(([, a], [, b]) => b - a);
  if (sorted.length === 0) return null;
  const maxEarning = sorted[0][1];

  return (
    <div className="border" style={PANEL}>
      <div className="px-3 py-2 border-b text-[9px] tracking-[0.18em]" style={{ borderColor: '#2A2118', color: DIM }}>
        ◈ CREW EARNINGS — SETTLED WORK ORDERS
      </div>
      <div className="p-3 space-y-2">
        {sorted.map(([handle, total], i) => {
          const pct = (total / maxEarning) * 100;
          const crewMember = crew.find((m) => m.handle === handle);
          return (
            <div key={handle}>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono" style={{ color: '#D8CFC0' }}>{handle}</span>
                  {crewMember?.employment_type === 'proprietor' && (
                    <span className="text-[7px] px-1 py-0.5"
                      style={{ color: AMBER, border: `1px solid ${AMBER}44`, background: `${AMBER}14` }}>PROP</span>
                  )}
                </div>
                <span className="text-[10px] font-bold font-mono" style={{ color: AMBER }}>
                  {Math.round(total).toLocaleString()} aUEC
                </span>
              </div>
              <div className="h-1" style={{ background: DIMMER }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                  className="h-full"
                  style={{ background: AMBER }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}