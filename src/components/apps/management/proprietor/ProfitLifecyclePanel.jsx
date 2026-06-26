import React from 'react';
import { money } from '@/components/apps/management/proprietor/proprietorUtils';

export default function ProfitLifecyclePanel({ loot, repairs, products }) {
  const repairByLoot = repairs.reduce((m, r) => ({ ...m, [r.loot_item_id]: (m[r.loot_item_id] || 0) + Number(r.repair_cost_auec || 0) }), {});
  const rows = loot.filter((i) => i.linked_product_id || i.actual_sell_auec || i.est_sell_auec).slice(0, 8);
  const productById = Object.fromEntries(products.map((p) => [p.id, p]));
  return (
    <section className="border p-3 space-y-2" style={{ borderColor: '#2A2118', background: '#100E0B' }}>
      <div className="text-[9px] tracking-[0.22em]" style={{ color: '#C8893B' }}>PROFIT / ITEM LIFECYCLE</div>
      {rows.length === 0 ? <p className="text-[10px]" style={{ color: '#7A6E60' }}>No loot lifecycle values are available yet.</p> : rows.map((i) => {
        const revenue = Number(i.actual_sell_auec || productById[i.linked_product_id]?.price_auec || i.est_sell_auec || 0);
        const repair = repairByLoot[i.id] || 0;
        return <div key={i.id} className="border p-2" style={{ borderColor: '#3A2F20', background: '#0C0A07' }}><div className="flex justify-between gap-2"><span className="text-[10px] font-bold truncate" style={{ color: '#EDE5D6' }}>{i.item_name}</span><span className="text-[10px]" style={{ color: '#E0A22E' }}>{money(revenue - repair)}</span></div><div className="text-[8px]" style={{ color: '#7A6E60' }}>{i.status || 'raw'} • gross {money(revenue)} • repair {money(repair)}</div></div>;
      })}
    </section>
  );
}