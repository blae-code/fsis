import React from 'react';
import { TrendingUp, TrendingDown, Scale } from 'lucide-react';

export default function LedgerSummary({ entries }) {
  const income = entries.filter((e) => e.entry_type === 'income').reduce((s, e) => s + (e.amount_auec || 0), 0);
  const expenses = entries.filter((e) => e.entry_type === 'expense').reduce((s, e) => s + (e.amount_auec || 0), 0);
  const net = income - expenses;

  const kpis = [
    { label: 'TOTAL INCOME', value: income, icon: TrendingUp, color: 'hsl(140, 50%, 50%)' },
    { label: 'OPERATING COSTS', value: expenses, icon: TrendingDown, color: 'hsl(0, 55%, 55%)' },
    { label: 'NET BALANCE', value: net, icon: Scale, color: net >= 0 ? 'hsl(168, 80%, 55%)' : 'hsl(0, 55%, 55%)' },
  ];

  return (
    <div className="grid grid-cols-3 gap-px border-b" style={{ borderColor: 'hsl(170, 25%, 18%)' }}>
      {kpis.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="p-3 text-center" style={{ background: 'hsl(180, 12%, 7%)' }}>
          <div className="flex items-center justify-center gap-1 text-[9px] text-muted-foreground tracking-[0.2em]">
            <Icon className="w-2.5 h-2.5" style={{ color }} /> {label}
          </div>
          <div className="text-sm font-bold" style={{ color }}>
            {value.toLocaleString()} aUEC
          </div>
        </div>
      ))}
    </div>
  );
}