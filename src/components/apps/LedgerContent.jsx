import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import LedgerSummary from './ledger/LedgerSummary';
import TransactionForm from './ledger/TransactionForm';
import TransactionList from './ledger/TransactionList';

const FILTERS = [
  { value: 'all', label: 'ALL' },
  { value: 'income', label: 'INCOME' },
  { value: 'expense', label: 'COSTS' },
];

export default function LedgerContent() {
  const [filter, setFilter] = useState('all');

  const { data: transactions = [] } = useQuery({
    queryKey: ['ledger_transactions'],
    queryFn: () => base44.entities.ledger_transaction.list('-tx_date', 500),
  });

  const filtered = filter === 'all' ? transactions : transactions.filter((t) => t.tx_type === filter);

  return (
    <div className="h-full flex flex-col industrial-interior font-mono" style={{ background: 'hsl(200, 10%, 10%)' }}>
      <LedgerSummary transactions={transactions} />
      <TransactionForm />

      <div className="flex items-center gap-1 px-3 pt-3">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className="px-3 py-1 rounded text-[9px] tracking-[0.15em] border transition-colors"
            style={
              filter === f.value
                ? { borderColor: 'hsl(168, 65%, 45%)', color: 'hsl(168, 80%, 55%)', background: 'hsl(168, 65%, 45%, 0.08)' }
                : { borderColor: 'hsl(170, 25%, 18%)', color: 'hsl(165, 20%, 50%)' }
            }
          >
            {f.label}
          </button>
        ))}
        <span className="ml-auto text-[9px] text-muted-foreground">{filtered.length} ENTRIES</span>
      </div>

      <div className="flex-1 overflow-auto p-3">
        <TransactionList transactions={filtered} />
      </div>

      <div className="px-3 py-1.5 border-t text-[8px] text-muted-foreground/60 tracking-[0.15em]" style={{ borderColor: 'hsl(170, 25%, 18%)' }}>
        FSIS LEDGER • REDSCAR NOMADS TRANSPARENT ACCOUNTING • ALL FIGURES IN aUEC
      </div>
    </div>
  );
}