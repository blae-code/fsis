import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Coins, ChevronDown, ChevronRight } from 'lucide-react';

const AMBER = '#E0A22E';
const DIM = '#7A6E60';
const PANEL = { borderColor: '#2E2519', background: '#0C0A07' };

const SERVES_LABEL = {
  order: 'ORDER', cargo_lot: 'CARGO LOT', operation: 'OPERATION',
  fab_project: 'FABRICATION', work_order: 'WORK ORDER', none: 'UNATTRIBUTED',
};

const STATUS_COLOR = { posted: '#7A6E60', claimed: '#C8A05B', submitted: '#8A8F45', returned: '#D08A6A' };

/**
 * What the collective still owes for labour, gathered by the thing the labour served.
 * Credited work is settled and shown apart; everything not yet credited or cancelled is an
 * obligation the yard is carrying, so a half-done job is never read as a paid cost.
 */
export default function LabourCostPanel() {
  const [open, setOpen] = useState(null);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['labour_tasks_cost'],
    queryFn: () => base44.entities.labour_task.list('-created_date', 500),
  });

  const projects = useMemo(() => {
    const map = new Map();
    tasks.forEach((t) => {
      const type = t.serves_type || 'none';
      const key = `${type}:${t.serves_id || 'none'}`;
      if (!map.has(key)) {
        map.set(key, { key, type, name: t.serves_name || SERVES_LABEL[type] || type, owed: 0, settled: 0, outstanding: [], settledCount: 0, hands: new Set() });
      }
      const p = map.get(key);
      if (t.status === 'credited') {
        p.settled += Number(t.credited_auec) || 0;
        p.settledCount += 1;
      } else if (t.status !== 'cancelled') {
        p.owed += Number(t.agreed_credit_auec) || 0;
        p.outstanding.push(t);
      }
      (t.crew || []).forEach((c) => c.handle && !c.released_at && p.hands.add(c.handle));
      if (t.assigned_handle) p.hands.add(t.assigned_handle);
    });
    return [...map.values()].filter((p) => p.owed > 0 || p.settled > 0).sort((a, b) => b.owed - a.owed);
  }, [tasks]);

  const totalOwed = projects.reduce((s, p) => s + p.owed, 0);
  const totalSettled = projects.reduce((s, p) => s + p.settled, 0);
  const awaitingReview = tasks.filter((t) => t.status === 'submitted').length;

  return (
    <div className="space-y-3 font-mono">
      <div className="flex items-center gap-2 text-[9px] tracking-[0.22em]" style={{ color: AMBER }}>
        <Coins className="w-3.5 h-3.5" /> LABOUR COST — WHAT IS STILL OWED
      </div>
      <p className="text-[9px] leading-relaxed max-w-3xl" style={{ color: '#8A7E6C' }}>
        Every task names what it served, so the obligation can be stated plainly by project: these hands,
        this much agreed and not yet settled. Credited work is shown apart because it is already paid —
        it is here so a lot is never priced as though it made itself.
      </p>

      <div className="grid sm:grid-cols-3 gap-2">
        {[
          { label: 'OUTSTANDING TO CREW', value: `${totalOwed.toLocaleString()} aUEC`, color: AMBER },
          { label: 'SETTLED TO DATE', value: `${totalSettled.toLocaleString()} aUEC`, color: '#8A8F45' },
          { label: 'FILED, AWAITING CREDIT', value: `${awaitingReview}`, color: awaitingReview ? '#D08A6A' : DIM },
        ].map((k) => (
          <div key={k.label} className="border p-2" style={PANEL}>
            <div className="text-[8px] tracking-[0.2em]" style={{ color: DIM }}>{k.label}</div>
            <div className="text-sm font-bold mt-0.5" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin" style={{ color: AMBER }} /></div>
      ) : projects.length === 0 ? (
        <p className="text-[9px] py-3 text-center border" style={{ ...PANEL, color: '#6B6155' }}>
          No labour recorded against any project yet.
        </p>
      ) : (
        <div className="border divide-y" style={{ borderColor: '#241C12' }}>
          {projects.map((p) => {
            const expanded = open === p.key;
            return (
              <div key={p.key} style={{ borderColor: '#1C1610' }}>
                <button
                  onClick={() => setOpen(expanded ? null : p.key)}
                  className="w-full flex items-center gap-2 px-2 py-2 text-left"
                >
                  {expanded ? <ChevronDown className="w-3 h-3 shrink-0" style={{ color: AMBER }} /> : <ChevronRight className="w-3 h-3 shrink-0" style={{ color: DIM }} />}
                  <span className="text-[9px] tracking-[0.14em] shrink-0" style={{ color: '#8A7E6C' }}>{SERVES_LABEL[p.type] || p.type}</span>
                  <span className="text-[10px] truncate" style={{ color: '#EDE5D6' }}>{p.name}</span>
                  <span className="ml-auto flex items-center gap-3 shrink-0 text-[8px]">
                    <span style={{ color: DIM }}>{p.hands.size} HAND(S)</span>
                    <span style={{ color: '#8A8F45' }}>SETTLED {p.settled.toLocaleString()}</span>
                    <span className="font-bold" style={{ color: p.owed ? AMBER : DIM }}>OWED {p.owed.toLocaleString()} aUEC</span>
                  </span>
                </button>
                {expanded && (
                  <div className="px-3 pb-2 space-y-1">
                    {p.outstanding.length === 0 ? (
                      <p className="text-[8px]" style={{ color: DIM }}>Nothing outstanding — all labour on this project is settled.</p>
                    ) : p.outstanding.map((t) => (
                      <div key={t.id} className="flex items-center gap-2 text-[8px]">
                        <span style={{ color: '#D8CFC0' }}>{t.title}</span>
                        <span style={{ color: STATUS_COLOR[t.status] || DIM }}>{String(t.status).toUpperCase()}</span>
                        {t.assigned_handle && <span style={{ color: DIM }}>{t.assigned_handle}</span>}
                        <span className="ml-auto font-bold" style={{ color: AMBER }}>
                          {(Number(t.agreed_credit_auec) || 0).toLocaleString()} aUEC
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}