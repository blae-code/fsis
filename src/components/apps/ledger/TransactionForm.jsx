import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus } from 'lucide-react';
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES } from './ledgerCategories';

const EMPTY = {
  tx_type: 'income',
  category: 'salvage_sale',
  amount_auec: '',
  description: '',
  counterparty: '',
  tx_date: new Date().toISOString().slice(0, 10),
};

export default function TransactionForm() {
  const queryClient = useQueryClient();
  const [tx, setTx] = useState(EMPTY);

  const createMutation = useMutation({
    mutationFn: () =>
      base44.entities.ledger_transaction.create({ ...tx, amount_auec: parseFloat(tx.amount_auec) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ledger_transactions'] });
      setTx({ ...EMPTY, tx_type: tx.tx_type, category: tx.category, tx_date: tx.tx_date });
    },
  });

  const categories = tx.tx_type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const setType = (tx_type) =>
    setTx({ ...tx, tx_type, category: tx_type === 'income' ? 'salvage_sale' : 'fuel' });

  return (
    <div className="p-3 border-b space-y-3" style={{ borderColor: 'hsl(170, 25%, 18%)', background: 'hsl(180, 12%, 8%)' }}>
      <div className="flex gap-1">
        {['income', 'expense'].map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className="flex-1 py-1.5 rounded text-[10px] font-mono tracking-[0.15em] border transition-colors"
            style={
              tx.tx_type === t
                ? {
                    borderColor: t === 'income' ? 'hsl(140, 50%, 45%)' : 'hsl(0, 60%, 50%)',
                    color: t === 'income' ? 'hsl(140, 50%, 55%)' : 'hsl(0, 60%, 60%)',
                    background: t === 'income' ? 'hsl(140, 50%, 45%, 0.08)' : 'hsl(0, 60%, 50%, 0.08)',
                  }
                : { borderColor: 'hsl(170, 25%, 18%)', color: 'hsl(165, 20%, 50%)' }
            }
          >
            {t === 'income' ? '+ CREDIT IN' : '− CREDIT OUT'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[9px] font-mono text-muted-foreground">AMOUNT (aUEC)</Label>
          <Input
            type="number" min="0" value={tx.amount_auec}
            onChange={(e) => setTx({ ...tx, amount_auec: e.target.value })}
            className="h-8 text-xs font-mono" placeholder="0"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[9px] font-mono text-muted-foreground">CATEGORY</Label>
          <Select value={tx.category} onValueChange={(category) => setTx({ ...tx, category })}>
            <SelectTrigger className="h-8 text-xs font-mono"><SelectValue /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.value} value={c.value} className="text-xs">{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-[9px] font-mono text-muted-foreground">DESCRIPTION</Label>
          <Input
            value={tx.description}
            onChange={(e) => setTx({ ...tx, description: e.target.value })}
            className="h-8 text-xs font-mono" placeholder="e.g. 96 SCU RMC sold"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[9px] font-mono text-muted-foreground">COUNTERPARTY</Label>
          <Input
            value={tx.counterparty}
            onChange={(e) => setTx({ ...tx, counterparty: e.target.value })}
            className="h-8 text-xs font-mono" placeholder="e.g. TDD Orison, Redscar Nomads"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-[9px] font-mono text-muted-foreground">DATE</Label>
          <Input
            type="date" value={tx.tx_date}
            onChange={(e) => setTx({ ...tx, tx_date: e.target.value })}
            className="h-8 text-xs font-mono"
          />
        </div>
        <div className="flex items-end">
          <Button
            className="w-full h-8 font-mono text-[10px]"
            disabled={!tx.amount_auec || createMutation.isPending}
            onClick={() => createMutation.mutate()}
          >
            {createMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : (<><Plus className="w-3.5 h-3.5" /> POST ENTRY</>)}
          </Button>
        </div>
      </div>
    </div>
  );
}