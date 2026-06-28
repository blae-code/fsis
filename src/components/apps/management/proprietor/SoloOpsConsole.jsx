import React from 'react';
import { PackageCheck, Route, Warehouse, AlertTriangle } from 'lucide-react';
import { warehouseMetrics } from '@/lib/warehouseUtils';
import SoloRevenueAnalyticsChart from './SoloRevenueAnalyticsChart';

const card = { borderColor: '#5C4424', background: 'linear-gradient(180deg,#14100B,#0B0906)' };

export default function SoloOpsConsole({ orders = [], crates = [], locations = [], products = [] }) {
  const m = warehouseMetrics(crates, locations);
  const activeOrders = orders.filter((o) => !['delivered','cancelled'].includes(o.status)).length;
  const highRisk = crates.filter((c) => c.risk_level === 'high').length;
  const actions = [
    { icon: PackageCheck, label: 'FULFILLMENT QUEUE', value: activeOrders, hint: 'buyer orders still open' },
    { icon: Warehouse, label: 'WAREHOUSE LOAD', value: `${m.scu}/${m.capacity || '∞'} SCU`, hint: `${m.utilization}% mapped capacity` },
    { icon: Route, label: 'READY FREIGHT', value: m.loaded, hint: 'packed or loaded crates' },
    { icon: AlertTriangle, label: 'RISK FLAGS', value: highRisk, hint: 'high-risk crates' },
  ];
  return <div className="space-y-4"><div className="grid md:grid-cols-4 gap-3">{actions.map(({ icon: Icon, label, value, hint }) => <div key={label} className="border p-3 font-mono" style={card}><div className="flex items-center gap-2 text-[9px] tracking-[0.18em]" style={{ color: '#8A8F45' }}><Icon className="w-3.5 h-3.5" />{label}</div><div className="mt-2 text-xl font-bold" style={{ color: '#E0A22E' }}>{value}</div><p className="text-[9px] mt-1" style={{ color: '#8A7E6C' }}>{hint}</p></div>)}</div><SoloRevenueAnalyticsChart orders={orders} products={products} /></div>;
}