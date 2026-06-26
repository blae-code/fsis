import React from 'react';

function ageLabel(date) {
  if (!date) return 'never';
  const hours = Math.floor((Date.now() - new Date(date).getTime()) / 3600000);
  if (hours < 1) return 'fresh';
  if (hours < 24) return `${hours}h old`;
  return `${Math.floor(hours / 24)}d old`;
}

export default function MarketSyncHealthPanel({ prices = [] }) {
  const latest = prices.map((p) => p.synced_at).filter(Boolean).sort().at(-1);
  const ageHours = latest ? (Date.now() - new Date(latest).getTime()) / 3600000 : 999;
  const status = ageHours <= 2 ? 'LIVE' : ageHours <= 24 ? 'STALE' : 'OFFLINE';
  const color = status === 'LIVE' ? '#8A8F45' : status === 'STALE' ? '#E0A22E' : '#C05050';
  const commodities = new Set(prices.map((p) => p.commodity_code).filter(Boolean)).size;
  const terminals = new Set(prices.map((p) => p.terminal_name).filter(Boolean)).size;
  return (
    <section className="border p-3 space-y-2" style={{ borderColor: '#2A2118', background: '#100E0B' }}>
      <div className="flex items-center justify-between"><div className="text-[9px] tracking-[0.22em]" style={{ color: '#C8893B' }}>MARKET SYNC HEALTH</div><span className="text-[9px] font-bold" style={{ color }}>{status}</span></div>
      <div className="grid grid-cols-3 gap-2 text-center"><div><b style={{ color: '#E0A22E' }}>{prices.length}</b><p className="text-[8px]" style={{ color: '#7A6E60' }}>PRICE ROWS</p></div><div><b style={{ color: '#8A8F45' }}>{commodities}</b><p className="text-[8px]" style={{ color: '#7A6E60' }}>COMMODITIES</p></div><div><b style={{ color: '#C8893B' }}>{terminals}</b><p className="text-[8px]" style={{ color: '#7A6E60' }}>TERMINALS</p></div></div>
      <p className="text-[9px]" style={{ color: '#8A7E6C' }}>Latest UEX cache: {ageLabel(latest)}. Use quick actions if margin watch or route intelligence looks stale.</p>
    </section>
  );
}