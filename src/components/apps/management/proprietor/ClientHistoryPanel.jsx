import React, { useState } from 'react';
import { Search } from 'lucide-react';
import ClientHistoryRow from '@/components/apps/management/proprietor/ClientHistoryRow';

// Groups all past orders by customer handle, surfacing repeat customers
// and each client's preferred salvage commodities.
export default function ClientHistoryPanel({ orders, products }) {
  const [search, setSearch] = useState('');

  const salvageIds = new Set(products.filter((p) => p.category === 'salvage_commodity').map((p) => p.id));
  const salvageCodes = new Set(products.filter((p) => p.category === 'salvage_commodity' && p.code).map((p) => p.code));

  const clients = Object.values(orders.reduce((map, o) => {
    const key = o.customer_handle || 'Unknown buyer';
    map[key] ||= { handle: key, orders: [], total: 0, commodities: {} };
    map[key].orders.push(o);
    if (o.status !== 'cancelled') {
      map[key].total += Number(o.total_auec || 0);
      (o.items || []).forEach((i) => {
        const isSalvage = salvageIds.has(i.product_id) || (i.code && salvageCodes.has(i.code));
        if (!isSalvage) return;
        const name = i.code || i.product_name;
        map[key].commodities[name] = (map[key].commodities[name] || 0) + Number(i.quantity || 0);
      });
    }
    return map;
  }, {}))
    .map((c) => ({
      ...c,
      orders: c.orders.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)),
      topCommodities: Object.entries(c.commodities).sort((a, b) => b[1] - a[1]).slice(0, 3),
    }))
    .filter((c) => !search || c.handle.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.orders.length - a.orders.length || b.total - a.total);

  const repeatCount = clients.filter((c) => c.orders.length > 1).length;

  return (
    <section className="border p-3 space-y-2" style={{ borderColor: '#2A2118', background: '#100E0B' }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-[9px] tracking-[0.22em]" style={{ color: '#C8893B' }}>CLIENT HISTORY</div>
        <div className="text-[8px] tracking-[0.14em]" style={{ color: '#8A8F45' }}>
          {clients.length} CLIENTS • {repeatCount} REPEAT
        </div>
      </div>
      <div className="flex items-center gap-2 border px-2" style={{ borderColor: '#3A2F20', background: '#0C0A07' }}>
        <Search className="w-3 h-3 shrink-0" style={{ color: '#7A6E60' }} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by handle…"
          className="w-full bg-transparent py-1.5 text-[10px] outline-none"
          style={{ color: '#EDE5D6' }}
        />
      </div>
      {clients.length === 0 ? (
        <p className="text-[10px]" style={{ color: '#7A6E60' }}>No client order history yet.</p>
      ) : (
        <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
          {clients.map((c) => <ClientHistoryRow key={c.handle} client={c} />)}
        </div>
      )}
    </section>
  );
}