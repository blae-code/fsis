import React from 'react';

export default function FreightMarginBar({ cost = 0, handling = 0, profit = 0 }) {
  const total = Math.max(1, Number(cost || 0) + Number(handling || 0) + Math.max(0, Number(profit || 0)));
  const w = (v) => `${Math.max(4, Math.round((Math.max(0, Number(v || 0)) / total) * 100))}%`;
  return <div className="space-y-1"><div className="h-3 flex border overflow-hidden" style={{ borderColor:'#2A2118', background:'#080604' }}><div style={{ width:w(cost), background:'#5C4424' }} title="Commodity cost"/><div style={{ width:w(handling), background:'#8A6430' }} title="Handling cost"/><div style={{ width:w(profit), background: profit >= 0 ? '#8A8F45' : '#C05050' }} title="Profit"/></div><div className="flex gap-3 text-[8px] tracking-[0.12em]"><span style={{ color:'#5C4424' }}>■ COST</span><span style={{ color:'#8A6430' }}>■ HANDLING</span><span style={{ color: profit >= 0 ? '#8A8F45' : '#C05050' }}>■ PROFIT</span></div></div>;
}