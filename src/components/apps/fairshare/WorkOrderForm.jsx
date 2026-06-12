import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, Users } from 'lucide-react';

const border = { borderColor: 'hsl(33, 18%, 18%)' };
const panel = { ...border, background: 'hsl(30, 10%, 8%)' };

export default function WorkOrderForm() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [gross, setGross] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [shares, setShares] = useState({}); // handle -> shares

  const { data: crew = [] } = useQuery({
    queryKey: ['crew_members'],
    queryFn: () => base44.entities.crew_member.filter({ active: true }),
  });

  const createMutation = useMutation({
    mutationFn: (order) => base44.entities.work_order.create(order),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['work_orders'] });
      setName(''); setGross(''); setExpenses([]); setShares({});
    },
  });

  const toggleCrew = (member) => {
    setShares((prev) => {
      const next = { ...prev };
      if (next[member.handle] != null) delete next[member.handle];
      else next[member.handle] = member.default_shares || 1;
      return next;
    });
  };

  const submit = () => {
    createMutation.mutate({
      order_name: name,
      gross_auec: parseFloat(gross) || 0,
      expenses: expenses.filter((e) => e.label && e.amount_auec > 0),
      crew_shares: Object.entries(shares).map(([handle, s]) => ({ handle, shares: s })),
      status: 'open',
    });
  };

  return (
    <div className="p-3 rounded border space-y-3 font-mono" style={panel}>
      <div className="text-[10px] text-muted-foreground tracking-[0.2em]">NEW WORK ORDER</div>

      <div className="grid grid-cols-2 gap-2">
        <Input placeholder="Order name, e.g. Halo sweep #4" value={name} onChange={(e) => setName(e.target.value)} className="h-8 text-xs" style={border} />
        <Input type="number" placeholder="Gross sale (aUEC)" value={gross} onChange={(e) => setGross(e.target.value)} className="h-8 text-xs" style={border} />
      </div>

      {/* Expenses */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-muted-foreground tracking-[0.15em]">EXPENSES</span>
          <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1" style={border}
            onClick={() => setExpenses([...expenses, { label: '', amount_auec: 0 }])}>
            <Plus className="w-2.5 h-2.5" /> ADD
          </Button>
        </div>
        {expenses.map((e, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input placeholder="Fuel, repairs, fees…" value={e.label} className="h-7 text-[10px]" style={border}
              onChange={(ev) => setExpenses(expenses.map((x, j) => j === i ? { ...x, label: ev.target.value } : x))} />
            <Input type="number" placeholder="aUEC" value={e.amount_auec || ''} className="h-7 text-[10px] w-28" style={border}
              onChange={(ev) => setExpenses(expenses.map((x, j) => j === i ? { ...x, amount_auec: parseFloat(ev.target.value) || 0 } : x))} />
            <button onClick={() => setExpenses(expenses.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {/* Crew picker */}
      <div className="space-y-1.5">
        <span className="text-[9px] text-muted-foreground tracking-[0.15em] flex items-center gap-1.5">
          <Users className="w-3 h-3" /> CREW ON THIS OP
        </span>
        {crew.length === 0 ? (
          <p className="text-[10px] text-muted-foreground">No crew on roster — add members in the CREW ROSTER tab.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {crew.map((m) => {
              const selected = shares[m.handle] != null;
              return (
                <div key={m.id} className="flex items-center gap-1">
                  <button
                    onClick={() => toggleCrew(m)}
                    className="text-[10px] px-2 py-1 rounded border transition-colors"
                    style={{
                      borderColor: selected ? 'hsl(38, 72%, 52%)' : 'hsl(33, 18%, 18%)',
                      background: selected ? 'hsl(38, 72%, 52%, 0.12)' : 'transparent',
                      color: selected ? 'hsl(42, 85%, 60%)' : 'hsl(35, 12%, 52%)',
                    }}
                  >
                    {m.handle}
                  </button>
                  {selected && (
                    <Input type="number" min="0" step="0.5" value={shares[m.handle]}
                      onChange={(e) => setShares({ ...shares, [m.handle]: parseFloat(e.target.value) || 0 })}
                      className="h-7 w-16 text-[10px]" style={border} title="Share weight" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Button size="sm" className="h-8 text-[10px] w-full" disabled={!name || createMutation.isPending} onClick={submit}>
        CREATE WORK ORDER
      </Button>
    </div>
  );
}