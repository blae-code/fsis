import React from 'react';
import { TrendingUp, TrendingDown, Scale } from 'lucide-react';

export default function LedgerSummary({ entries }) {
  const income = entries.filter((e) => e.entry_type === 'income').reduce((s, e) => s + (e.amount_auec || 0), 0);
  const expenses = entries.filter((e) => e.entry_type === 'expense').reduce((s, e) => s + (e.amount_auec || 0), 0);
  const net = income - expenses;

  const kpis = [
    { label: 'TOTAL INCOME', value: income, icon: TrendingUp, color: 'hsl(140, 50%, 50%)' },
    { label: 'OPERATING COSTS', value: expenses, icon: TrendingDown, color: 'hsl(0, 55%, 55%)' },
    { label: 'NET BALANCE', value: net, icon: Scale, color: net >= 0 ? 'hsl(42, 85%, 60%)' : 'hsl(0, 55%, 55%)' },
  ];

  return (
    <div className="grid grid-cols-3 gap-px border-b" style={{ borderColor: 'hsl(33, 18%, 18%)' }}>
      {kpis.map((kpi) => (
        <div key={kpi.label} className="p-3 text-center" style={{ background: 'hsl(30, 10%, 7%)' }}>
          <div className="flex items-center justify-center gap-1 text-[9px] text-muted-foreground tracking-[0.2em]">
            <kpi.icon className="w-2.5 h-2.5" style={{ color: kpi.color }} />
            {kpi.label}
          </div>
          <div className="text-sm font-bold" style={{ color: kpi.color }}>
            {kpi.value.toLocaleString()} aUEC
          </div>
        </div>
      ))}
    </div>
  );
}