import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, ListChecks } from 'lucide-react';
import { CHECKLIST_SEED, PATCH_PHASE } from '@/components/apps/management/proprietor/patch49Intel';

const GROUPS = ['BEFORE PATCH', 'PATCH DAY', 'AFTER PATCH'];
const PRIORITY_COLOR = { blocker: '#C05050', important: '#E0A22E', polish: '#8A8F45' };

/** Persisted 4.9 go-live checklist backed by qa_check (phase patch_4.9). */
export default function Patch49ChecklistPanel() {
  const qc = useQueryClient();
  const { data: checks = [], isLoading } = useQuery({
    queryKey: ['patch49_checks'],
    queryFn: () => base44.entities.qa_check.filter({ phase: PATCH_PHASE }),
  });

  const seed = useMutation({
    mutationFn: () => base44.entities.qa_check.bulkCreate(
      CHECKLIST_SEED.map((c) => ({ ...c, phase: PATCH_PHASE, role: 'proprietor', status: 'not_tested' }))
    ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patch49_checks'] }),
  });

  const toggle = useMutation({
    mutationFn: (check) => base44.entities.qa_check.update(check.id, {
      status: check.status === 'pass' ? 'not_tested' : 'pass',
      last_tested_at: new Date().toISOString(),
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patch49_checks'] }),
  });

  const done = checks.filter((c) => c.status === 'pass').length;

  return (
    <section className="border p-3 space-y-2 font-mono" style={{ borderColor: '#2A2118', background: '#100E0B' }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[9px] tracking-[0.22em]" style={{ color: '#C8893B' }}>
          <ListChecks className="w-3.5 h-3.5" /> 4.9 TRANSITION RUNBOOK
        </div>
        {checks.length > 0 && (
          <span className="text-[9px] font-bold" style={{ color: done === checks.length ? '#8A8F45' : '#E0A22E' }}>
            {done}/{checks.length} DONE
          </span>
        )}
      </div>

      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin mx-auto my-4" style={{ color: '#E0A22E' }} />
      ) : checks.length === 0 ? (
        <button
          onClick={() => seed.mutate()}
          disabled={seed.isPending}
          className="w-full border px-3 py-2 text-[9px] font-bold tracking-[0.14em] disabled:opacity-40"
          style={{ borderColor: '#5C4424', color: '#E0A22E', background: '#0C0A07' }}
        >
          {seed.isPending ? 'INITIALIZING…' : 'INITIALIZE 4.9 RUNBOOK'}
        </button>
      ) : GROUPS.map((group) => {
        const rows = checks.filter((c) => c.group === group);
        if (!rows.length) return null;
        return (
          <div key={group} className="space-y-1">
            <div className="text-[8px] tracking-[0.22em]" style={{ color: '#7A6E60' }}>{group}</div>
            {rows.map((c) => (
              <button
                key={c.id}
                onClick={() => toggle.mutate(c)}
                disabled={toggle.isPending}
                className="w-full border px-2.5 py-1.5 flex items-center gap-2 text-left disabled:opacity-60"
                style={{ borderColor: c.status === 'pass' ? '#8A8F4540' : '#3A2F20', background: '#0C0A07' }}
              >
                <span className="w-3.5 h-3.5 border shrink-0 flex items-center justify-center text-[9px]" style={{ borderColor: c.status === 'pass' ? '#8A8F45' : '#5C4424', color: '#8A8F45' }}>
                  {c.status === 'pass' ? '✓' : ''}
                </span>
                <span className="flex-1 text-[10px]" style={{ color: c.status === 'pass' ? '#7A6E60' : '#D8CFC0', textDecoration: c.status === 'pass' ? 'line-through' : 'none' }}>
                  {c.label}
                </span>
                <span className="text-[7px] tracking-[0.14em] shrink-0" style={{ color: PRIORITY_COLOR[c.priority] || '#7A6E60' }}>
                  {c.priority?.toUpperCase()}
                </span>
              </button>
            ))}
          </div>
        );
      })}
    </section>
  );
}