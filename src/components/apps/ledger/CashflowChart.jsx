import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { TrendingUp } from 'lucide-react';

/** Daily cashflow + running balance trend from ledger entries */
export default function CashflowChart({ entries }) {
  const byDay = {};
  entries.forEach((e) => {
    const d = (e.entry_date || e.created_date || '').slice(0, 10);
    if (!d) return;
    if (!byDay[d]) byDay[d] = { date: d, income: 0, expense: 0 };
    byDay[d][e.entry_type === 'income' ? 'income' : 'expense'] += e.amount_auec || 0;
  });

  let running = 0;
  const data = Object.values(byDay)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => {
      running += d.income - d.expense;
      return { ...d, net: d.income - d.expense, running };
    });

  if (data.length === 0) {
    return <p className="text-xs text-muted-foreground text-center py-10 font-mono">No dated entries yet — log or scan transactions to see trends.</p>;
  }

  return (
    <div className="p-3 space-y-2">
      <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground tracking-[0.2em] font-mono">
        <TrendingUp className="w-3 h-3" /> RUNNING NET POSITION & DAILY CASHFLOW
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="runGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(38, 72%, 52%)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="hsl(38, 72%, 52%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(33, 18%, 14%)" />
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(35, 12%, 52%)', fontFamily: 'JetBrains Mono' }} />
            <YAxis tick={{ fontSize: 9, fill: 'hsl(35, 12%, 52%)', fontFamily: 'JetBrains Mono' }} width={70}
              tickFormatter={(v) => v.toLocaleString()} />
            <Tooltip
              contentStyle={{ background: 'hsl(30, 10%, 8%)', border: '1px solid hsl(33, 18%, 18%)', fontFamily: 'JetBrains Mono', fontSize: 10 }}
              formatter={(v, name) => [`${v.toLocaleString()} aUEC`, { running: 'Running net', net: 'Daily net', income: 'Income', expense: 'Expenses' }[name] || name]}
            />
            <ReferenceLine y={0} stroke="hsl(0, 55%, 40%)" strokeDasharray="4 4" />
            <Area type="monotone" dataKey="running" stroke="hsl(38, 72%, 52%)" strokeWidth={2} fill="url(#runGrad)" />
            <Area type="monotone" dataKey="net" stroke="hsl(210, 45%, 55%)" strokeWidth={1} fill="none" strokeDasharray="3 3" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-4 text-[9px] font-mono text-muted-foreground">
        <span><span style={{ color: 'hsl(38, 72%, 52%)' }}>━</span> Running net position</span>
        <span><span style={{ color: 'hsl(210, 45%, 55%)' }}>┅</span> Daily net</span>
      </div>
    </div>
  );
}