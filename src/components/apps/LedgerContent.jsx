import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Trash2 } from 'lucide-react';
import LedgerEntryForm, { CATEGORIES } from '@/components/apps/ledger/LedgerEntryForm';
import LedgerSummary from '@/components/apps/ledger/LedgerSummary';
import MonthlyReport from '@/components/apps/ledger/MonthlyReport';

export default function LedgerContent() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');

  const { data: entries = [] } = useQuery({
    queryKey: ['ledger_entries'],
    queryFn: () => base44.entities.ledger_entry.list('-entry_date', 500),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ledger_entry.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ledger_entries'] }),
  });

  const filtered = filter === 'all' ? entries : entries.filter((e) => e.entry_type === filter);

  return (
    <div className="h-full flex flex-col industrial-interior font-mono" style={{ background: 'hsl(30, 8%, 9%)' }}>
      <LedgerSummary entries={entries} />
      <LedgerEntryForm />

      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'hsl(33, 18%, 18%)' }}>
        <div className="text-[9px] text-muted-foreground tracking-[0.2em]">
          TRANSACTION LOG — {filtered.length} ENTRIES
        </div>
        <div className="flex items-center gap-2">
          <MonthlyReport entries={entries} />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="h-7 w-28 text-[10px] font-mono"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All</SelectItem>
              <SelectItem value="income" className="text-xs">Income</SelectItem>
              <SelectItem value="expense" className="text-xs">Expenses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-1.5">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">No entries yet — log your first credit movement above.</p>
          </div>
        ) : (
          filtered.map((e) => {
            const isIncome = e.entry_type === 'income';
            return (
              <div
                key={e.id}
                className="flex items-center gap-3 rounded border px-3 py-2"
                style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 8%)' }}
              >
                <span
                  className="w-1 self-stretch rounded-full shrink-0"
                  style={{ background: isIncome ? 'hsl(140, 50%, 45%)' : 'hsl(0, 55%, 50%)' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-foreground truncate">{e.description || CATEGORIES[e.category] || 'Entry'}</span>
                    <Badge variant="outline" className="text-[8px] h-4 text-muted-foreground">
                      {CATEGORIES[e.category] || e.category}
                    </Badge>
                  </div>
                  <div className="text-[9px] text-muted-foreground">
                    {e.entry_date || ''} {e.counterparty && `• ${e.counterparty}`}
                  </div>
                </div>
                <span
                  className="text-xs font-bold shrink-0"
                  style={{ color: isIncome ? 'hsl(140, 50%, 50%)' : 'hsl(0, 55%, 55%)' }}
                >
                  {isIncome ? '+' : '−'}{(e.amount_auec || 0).toLocaleString()}
                </span>
                <button
                  onClick={() => deleteMutation.mutate(e.id)}
                  className="text-muted-foreground hover:text-destructive shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}