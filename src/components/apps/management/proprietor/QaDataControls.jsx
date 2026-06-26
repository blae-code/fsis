import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { seedQaData } from '@/functions/seedQaData';
import { cleanupQaData } from '@/functions/cleanupQaData';

export default function QaDataControls() {
  const qc = useQueryClient();
  const done = () => ['products_admin', 'all_orders', 'loot_command', 'ledger_command', 'restock_command', 'discount_codes_command'].forEach((key) => qc.invalidateQueries({ queryKey: [key] }));
  const seed = useMutation({ mutationFn: () => seedQaData({}), onSuccess: done });
  const clean = useMutation({ mutationFn: () => cleanupQaData({}), onSuccess: done });
  return (
    <div className="border p-3" style={{ borderColor: '#2A2118', background: '#100E0B' }}>
      <p className="text-[8px] tracking-[0.24em]" style={{ color: '#E0A22E' }}>PHASE 3 · CONTROLLED QA DATA</p>
      <p className="text-[9px] mt-2" style={{ color: '#A89C8A' }}>Seed or remove clearly labeled QA records across products, orders, loot, ledger, discounts, and restock demand.</p>
      <div className="flex gap-2 mt-3"><button disabled={seed.isPending} onClick={() => seed.mutate()} className="border px-3 py-2 text-[9px] disabled:opacity-40" style={{ borderColor: '#8A8F45', color: '#8A8F45' }}>{seed.isPending ? 'SEEDING…' : 'SEED QA DATA'}</button><button disabled={clean.isPending} onClick={() => clean.mutate()} className="border px-3 py-2 text-[9px] disabled:opacity-40" style={{ borderColor: '#C05050', color: '#C05050' }}>{clean.isPending ? 'CLEANING…' : 'CLEAN QA DATA'}</button></div>
      {(seed.isSuccess || clean.isSuccess) && <p className="text-[8px] mt-2" style={{ color: '#8A8F45' }}>QA data operation completed.</p>}
      {(seed.isError || clean.isError) && <p className="text-[8px] mt-2" style={{ color: '#C05050' }}>QA data operation failed.</p>}
    </div>
  );
}