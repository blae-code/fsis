import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { syncUex } from '@/functions/syncUex';
import { repriceProducts } from '@/functions/repriceProducts';
import { dailyBriefing } from '@/functions/dailyBriefing';

export default function MobileCommandRail() {
  const qc = useQueryClient();
  const done = () => ['price_command', 'products_admin', 'products', 'ops_logs_command'].forEach((key) => qc.invalidateQueries({ queryKey: [key] }));
  const market = useMutation({ mutationFn: () => syncUex({}), onSuccess: done });
  const reprice = useMutation({ mutationFn: () => repriceProducts({ margin_percent: 8 }), onSuccess: done });
  const brief = useMutation({ mutationFn: () => dailyBriefing({}), onSuccess: done });
  const busy = market.isPending || reprice.isPending || brief.isPending;
  return (
    <div className="xl:hidden sticky bottom-2 z-20 border p-2 grid grid-cols-3 gap-2" style={{ borderColor: '#5C4424', background: 'rgba(12,10,7,0.96)' }}>
      <button disabled={busy} onClick={() => market.mutate()} className="border py-2 text-[8px] font-bold disabled:opacity-40" style={{ borderColor: '#8A8F45', color: '#8A8F45' }}>UEX SYNC</button>
      <button disabled={busy} onClick={() => reprice.mutate()} className="border py-2 text-[8px] font-bold disabled:opacity-40" style={{ borderColor: '#C8893B', color: '#E0A22E' }}>REPRICE</button>
      <button disabled={busy} onClick={() => brief.mutate()} className="border py-2 text-[8px] font-bold disabled:opacity-40" style={{ borderColor: '#3A2F20', color: '#D8CFC0' }}>BRIEF</button>
    </div>
  );
}