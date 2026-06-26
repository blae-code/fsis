import React from 'react';
import { money } from '@/components/apps/management/proprietor/proprietorUtils';

export default function MarginWatchPanel({ products, prices }) {
  const best = Object.fromEntries(prices.filter((p) => p.is_best_sell && p.commodity_code).map((p) => [p.commodity_code, p.price_sell || 0]));
  const rows = products.filter((p) => p.available && p.code && best[p.code]).map((p) => ({ ...p, margin: ((Number(p.price_auec || 0) - best[p.code]) / Math.max(best[p.code], 1)) * 100, ref: best[p.code] })).sort((a, b) => a.margin - b.margin).slice(0, 6);
  return (
    <section className="border p-3 space-y-2" style={{ borderColor: '#2A2118', background: '#100E0B' }}>
      <div className="text-[9px] tracking-[0.22em]" style={{ color: '#C8893B' }}>MARGIN WATCH</div>
      {rows.length === 0 ? <p className="text-[10px]" style={{ color: '#7A6E60' }}>No market-backed catalog pricing to review.</p> : rows.map((p) => <div key={p.id} className="border p-2" style={{ borderColor: '#3A2F20', background: '#0C0A07' }}><div className="flex justify-between gap-2"><span className="text-[10px] font-bold" style={{ color: '#EDE5D6' }}>{p.code}</span><span className="text-[10px]" style={{ color: p.margin < 5 ? '#C05050' : '#8A8F45' }}>{p.margin.toFixed(1)}%</span></div><div className="text-[8px]" style={{ color: '#7A6E60' }}>{money(p.price_auec)} listed • {money(p.ref)} market reference</div></div>)}
    </section>
  );
}