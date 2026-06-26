import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { syncLedgerToSheets } from '@/functions/syncLedgerToSheets';
import { money } from '@/components/apps/management/proprietor/proprietorUtils';

export default function LedgerSyncPanel({ entries }) {
  const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const week = entries.filter((e) => new Date(e.entry_date || e.created_date).getTime() >= since);
  const income = week.filter((e) => e.entry_type === 'income').reduce((s, e) => s + Number(e.amount_auec || 0), 0);
  const expense = week.filter((e) => e.entry_type === 'expense').reduce((s, e) => s + Number(e.amount_auec || 0), 0);
  const sync = useMutation({ mutationFn: () => syncLedgerToSheets({}) });
  const data = sync.data?.data;
  return (
    <section className="border p-3 space-y-2" style={{ borderColor: '#2A2118', background: '#100E0B' }}>
      <div className="text-[9px] tracking-[0.22em]" style={{ color: '#C8893B' }}>LEDGER EXPORT</div>
      <div className="grid grid-cols-3 gap-2 text-center"><div><b style={{ color: '#E0A22E' }}>{week.length}</b><p className="text-[8px]" style={{ color: '#7A6E60' }}>ENTRIES</p></div><div><b style={{ color: '#8A8F45' }}>{money(income)}</b><p className="text-[8px]" style={{ color: '#7A6E60' }}>INCOME</p></div><div><b style={{ color: '#C8893B' }}>{money(expense)}</b><p className="text-[8px]" style={{ color: '#7A6E60' }}>EXPENSE</p></div></div>
      <button disabled={sync.isPending} onClick={() => sync.mutate()} className="w-full border px-3 py-2 text-[9px] font-bold disabled:opacity-40" style={{ borderColor: '#8A8F45', color: '#8A8F45' }}>{sync.isPending ? 'SYNCING…' : 'SYNC WEEK TO SHEETS'}</button>
      {data?.spreadsheet_url && <a href={data.spreadsheet_url} target="_blank" rel="noreferrer" className="block text-[9px] underline" style={{ color: '#E0A22E' }}>Open synced ledger report</a>}
      {sync.isError && <p className="text-[9px]" style={{ color: '#C05050' }}>Ledger sync failed.</p>}
    </section>
  );
}