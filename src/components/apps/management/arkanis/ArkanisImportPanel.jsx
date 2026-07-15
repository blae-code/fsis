import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Upload, FileJson, Check, RotateCcw } from 'lucide-react';
import { processArkanisExport } from '@/functions/processArkanisExport';
import ArkanisDiffTable from '@/components/apps/management/arkanis/ArkanisDiffTable';

const AMBER = '#E0A22E';
const GREEN = '#4EBF7A';
const RED = '#C05050';
const DIM = '#5A4A34';

/** Upload an Arkanis overlay export (JSON/CSV), review the diff against the
 *  live catalog, then commit stock updates and new listings in one pass. */
export default function ArkanisImportPanel() {
  const qc = useQueryClient();
  const [file, setFile] = useState(null);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);

  const preview = useMutation({
    mutationFn: async () => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const res = await processArkanisExport({ mode: 'preview', file_url });
      return res.data;
    },
    onSuccess: (data) => {
      setSummary(null);
      setRows(data.rows.map((r) => ({
        ...r,
        include: true,
        action: 'set',
        category: r.match?.category || r.suggested_category,
        price_auec: r.match?.price_auec || 0,
      })));
    },
  });

  const commit = useMutation({
    mutationFn: async () => {
      const approved = rows.filter((r) => r.include).map((r) => ({
        name: r.name,
        quantity: r.quantity,
        action: r.action,
        condition_pct: r.condition_pct,
        location: r.location,
        product_id: r.match?.id || null,
        current_stock: r.match?.stock || 0,
        category: r.category,
        price_auec: r.price_auec,
      }));
      const res = await processArkanisExport({ mode: 'commit', rows: approved });
      return res.data;
    },
    onSuccess: (data) => {
      setSummary(data);
      setRows([]);
      setFile(null);
      qc.invalidateQueries({ queryKey: ['inv_products'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      qc.invalidateQueries({ queryKey: ['products_admin'] });
    },
  });

  const included = rows.filter((r) => r.include);

  return (
    <div className="space-y-3 font-mono">
      <div className="border rounded p-3 space-y-3" style={{ borderColor: `${AMBER}40`, background: `${AMBER}08` }}>
        <div className="flex items-center gap-2 text-[9px] tracking-[0.2em] font-bold" style={{ color: AMBER }}>
          <FileJson className="w-3.5 h-3.5" /> ARKANIS OVERLAY IMPORT
        </div>
        <p className="text-[9px]" style={{ color: '#8A7E6C' }}>
          Log inventory in-game with the Arkanis overlay, export the file, and upload it here. FSIS parses the JSON or CSV,
          matches items against the live catalog, and shows every change for review before anything is committed.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            accept=".json,.csv,.txt,application/json,text/csv"
            onChange={(e) => { setFile(e.target.files?.[0] || null); setRows([]); setSummary(null); }}
            className="text-[10px]"
            style={{ color: '#9C9080' }}
          />
          <button
            onClick={() => preview.mutate()}
            disabled={!file || preview.isPending}
            className="border px-3 py-1.5 text-[9px] font-bold tracking-[0.14em] flex items-center gap-1.5 disabled:opacity-30"
            style={{ borderColor: `${AMBER}60`, color: AMBER, background: '#E0A22E10' }}
          >
            {preview.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
            PARSE FILE
          </button>
          {rows.length > 0 && (
            <>
              <button
                onClick={() => { setRows([]); setSummary(null); }}
                className="border px-2.5 py-1.5 text-[9px] tracking-[0.14em] flex items-center gap-1"
                style={{ borderColor: '#3A2F20', color: DIM }}
              >
                <RotateCcw className="w-3 h-3" /> DISCARD
              </button>
              <button
                onClick={() => commit.mutate()}
                disabled={commit.isPending || included.length === 0}
                className="ml-auto border px-3 py-1.5 text-[9px] font-bold tracking-[0.14em] flex items-center gap-1.5 disabled:opacity-30"
                style={{ borderColor: `${GREEN}60`, color: GREEN, background: `${GREEN}10` }}
              >
                {commit.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                COMMIT {included.length} CHANGE{included.length !== 1 ? 'S' : ''}
              </button>
            </>
          )}
        </div>
        {preview.isError && (
          <p className="text-[9px]" style={{ color: RED }}>
            Parse failed — {preview.error?.response?.data?.error || preview.error?.message || 'check the file and try again'}.
          </p>
        )}
        {commit.isError && (
          <p className="text-[9px]" style={{ color: RED }}>
            Commit failed — {commit.error?.response?.data?.error || commit.error?.message || 'try again'}. Nothing may have been applied.
          </p>
        )}
      </div>

      {summary && (
        <div className="border rounded p-2.5 text-[9px]" style={{ borderColor: `${GREEN}40`, background: `${GREEN}0A`, color: GREEN }}>
          ✓ Arkanis import committed — {summary.updated} stock update{summary.updated !== 1 ? 's' : ''}, {summary.created} new listing{summary.created !== 1 ? 's' : ''}.
          {summary.created > 0 && <span style={{ color: DIM }}> New listings without a price stay hidden from the storefront until priced.</span>}
        </div>
      )}

      {rows.length > 0 && (
        <>
          <div className="flex items-center gap-4 text-[9px]" style={{ color: DIM }}>
            <span>PARSED <span style={{ color: '#EDE5D6' }}>{rows.length}</span> ITEM{rows.length !== 1 ? 'S' : ''}</span>
            <span>MATCHED <span style={{ color: GREEN }}>{rows.filter((r) => r.match).length}</span></span>
            <span>NEW <span style={{ color: AMBER }}>{rows.filter((r) => !r.match).length}</span></span>
          </div>
          <ArkanisDiffTable rows={rows} setRows={setRows} />
          <p className="text-[8px] text-center pb-2" style={{ color: '#3A2A14' }}>
            SET replaces stock with the counted value · ADD increments existing stock · uncheck rows to skip them · every import is written to the ops log
          </p>
        </>
      )}
    </div>
  );
}