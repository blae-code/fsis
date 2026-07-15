import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, ClipboardCheck, RotateCcw, Check, FileSpreadsheet } from 'lucide-react';
import { exportInventoryAuditToSheets } from '@/functions/exportInventoryAuditToSheets';

const AMBER = '#E0A22E';
const GREEN = '#4EBF7A';
const RED   = '#C05050';
const DIM   = '#5A4A34';

/** Audit mode — walk the physical stock, enter counted quantities,
 *  review variances, then apply all corrections in one pass. */
export default function InventoryAuditMode({ products }) {
  const [counts, setCounts] = useState({});
  const [applied, setApplied] = useState(null);
  const queryClient = useQueryClient();

  const rows = products.filter((p) => p.category !== 'service');
  const entered = (p) => counts[p.id] !== undefined && counts[p.id] !== '';
  const countedRows = rows.filter(entered);
  const changes = countedRows
    .map((p) => ({ id: p.id, name: p.product_name, unit: p.unit || 'SCU', from: Number(p.stock || 0), to: Math.max(0, Number(counts[p.id]) || 0) }))
    .filter((c) => c.from !== c.to);

  const apply = useMutation({
    mutationFn: async () => {
      // Sequential updates so restock side effects (reserve allocation) fire per item
      for (const c of changes) {
        await base44.entities.product.update(c.id, { stock: c.to });
      }
      await base44.entities.ops_log.create({
        action: 'inventory.audit_applied',
        entity_type: 'product',
        entity_name: 'Physical stock audit',
        actor: 'proprietor',
        notes: `Physical count audit — ${changes.length} correction(s) across ${countedRows.length} counted item(s)`,
        before: Object.fromEntries(changes.map((c) => [c.name, c.from])),
        after: Object.fromEntries(changes.map((c) => [c.name, c.to])),
      });
      return changes;
    },
    onSuccess: (done) => {
      setApplied(done);
      setCounts({});
      queryClient.invalidateQueries({ queryKey: ['inv_products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const exportSheet = useMutation({
    mutationFn: async () => {
      const payload = rows.map((p) => {
        const recorded = Number(p.stock || 0);
        const hasCount = entered(p);
        const counted = hasCount ? Math.max(0, Number(counts[p.id]) || 0) : null;
        return {
          name: p.product_name,
          code: p.code || '',
          category: (p.category || '').replace(/_/g, ' '),
          unit: p.unit || 'SCU',
          recorded,
          counted,
          variance: hasCount ? counted - recorded : null,
          status: hasCount ? (counted === recorded ? 'OK' : 'VARIANCE') : 'PENDING',
        };
      });
      const res = await exportInventoryAuditToSheets({ rows: payload });
      return res.data;
    },
  });

  const setCount = (id, value) => {
    setApplied(null);
    setCounts((c) => ({ ...c, [id]: value }));
  };

  return (
    <div className="space-y-3 font-mono">
      {/* Audit summary bar */}
      <div className="border rounded p-3 flex flex-wrap items-center gap-x-5 gap-y-2" style={{ borderColor: `${AMBER}40`, background: `${AMBER}0A` }}>
        <span className="flex items-center gap-2 text-[9px] tracking-[0.2em] font-bold" style={{ color: AMBER }}>
          <ClipboardCheck className="w-3.5 h-3.5" /> AUDIT MODE
        </span>
        <span className="text-[9px]" style={{ color: DIM }}>
          COUNTED <span style={{ color: '#EDE5D6' }}>{countedRows.length}</span> / {rows.length}
        </span>
        <span className="text-[9px]" style={{ color: DIM }}>
          CORRECTIONS <span style={{ color: changes.length ? AMBER : '#EDE5D6' }}>{changes.length}</span>
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => { setCounts({}); setApplied(null); }}
            disabled={apply.isPending || countedRows.length === 0}
            className="border px-2.5 py-1.5 text-[9px] tracking-[0.14em] flex items-center gap-1 disabled:opacity-30"
            style={{ borderColor: '#3A2F20', color: DIM }}
          >
            <RotateCcw className="w-3 h-3" /> RESET
          </button>
          <button
            onClick={() => exportSheet.mutate()}
            disabled={exportSheet.isPending || rows.length === 0}
            className="border px-2.5 py-1.5 text-[9px] font-bold tracking-[0.14em] flex items-center gap-1.5 disabled:opacity-30"
            style={{ borderColor: '#5C442460', color: AMBER, background: '#E0A22E10' }}
          >
            {exportSheet.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <FileSpreadsheet className="w-3 h-3" />}
            EXPORT TO SHEETS
          </button>
          <button
            onClick={() => apply.mutate()}
            disabled={apply.isPending || changes.length === 0}
            className="border px-3 py-1.5 text-[9px] font-bold tracking-[0.14em] flex items-center gap-1.5 disabled:opacity-30"
            style={{ borderColor: `${GREEN}60`, color: GREEN, background: `${GREEN}10` }}
          >
            {apply.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            APPLY {changes.length > 0 ? `${changes.length} CORRECTION${changes.length !== 1 ? 'S' : ''}` : 'CORRECTIONS'}
          </button>
        </div>
      </div>

      {exportSheet.isSuccess && (
        <div className="border rounded p-2.5 text-[9px] flex items-center justify-between gap-2" style={{ borderColor: `${GREEN}40`, background: `${GREEN}0A`, color: GREEN }}>
          <span>✓ Exported {exportSheet.data?.rows_exported} row{exportSheet.data?.rows_exported !== 1 ? 's' : ''} to Google Sheets.</span>
          <a href={exportSheet.data?.spreadsheet_url} target="_blank" rel="noreferrer" className="border px-2 py-1 font-bold tracking-[0.12em] hover:brightness-125" style={{ borderColor: `${GREEN}60`, color: GREEN }}>
            OPEN SHEET
          </a>
        </div>
      )}
      {exportSheet.isError && (
        <div className="border rounded p-2.5 text-[9px]" style={{ borderColor: `${RED}40`, color: RED }}>
          Sheets export failed — {exportSheet.error?.response?.data?.error || exportSheet.error?.message || 'try again'}.
        </div>
      )}

      {applied && (
        <div className="border rounded p-2.5 text-[9px]" style={{ borderColor: `${GREEN}40`, background: `${GREEN}0A`, color: GREEN }}>
          ✓ Audit applied — {applied.length} listing{applied.length !== 1 ? 's' : ''} synced to physical count.
          {applied.length > 0 && (
            <span style={{ color: DIM }}> {applied.map((c) => `${c.name} ${c.from}→${c.to}`).join(' · ')}</span>
          )}
        </div>
      )}
      {apply.isError && (
        <div className="border rounded p-2.5 text-[9px]" style={{ borderColor: `${RED}40`, color: RED }}>
          Audit apply failed — {apply.error?.message || 'try again'}. Already-applied corrections were saved.
        </div>
      )}

      {/* Count sheet */}
      <div className="space-y-1">
        {rows.length === 0 ? (
          <p className="text-[10px] text-center py-8" style={{ color: DIM }}>No countable wares match the current filters.</p>
        ) : rows.map((p) => {
          const recorded = Number(p.stock || 0);
          const hasCount = entered(p);
          const counted = hasCount ? Math.max(0, Number(counts[p.id]) || 0) : null;
          const variance = hasCount ? counted - recorded : null;
          const vColor = variance === 0 ? GREEN : variance > 0 ? AMBER : RED;
          return (
            <div key={p.id} className="border rounded px-3 py-2 flex items-center gap-3" style={{ borderColor: hasCount ? `${vColor}35` : 'hsl(33,18%,14%)', background: 'hsl(30,10%,7%)' }}>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] truncate" style={{ color: '#EDE5D6' }}>
                  {p.product_name} {p.code && <span className="text-[8px] px-1 rounded" style={{ background: '#3A2A14', color: AMBER }}>{p.code}</span>}
                </div>
                <div className="text-[8px]" style={{ color: DIM }}>{p.unit || 'SCU'} · {p.category?.replace(/_/g, ' ').toUpperCase()}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[7px] tracking-[0.18em]" style={{ color: DIM }}>RECORDED</div>
                <div className="text-xs font-bold" style={{ color: '#9C9080' }}>{recorded.toLocaleString()}</div>
              </div>
              <div className="shrink-0 flex items-center gap-1.5">
                <div>
                  <div className="text-[7px] tracking-[0.18em]" style={{ color: AMBER }}>COUNTED</div>
                  <input
                    type="number" min="0" placeholder="—"
                    value={counts[p.id] ?? ''}
                    onChange={(e) => setCount(p.id, e.target.value)}
                    className="h-7 w-20 px-2 text-xs font-bold bg-transparent border rounded outline-none"
                    style={{ borderColor: hasCount ? `${vColor}60` : '#3A2F20', color: '#EDE5D6' }}
                  />
                </div>
                <button
                  onClick={() => setCount(p.id, String(recorded))}
                  title="Confirm count matches records"
                  className="border rounded px-1.5 h-7 text-[8px] tracking-[0.1em] mt-3"
                  style={{ borderColor: '#3A2F20', color: DIM }}
                >
                  MATCH
                </button>
              </div>
              <div className="w-16 text-right shrink-0">
                {hasCount ? (
                  <span className="text-[10px] font-bold" style={{ color: vColor }}>
                    {variance === 0 ? '✓ OK' : `${variance > 0 ? '+' : ''}${variance.toLocaleString()}`}
                  </span>
                ) : (
                  <span className="text-[9px]" style={{ color: '#3A2A14' }}>PENDING</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[8px] text-center pb-2" style={{ color: '#3A2A14' }}>
        Enter physical counts (or press MATCH when records are correct) · corrections apply only to items with a variance · every audit is logged to the ops log
      </p>
    </div>
  );
}