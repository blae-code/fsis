import React from 'react';
import { syncUex } from '@/functions/syncUex';
import { repriceProducts } from '@/functions/repriceProducts';
import { dailyBriefing } from '@/functions/dailyBriefing';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function ProprietorQuickActions() {
  const qc = useQueryClient();
  const done = () => { qc.invalidateQueries({ queryKey: ['price_command'] }); qc.invalidateQueries({ queryKey: ['products_admin'] }); qc.invalidateQueries({ queryKey: ['products'] }); };
  const uex = useMutation({ mutationFn: () => syncUex({}), onSuccess: done });
  const reprice = useMutation({ mutationFn: () => repriceProducts({ margin_percent: 8 }), onSuccess: done });
  const brief = useMutation({ mutationFn: () => dailyBriefing({}), onSuccess: done });
  return (
    <section className="border p-3 space-y-2" style={{ borderColor: '#5C4424', background: '#120D08' }}>
      <div className="text-[9px] tracking-[0.22em]" style={{ color: '#E0A22E' }}>PROPRIETOR QUICK ACTIONS</div>
      <div className="grid sm:grid-cols-3 gap-2">
        <button disabled={uex.isPending} onClick={() => uex.mutate()} className="border px-3 py-2 text-[9px] font-bold disabled:opacity-40" style={{ borderColor: '#8A8F45', color: '#8A8F45' }}>{uex.isPending ? 'SYNCING…' : 'SYNC UEX MARKET'}</button>
        <button disabled={reprice.isPending} onClick={() => reprice.mutate()} className="border px-3 py-2 text-[9px] font-bold disabled:opacity-40" style={{ borderColor: '#C8893B', color: '#E0A22E' }}>{reprice.isPending ? 'REPRICING…' : 'REPRICE CATALOG +8%'}</button>
        <button disabled={brief.isPending} onClick={() => brief.mutate()} className="border px-3 py-2 text-[9px] font-bold disabled:opacity-40" style={{ borderColor: '#5C4424', color: '#D8CFC0' }}>{brief.isPending ? 'DRAFTING…' : 'GENERATE OPS BRIEF'}</button>
      </div>
      {(uex.isSuccess || reprice.isSuccess || brief.isSuccess) && <p className="text-[9px]" style={{ color: '#8A8F45' }}>Command action completed.</p>}
      {(uex.isError || reprice.isError || brief.isError) && <p className="text-[9px]" style={{ color: '#C05050' }}>Action failed — review system diagnostics.</p>}
    </section>
  );
}