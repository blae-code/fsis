import React from 'react';
import AssignmentRow from './AssignmentRow';
import { ASPECTS, contractProgress } from './salvageOrchestration';

/** A contract with its trades laid out beneath it, so several hulls can work one job at once. */
export default function ContractOrchestrationCard({ contract, rows, hulls, conflictHulls, onAdd, onUpdate, onDrop }) {
  const p = contractProgress(rows);
  return (
    <div style={{ boxShadow: 'inset 0 0 0 1px #241C14', background: '#0A0806' }}>
      <div className="flex flex-wrap items-baseline gap-2 px-2 py-1.5" style={{ background: 'linear-gradient(180deg,#171009,#0D0A07)' }}>
        <span className="text-[9px] font-bold tracking-[0.16em] truncate" style={{ color: '#F0E7D6' }}>{(contract.title || 'UNTITLED CONTRACT').toUpperCase()}</span>
        <span className="text-[7px] tracking-[0.14em]" style={{ color: '#5F564A' }}>
          {(contract.origin || '—').toUpperCase()} ▸ {(contract.destination || '—').toUpperCase()}
        </span>
        <div className="flex-1 h-px min-w-4" style={{ background: 'linear-gradient(90deg,#3A2F20,transparent)' }} />
        <span className="text-[7px] tabular-nums" style={{ color: '#E0A22E' }}>{(contract.payout_auec || 0).toLocaleString()} aUEC</span>
        <span className="text-[7px] tabular-nums" style={{ color: p.blocked ? '#C05050' : '#5F6B33' }}>
          {p.done}/{p.total} DONE · {p.underway} AFLOAT{p.openSeats ? ` · ${p.openSeats} SEATS OPEN` : ''}
        </span>
      </div>

      <div className="h-[2px]" style={{ background: `linear-gradient(90deg,#E0A22E ${p.pct}%,#1E1811 ${p.pct}%)` }} />

      {rows.length === 0 ? (
        <p className="text-[8px] px-2 py-1.5" style={{ color: '#5F564A' }}>No trades assigned yet. Break the contract into the work it actually takes.</p>
      ) : (
        rows.map((r) => (
          <AssignmentRow
            key={r.id}
            row={r}
            hulls={hulls}
            conflicted={r.status === 'underway' && conflictHulls.includes(r.hull_id)}
            onUpdate={(patch) => onUpdate(r.id, patch)}
            onDrop={() => onDrop(r.id)}
          />
        ))
      )}

      <div className="flex flex-wrap items-center gap-1 px-2 py-1.5" style={{ boxShadow: 'inset 0 1px 0 #1E1811' }}>
        <span className="text-[7px] tracking-[0.18em] mr-1" style={{ color: '#4A4136' }}>ADD TRADE</span>
        {ASPECTS.map((a) => (
          <button
            key={a.id}
            title={a.note}
            onClick={() => onAdd(a.id)}
            className="px-1.5 py-0.5 text-[7px] tracking-[0.14em]"
            style={{ boxShadow: 'inset 0 0 0 1px #2E2519', color: '#8A7E6C' }}
          >
            {a.glyph} {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}