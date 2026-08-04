import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { TicketPercent, Trash2, BellRing } from 'lucide-react';
import { C, panel, plate, notch, actionBtn, quietBtn } from '@/components/console/theme';

const inputStyle = { borderColor: '#3A2F20', background: '#0A0806', color: C.bone };

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
    <div className="space-y-4 font-mono">
      <div className="p-3 border space-y-2" style={{ ...plate, ...notch(8) }}>
        <div className="text-[9px] tracking-[0.22em] flex items-center gap-2" style={{ color: C.amber }}>
          <TicketPercent className="w-3.5 h-3.5" /> ISSUE PRIVATE DISCOUNT CODE
        </div>
        <p className="text-[9px]" style={{ color: C.dim }}>Codes are only visible here in the proprietor console; the public storefront accepts issued codes without publishing them.</p>
        <div className="grid grid-cols-[8rem_1fr_4.5rem_auto] gap-2">
          <Input placeholder="CODE" value={code} onChange={(e) => setCode(e.target.value)} className="h-8 text-xs uppercase font-mono" style={inputStyle} />
          <Input placeholder="Label, e.g. Redscar Nomads org rate" value={label} onChange={(e) => setLabel(e.target.value)} className="h-8 text-xs" style={inputStyle} />
          <Input type="number" min="0" max="100" placeholder="%" value={percent} onChange={(e) => setPercent(e.target.value)} className="h-8 text-xs" style={inputStyle} />
          <button
            className="h-8 px-3 border text-[9px] font-bold tracking-[0.14em] hover:brightness-125 disabled:opacity-40"
            style={actionBtn}
            disabled={!code || !percent || createMutation.isPending}
            onClick={() => createMutation.mutate()}>
            ISSUE
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="text-[9px] tracking-[0.22em]" style={{ color: C.dim }}>ACTIVE CODES ({codes.length})</div>
        {codes.length === 0 ? (
          <p className="text-xs py-4 text-center" style={{ color: C.dim }}>No discount codes issued.</p>
        ) : codes.map((c) => (
          <div key={c.id} className="p-2.5 border flex items-center gap-3" style={panel}>
            <div className="flex-1 min-w-0">
              <div className="text-xs" style={{ color: C.amber }}>{c.code}</div>
              <div className="text-[9px] truncate" style={{ color: C.dim }}>{c.label || '—'} • {c.discount_percent}% off • {c.uses || 0} redemption{(c.uses || 0) === 1 ? '' : 's'}</div>
            </div>
            <button onClick={() => updateCode.mutate({ id: c.id, data: { active: !c.active } })} title="Toggle active">
              <span
                className="text-[8px] font-bold tracking-[0.12em] px-2 py-0.5 border cursor-pointer"
                style={c.active
                  ? { borderColor: `${C.green}55`, color: C.green, background: `${C.green}10` }
                  : { borderColor: '#3A2F20', color: C.dim, background: '#0A0806' }}
              >
                {c.active ? '● ACTIVE' : '○ DISABLED'}
              </span>
            </button>
            <button onClick={() => deleteCode.mutate(c.id)} className="opacity-30 hover:opacity-70" style={{ color: C.red }}>
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <div className="text-[9px] tracking-[0.22em]" style={{ color: C.dim }}>RESTOCK REQUESTS ({restocks.filter((r) => r.status === 'open').length} OPEN)</div>
        {restocks.length === 0 ? (
          <p className="text-xs py-4 text-center" style={{ color: C.dim }}>No restock requests from buyers.</p>
        ) : restocks.map((r) => (
          <div key={r.id} className="p-2.5 border flex items-center gap-3" style={panel}>
            <div className="flex-1 min-w-0">
              <div className="text-xs" style={{ color: C.parchment }}>{r.product_name} {r.code && <span style={{ color: C.amber }}>[{r.code}]</span>}</div>
              <div className="text-[9px] truncate" style={{ color: C.dim }}>Notify: {r.contact}</div>
            </div>
            {r.status === 'open' ? (
              <button
                className="h-7 px-2.5 border text-[9px] font-bold tracking-[0.12em] flex items-center gap-1 hover:brightness-125"
                style={actionBtn}
                onClick={() => notifyRestock.mutate(r.id)}>
                <BellRing className="w-3 h-3" /> MARK NOTIFIED
              </button>
            ) : (
              <span className="text-[8px] font-bold tracking-[0.12em] px-2 py-0.5 border" style={quietBtn}>NOTIFIED</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}