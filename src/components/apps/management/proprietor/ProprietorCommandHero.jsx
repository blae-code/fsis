import React from 'react';
import FsisLogo from '@/components/brand/FsisLogo';
import { money } from '@/components/apps/management/proprietor/proprietorUtils';

export default function ProprietorCommandHero({ orders = [], products = [], loot = [], ledger = [], prices = [] }) {
  const activeOrders = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length;
  const queueValue = orders.filter((o) => o.status !== 'cancelled').reduce((sum, o) => sum + (Number(o.total_auec) || 0), 0);
  const pendingLoot = loot.filter((i) => ['raw', 'repairing', 'repaired'].includes(i.status)).length;
  const lowStock = products.filter((p) => p.available && (Number(p.stock) || 0) <= 2).length;
  const latest = prices.map((p) => p.synced_at).filter(Boolean).sort().at(-1);
  const net = ledger.reduce((sum, e) => sum + (e.entry_type === 'income' ? 1 : -1) * (Number(e.amount_auec) || 0), 0);
  const cards = [
    ['ACTIVE ORDERS', activeOrders, '#E0A22E'],
    ['LOOT TO PROCESS', pendingLoot, '#8A8F45'],
    ['LOW STOCK FLAGS', lowStock, '#C8893B'],
    ['LEDGER NET', money(net), '#D8CFC0'],
  ];
  return (
    <section className="relative overflow-hidden border p-[5px]" style={{ borderColor: '#5C4424', background: 'linear-gradient(135deg,#8A6430,#2A2118,#8A8F45)', clipPath: 'polygon(22px 0,100% 0,100% calc(100% - 22px),calc(100% - 22px) 100%,0 100%,0 22px)' }}>
      <div className="grid xl:grid-cols-[1.35fr_1fr] gap-0" style={{ background: 'linear-gradient(135deg,#14110D,#080604)', clipPath: 'polygon(19px 0,100% 0,100% calc(100% - 19px),calc(100% - 19px) 100%,0 100%,0 19px)' }}>
        <div className="p-5 md:p-6 relative">
          <div className="flex items-center gap-3"><div className="p-2 border" style={{ borderColor: '#8A6430', background: '#100A04' }}><FsisLogo size={34} /></div><div><p className="text-[9px] tracking-[0.32em]" style={{ color: '#8A8F45' }}>// SOLO PROPRIETOR OPERATING SYSTEM</p><h2 className="text-2xl md:text-3xl font-bold tracking-[0.12em]" style={{ color: '#EDE5D6' }}>PROPRIETOR COMMAND CENTER</h2></div></div>
          <p className="text-[11px] mt-4 max-w-2xl leading-relaxed" style={{ color: '#A89C8A' }}>Industrial control desk for fulfillment, resale appraisal, inventory demand, buyer history, pricing rules, and market-linked operational intelligence.</p>
          <div className="mt-4 flex flex-wrap gap-2 text-[9px] tracking-[0.18em]"><span style={{ color: '#E0A22E' }}>QUEUE VALUE: {money(queueValue)}</span><span style={{ color: '#5C4424' }}>//</span><span style={{ color: '#8A8F45' }}>UEX CACHE: {latest ? new Date(latest).toLocaleDateString() : 'NO SIGNAL'}</span></div>
        </div>
        <div className="grid grid-cols-2 gap-px bg-[#2A2118]">
          {cards.map(([label, value, color]) => <div key={label} className="p-4" style={{ background: '#0C0A07' }}><p className="text-[8px] tracking-[0.24em]" style={{ color: '#7A6E60' }}>{label}</p><b className="block mt-2 text-lg" style={{ color }}>{value}</b></div>)}
        </div>
      </div>
    </section>
  );
}