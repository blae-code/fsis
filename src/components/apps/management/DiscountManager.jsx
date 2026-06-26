import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TicketPercent, Trash2, BellRing } from 'lucide-react';

const border = { borderColor: 'hsl(33, 18%, 18%)' };
const panel = { ...border, background: 'hsl(30, 10%, 8%)' };

/** Discount codes + open restock requests from storefront buyers */
export default function DiscountManager() {
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [label, setLabel] = useState('');
  const [percent, setPercent] = useState('');

  const { data: codes = [] } = useQuery({
    queryKey: ['discount_codes'],
    queryFn: () => base44.entities.discount_code.list('-created_date'),
  });
  const { data: restocks = [] } = useQuery({
    queryKey: ['restock_requests'],
    queryFn: () => base44.entities.restock_request.list('-created_date', 100),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      base44.entities.discount_code.create({
        code: code.toUpperCase().trim(),
        label,
        discount_percent: parseFloat(percent) || 0,
        active: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discount_codes'] });
      setCode(''); setLabel(''); setPercent('');
    },
  });
  const updateCode = useMutation({
    mutationFn: ({ id, data }) => base44.entities.discount_code.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['discount_codes'] }),
  });
  const deleteCode = useMutation({
    mutationFn: (id) => base44.entities.discount_code.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['discount_codes'] }),
  });
  const notifyRestock = useMutation({
    mutationFn: (id) => base44.entities.restock_request.update(id, { status: 'notified' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['restock_requests'] }),
  });

  return (
    <div className="space-y-4">
      <div className="p-3 rounded border space-y-2" style={panel}>
        <div className="text-[10px] text-muted-foreground tracking-[0.2em] flex items-center gap-1.5">
          <TicketPercent className="w-3 h-3" /> ISSUE PRIVATE DISCOUNT CODE
        </div>
        <p className="text-[10px] text-muted-foreground">Codes are only visible here in the proprietor console; the public storefront accepts issued codes without publishing them.</p>
        <div className="grid grid-cols-[8rem_1fr_4.5rem_auto] gap-2">
          <Input placeholder="CODE" value={code} onChange={(e) => setCode(e.target.value)} className="h-8 text-xs uppercase" style={border} />
          <Input placeholder="Label, e.g. Redscar Nomads org rate" value={label} onChange={(e) => setLabel(e.target.value)} className="h-8 text-xs" style={border} />
          <Input type="number" min="0" max="100" placeholder="%" value={percent} onChange={(e) => setPercent(e.target.value)} className="h-8 text-xs" style={border} />
          <Button size="sm" className="h-8 text-[10px]" disabled={!code || !percent || createMutation.isPending} onClick={() => createMutation.mutate()}>
            ISSUE
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="text-[10px] text-muted-foreground tracking-[0.2em]">ACTIVE CODES ({codes.length})</div>
        {codes.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">No discount codes issued.</p>
        ) : codes.map((c) => (
          <div key={c.id} className="p-2.5 rounded border flex items-center gap-3" style={panel}>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-primary">{c.code}</div>
              <div className="text-[9px] text-muted-foreground truncate">{c.label || '—'} • {c.discount_percent}% off • {c.uses || 0} redemption{(c.uses || 0) === 1 ? '' : 's'}</div>
            </div>
            <button onClick={() => updateCode.mutate({ id: c.id, data: { active: !c.active } })} title="Toggle active">
              <Badge variant="outline" className={`text-[9px] h-4 cursor-pointer ${c.active ? 'border-primary/40 text-primary' : 'border-muted text-muted-foreground'}`}>
                {c.active ? 'ACTIVE' : 'DISABLED'}
              </Badge>
            </button>
            <button onClick={() => deleteCode.mutate(c.id)} className="text-muted-foreground hover:text-destructive">
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <div className="text-[10px] text-muted-foreground tracking-[0.2em]">RESTOCK REQUESTS ({restocks.filter((r) => r.status === 'open').length} OPEN)</div>
        {restocks.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">No restock requests from buyers.</p>
        ) : restocks.map((r) => (
          <div key={r.id} className="p-2.5 rounded border flex items-center gap-3" style={panel}>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-foreground">{r.product_name} {r.code && <span className="text-primary">[{r.code}]</span>}</div>
              <div className="text-[9px] text-muted-foreground truncate">Notify: {r.contact}</div>
            </div>
            {r.status === 'open' ? (
              <Button variant="outline" size="sm" className="h-7 text-[9px] font-mono gap-1" style={border} onClick={() => notifyRestock.mutate(r.id)}>
                <BellRing className="w-3 h-3" /> MARK NOTIFIED
              </Button>
            ) : (
              <Badge variant="outline" className="text-[9px] h-4 border-muted text-muted-foreground">NOTIFIED</Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}