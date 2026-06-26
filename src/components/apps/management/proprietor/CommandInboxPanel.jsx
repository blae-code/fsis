import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function CommandInboxPanel({ orders = [], products = [], loot = [], messages = [], restocks = [], prices = [] }) {
  const { data: debugLogs = [] } = useQuery({ queryKey: ['debug_logs_inbox'], queryFn: () => base44.entities.debug_log.filter({ resolved: false }, '-created_date', 20) });
  const latestPrice = prices.map((p) => p.synced_at).filter(Boolean).sort().at(-1);
  const staleMarket = !latestPrice || Date.now() - new Date(latestPrice).getTime() > 24 * 3600000;
  const items = [
    ...orders.filter((o) => o.status === 'new').map((o) => ['New order', o.tracking_code || o.customer_handle, 'blocker']),
    ...messages.slice(0, 5).map((m) => ['Buyer message', m.tracking_code || m.handle || 'Order thread', 'important']),
    ...products.filter((p) => p.available && Number(p.stock || 0) <= 2).slice(0, 5).map((p) => ['Low stock', p.product_name, 'important']),
    ...restocks.filter((r) => !r.notified).slice(0, 5).map((r) => ['Restock follow-up', r.product_name || r.handle, 'important']),
    ...loot.filter((l) => ['raw', 'repairing', 'repaired'].includes(l.status)).slice(0, 5).map((l) => ['Loot action', l.item_name, 'normal']),
    ...debugLogs.slice(0, 5).map((d) => ['Debug log', d.message, 'blocker']),
    ...(staleMarket ? [['Market sync', 'UEX cache is stale or unavailable', 'blocker']] : []),
  ].slice(0, 18);
  const tone = (p) => p === 'blocker' ? '#C05050' : p === 'important' ? '#E0A22E' : '#8A8F45';
  return (
    <section className="border p-3 space-y-3" style={{ borderColor: '#5C4424', background: '#120D08' }}>
      <div><p className="text-[9px] tracking-[0.24em]" style={{ color: '#E0A22E' }}>COMMAND INBOX</p><p className="text-[9px]" style={{ color: '#8A7E6C' }}>{items.length} combined action signals across orders, buyers, stock, market, loot, and diagnostics.</p></div>
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-2">
        {items.length ? items.map(([label, detail, priority], idx) => <div key={`${label}-${idx}`} className="border p-2" style={{ borderColor: tone(priority), background: '#0A0806' }}><b className="text-[9px]" style={{ color: tone(priority) }}>{label}</b><p className="text-[8px] mt-1 truncate" style={{ color: '#D8CFC0' }}>{detail}</p></div>) : <p className="text-[10px]" style={{ color: '#8A8F45' }}>No active command inbox items.</p>}
      </div>
    </section>
  );
}