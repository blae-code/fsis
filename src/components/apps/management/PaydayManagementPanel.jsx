import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import PaydayCycleAdmin from '@/components/apps/fairshare/PaydayCycleAdmin';

const money = (v) => `${(Number(v) || 0).toLocaleString()} aUEC`;

export default function PaydayManagementPanel() {
  const { data: cycles = [] } = useQuery({ queryKey: ['payday_cycles_management'], queryFn: () => base44.entities.payday_cycle.list('-created_date', 20) });
  const active = cycles.find((c) => c.status === 'open') || cycles[0];
  const { data: elections = [] } = useQuery({ queryKey: ['payday_elections_management', active?.id], queryFn: () => base44.entities.payday_election.filter({ cycle_id: active.id }), enabled: !!active?.id });
  const { data: ledger = [] } = useQuery({ queryKey: ['ledger_payday_management'], queryFn: () => base44.entities.ledger_entry.list('-entry_date', 200) });
  const relatedLedger = active ? ledger.filter((e) => String(e.description || '').includes(active.id) || e.category === 'crew_pay' || (active.opens_at && (e.entry_date || '') >= active.opens_at.slice(0, 10))).slice(0, 12) : ledger.slice(0, 8);
  const cashIn = elections.filter((e) => e.decision === 'cash_in').length;
  const defer = elections.filter((e) => e.decision === 'defer').length;
  return (
    <div className="p-4 space-y-4 font-mono" style={{ background: '#0A0806' }}>
      <section className="border p-3" style={{ borderColor: '#5C4424', background: '#120D08' }}>
        <p className="text-[9px] tracking-[0.24em]" style={{ color: '#E0A22E' }}>PAYDAY CYCLE MANAGEMENT</p>
        <p className="text-[10px] mt-1" style={{ color: '#A89C8A' }}>Open the cycle, review contractor elections and ledger entries, then close the cycle to publish payouts.</p>
        <div className="grid md:grid-cols-4 gap-2 mt-3">
          <div className="border p-2" style={{ borderColor: '#3A2F20' }}><b className="text-[9px]" style={{ color: '#D8CFC0' }}>{active?.cycle_name || 'No cycle yet'}</b><p className="text-[8px]" style={{ color: '#8A7E6C' }}>{active?.status || 'ready to open'}</p></div>
          <div className="border p-2" style={{ borderColor: '#3A2F20' }}><b className="text-[9px]" style={{ color: '#E0A22E' }}>{money(active?.pool_auec)}</b><p className="text-[8px]" style={{ color: '#8A7E6C' }}>cycle pool</p></div>
          <div className="border p-2" style={{ borderColor: '#3A2F20' }}><b className="text-[9px]" style={{ color: '#8A8F45' }}>{cashIn} cash-in · {defer} defer</b><p className="text-[8px]" style={{ color: '#8A7E6C' }}>submitted elections</p></div>
          <div className="border p-2" style={{ borderColor: '#3A2F20' }}><b className="text-[9px]" style={{ color: '#C8893B' }}>{relatedLedger.length}</b><p className="text-[8px]" style={{ color: '#8A7E6C' }}>ledger entries reviewed</p></div>
        </div>
      </section>
      <div className="grid xl:grid-cols-[1.1fr_0.9fr] gap-4">
        <div className="border" style={{ borderColor: '#2A2118', background: '#0E0C09' }}><PaydayCycleAdmin /></div>
        <section className="border p-3 space-y-3" style={{ borderColor: '#2A2118', background: '#0E0C09' }}>
          <p className="text-[9px] tracking-[0.2em]" style={{ color: '#E0A22E' }}>LEDGER ENTRIES FOR CURRENT CYCLE</p>
          {relatedLedger.length ? relatedLedger.map((e) => <div key={e.id} className="border p-2" style={{ borderColor: '#3A2F20', background: '#0A0806' }}><div className="flex justify-between gap-2"><b className="text-[9px]" style={{ color: e.entry_type === 'income' ? '#8A8F45' : '#C05050' }}>{e.category || e.entry_type}</b><span className="text-[9px]" style={{ color: '#E0A22E' }}>{money(e.amount_auec)}</span></div><p className="text-[8px] mt-1" style={{ color: '#A89C8A' }}>{e.description || e.counterparty || 'Ledger entry'}</p><p className="text-[8px]" style={{ color: '#7A6E60' }}>{e.entry_date || e.created_date?.slice(0, 10)}</p></div>) : <p className="text-[10px]" style={{ color: '#8A7E6C' }}>No ledger entries found for this cycle yet.</p>}
        </section>
      </div>
    </div>
  );
}