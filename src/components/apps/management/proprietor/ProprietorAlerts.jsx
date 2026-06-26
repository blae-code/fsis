import React from 'react';

export default function ProprietorAlerts({ orders, loot, messages, products, prices }) {
  const stale = prices.filter((p) => p.synced_at && Date.now() - new Date(p.synced_at).getTime() > 36 * 60 * 60 * 1000).length;
  const alerts = [
    ...orders.filter((o) => o.status === 'new').slice(0, 3).map((o) => `New order awaiting confirmation: ${o.tracking_code}`),
    ...messages.slice(0, 3).map((m) => `Buyer message: ${m.tracking_code}`),
    ...loot.filter((i) => !['listed', 'sold', 'scrapped'].includes(i.status) && Number(i.est_sell_auec || 0) > 0).slice(0, 3).map((i) => `Loot ready to list: ${i.item_name}`),
    ...products.filter((p) => p.available && p.category !== 'service' && Number(p.stock || 0) === 0).slice(0, 3).map((p) => `Stockout: ${p.product_name}`),
    ...(stale ? [`UEX cache has ${stale} stale market records`] : []),
  ].slice(0, 8);
  return (
    <section className="border p-3 space-y-2" style={{ borderColor: '#5C4424', background: '#120D08' }}>
      <div className="text-[9px] tracking-[0.22em]" style={{ color: '#E0A22E' }}>PROPRIETOR NOTIFICATIONS</div>
      {alerts.length === 0 ? <p className="text-[10px]" style={{ color: '#7A6E60' }}>No urgent proprietor alerts.</p> : alerts.map((a) => <div key={a} className="border px-2 py-1 text-[9px]" style={{ borderColor: '#3A2F20', color: '#D8CFC0', background: '#0C0A07' }}>◆ {a}</div>)}
    </section>
  );
}