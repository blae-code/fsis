import React from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, BookOpen } from 'lucide-react';
import { CATEGORY_LABELS } from './ledgerCategories';

export default function TransactionList({ transactions }) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ledger_transaction.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ledger_transactions'] }),
  });

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
        <p className="text-xs font-mono text-muted-foreground">Ledger empty — post your first entry above.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {transactions.map((t) => {
        const isIncome = t.tx_type === 'income';
        return (
          <div
            key={t.id}
            className="group flex items-center gap-3 rounded border px-3 py-2"
            style={{ borderColor: 'hsl(170, 25%, 18%)', background: 'hsl(180, 12%, 8%)' }}
          >
            <div
              className="w-1 self-stretch rounded-full shrink-0"
              style={{ background: isIncome ? 'hsl(140, 50%, 45%)' : 'hsl(0, 60%, 50%)' }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-mono text-foreground truncate">
                {t.description || CATEGORY_LABELS[t.category] || t.category}
              </div>
              <div className="text-[9px] font-mono text-muted-foreground truncate">
                {t.tx_date || new Date(t.created_date).toLocaleDateString()}
                {' • '}{CATEGORY_LABELS[t.category] || t.category}
                {t.counterparty && ` • ${t.counterparty}`}
              </div>
            </div>
            <div
              className="text-xs font-mono font-bold shrink-0"
              style={{ color: isIncome ? 'hsl(140, 50%, 55%)' : 'hsl(0, 60%, 60%)' }}
            >
              {isIncome ? '+' : '−'}{(t.amount_auec || 0).toLocaleString()}
            </div>
            <button
              onClick={() => deleteMutation.mutate(t.id)}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity shrink-0"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}