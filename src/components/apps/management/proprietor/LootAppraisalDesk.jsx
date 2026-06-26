import React from 'react';
import { money, suggestedLootPrice } from '@/components/apps/management/proprietor/proprietorUtils';

export default function LootAppraisalDesk({ loot, onApplyPrice, onPublish, pricing, publishing }) {
  const rows = loot.filter((i) => !['listed', 'sold', 'scrapped'].includes(i.status)).slice(0, 8);
  return (
    <section className="border p-3 space-y-2" style={{ borderColor: '#2A2118', background: '#100E0B' }}>
      <div><div className="text-[9px] tracking-[0.22em]" style={{ color: '#C8893B' }}>LOOT APPRAISAL + BULK LISTING</div><p className="text-[9px]" style={{ color: '#7A6E60' }}>Rule: New 85%, Refurb 65%, Used 42%, Worn 25% of estimate.</p></div>
      {rows.length === 0 ? <p className="text-[10px]" style={{ color: '#7A6E60' }}>No unlisted loot needs appraisal.</p> : rows.map((item) => {
        const suggested = suggestedLootPrice(item);
        return <div key={item.id} className="border p-2 grid grid-cols-[1fr_auto] gap-2" style={{ borderColor: '#3A2F20', background: '#0C0A07' }}><div className="min-w-0"><div className="text-[11px] font-bold truncate" style={{ color: '#EDE5D6' }}>{item.item_name}</div><div className="text-[8px]" style={{ color: '#8A8F45' }}>{item.item_type?.replace(/_/g, ' ') || 'item'} • {item.condition_pct || 0}% • suggested {money(suggested)}</div><div className="text-[8px]" style={{ color: '#7A6E60' }}>Lifecycle: {item.source_op || 'unknown source'} → {item.status || 'raw'} → resale</div></div><div className="flex flex-col gap-1"><button disabled={pricing} onClick={() => onApplyPrice(item.id, suggested)} className="border px-2 py-1 text-[8px] font-bold disabled:opacity-40" style={{ borderColor: '#5C4424', color: '#C8893B' }}>APPLY</button>{Number(item.est_sell_auec || 0) > 0 && <button disabled={publishing} onClick={() => onPublish(item)} className="border px-2 py-1 text-[8px] font-bold disabled:opacity-40" style={{ borderColor: '#8A8F45', color: '#8A8F45' }}>LIST</button>}</div></div>;
      })}
    </section>
  );
}