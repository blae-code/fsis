import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pencil, Gift, Check, X } from 'lucide-react';

/** Management control — override an order's total or comp it as a donation
 *  before the order is finalized (delivered/cancelled). Adjustments are
 *  logged to internal_notes for the ledger trail. */
export default function OrderPriceAdjust({ order }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState('');

  const finalized = ['delivered', 'cancelled'].includes(order.status);
  const isDonation = (order.total_auec || 0) === 0 && (order.internal_notes || '').includes('DONATION');

  const adjustMutation = useMutation({
    mutationFn: ({ total, note }) =>
      base44.entities.order.update(order.id, {
        total_auec: total,
        internal_notes: [(order.internal_notes || '').trim(), note].filter(Boolean).join('\n'),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all_orders'] });
      setEditing(false);
      setValue('');
    },
  });

  const setPrice = () => {
    const total = Math.max(0, Math.round(Number(value)));
    if (!Number.isFinite(total) || value === '') return;
    adjustMutation.mutate({
      total,
      note: `PRICE ADJUSTED: ${(order.total_auec || 0).toLocaleString()} → ${total.toLocaleString()} aUEC (management)`,
    });
  };

  const donate = () => {
    adjustMutation.mutate({
      total: 0,
      note: `DONATION: order comped — was ${(order.total_auec || 0).toLocaleString()} aUEC (management)`,
    });
  };

  if (finalized) {
    return <span className="text-xs font-bold text-primary">{(order.total_auec || 0).toLocaleString()} aUEC</span>;
  }

  if (editing) {
    return (
      <span className="flex items-center gap-1">
        <Input
          type="number"
          min="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && setPrice()}
          placeholder={String(order.total_auec || 0)}
          className="h-7 w-28 text-[10px] font-mono"
          autoFocus
        />
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={setPrice} disabled={adjustMutation.isPending} title="Set new price">
          <Check className="w-3.5 h-3.5 text-primary" />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={donate} disabled={adjustMutation.isPending} title="Donate — comp this order to 0 aUEC">
          <Gift className="w-3.5 h-3.5" style={{ color: 'hsl(140, 50%, 50%)' }} />
        </Button>
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditing(false); setValue(''); }} title="Cancel">
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </Button>
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5">
      <span className="text-xs font-bold text-primary">
        {isDonation ? (
          <span className="flex items-center gap-1" style={{ color: 'hsl(140, 50%, 50%)' }}>
            <Gift className="w-3 h-3" /> DONATED
          </span>
        ) : (
          `${(order.total_auec || 0).toLocaleString()} aUEC`
        )}
      </span>
      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditing(true)} title="Adjust price or donate">
        <Pencil className="w-3 h-3 text-muted-foreground" />
      </Button>
    </span>
  );
}