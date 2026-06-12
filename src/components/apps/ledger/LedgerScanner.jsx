import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { analyzeLedgerImage } from '@/functions/analyzeLedgerImage';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CATEGORIES } from '@/components/apps/ledger/LedgerEntryForm';
import { ScanLine, Upload, Loader2, Check, X, Wallet } from 'lucide-react';

const today = () => new Date().toISOString().slice(0, 10);

/** AI screenshot scanner — extracts aUEC transactions from in-game screens into the ledger */
export default function LedgerScanner() {
  const queryClient = useQueryClient();
  const fileRef = useRef(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState([]);
  const [committed, setCommitted] = useState(false);

  const scanMutation = useMutation({
    mutationFn: async (file) => {
      setResult(null);
      setCommitted(false);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
      const res = await analyzeLedgerImage({ image_url: file_url });
      return res.data;
    },
    onSuccess: (data) => {
      setResult(data);
      setSelected((data.transactions || []).map((_, i) => i));
    },
  });

  const commitMutation = useMutation({
    mutationFn: () => {
      const rows = (result.transactions || [])
        .filter((_, i) => selected.includes(i))
        .map((t) => ({
          entry_type: t.entry_type,
          category: CATEGORIES[t.category] ? t.category : 'other',
          amount_auec: t.amount_auec,
          description: t.description || '',
          counterparty: t.counterparty || '',
          entry_date: t.entry_date || today(),
          screenshot_url: imageUrl,
          source: 'ocr_scan',
        }));
      return base44.entities.ledger_entry.bulkCreate(rows);
    },
    onSuccess: () => {
      setCommitted(true);
      queryClient.invalidateQueries({ queryKey: ['ledger_entries'] });
    },
  });

  const toggle = (i) =>
    setSelected((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i]));

  return (
    <div className="p-3 space-y-3">
      {/* Upload zone */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && scanMutation.mutate(e.target.files[0])}
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={scanMutation.isPending}
        className="w-full border border-dashed rounded p-6 text-center hover:brightness-125 transition-all disabled:opacity-60"
        style={{ borderColor: 'hsl(33, 25%, 28%)', background: 'hsl(30, 10%, 7%)' }}
      >
        {scanMutation.isPending ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span className="text-[10px] text-muted-foreground">UPLOADING & ANALYZING SCREENSHOT…</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            <span className="text-[10px] text-muted-foreground tracking-[0.15em]">
              DROP A WALLET / TERMINAL / RECEIPT SCREENSHOT — AI EXTRACTS THE TRANSACTIONS
            </span>
          </div>
        )}
      </button>

      {scanMutation.isError && (
        <p className="text-[10px]" style={{ color: 'hsl(0, 55%, 55%)' }}>
          Scan failed — try a clearer screenshot.
        </p>
      )}

      {/* Results */}
      {result && (
        <div className="rounded border" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 8%)' }}>
          <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'hsl(33, 18%, 18%)' }}>
            <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground tracking-[0.2em]">
              <ScanLine className="w-3 h-3" /> EXTRACTED — CONFIDENCE {(result.confidence || 'unknown').toUpperCase()}
            </div>
            {result.wallet_balance != null && (
              <div className="flex items-center gap-1 text-[10px] text-primary font-bold">
                <Wallet className="w-3 h-3" /> BALANCE: {result.wallet_balance.toLocaleString()} aUEC
              </div>
            )}
          </div>

          {result.summary && (
            <p className="px-3 py-2 text-[10px] text-muted-foreground border-b" style={{ borderColor: 'hsl(33, 18%, 14%)' }}>
              {result.summary}
            </p>
          )}

          {(result.transactions || []).length === 0 ? (
            <p className="text-xs text-muted-foreground p-4 text-center">No readable transactions found in this screenshot.</p>
          ) : (
            <>
              {(result.transactions || []).map((t, i) => {
                const isIncome = t.entry_type === 'income';
                const on = selected.includes(i);
                return (
                  <button
                    key={i}
                    onClick={() => !committed && toggle(i)}
                    className="w-full flex items-center gap-3 px-3 py-2 border-b text-left hover:brightness-125 transition-all"
                    style={{ borderColor: 'hsl(33, 18%, 14%)', opacity: on ? 1 : 0.4 }}
                  >
                    <span
                      className="w-4 h-4 rounded-sm border flex items-center justify-center shrink-0"
                      style={{ borderColor: 'hsl(33, 25%, 30%)', background: on ? 'hsl(38, 72%, 52%)' : 'transparent' }}
                    >
                      {on && <Check className="w-3 h-3" style={{ color: 'hsl(30, 15%, 6%)' }} />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-foreground truncate">{t.description || CATEGORIES[t.category] || 'Transaction'}</div>
                      <div className="text-[9px] text-muted-foreground">
                        {CATEGORIES[t.category] || t.category || 'Other'} {t.counterparty && `• ${t.counterparty}`} {t.entry_date && `• ${t.entry_date}`}
                      </div>
                    </div>
                    <span className="text-xs font-bold shrink-0" style={{ color: isIncome ? 'hsl(140, 50%, 50%)' : 'hsl(0, 55%, 55%)' }}>
                      {isIncome ? '+' : '−'}{(t.amount_auec || 0).toLocaleString()}
                    </span>
                  </button>
                );
              })}

              <div className="p-3 flex items-center justify-between">
                <span className="text-[9px] text-muted-foreground">
                  {selected.length} OF {(result.transactions || []).length} SELECTED — SCREENSHOT ATTACHED TO EACH ENTRY
                </span>
                {committed ? (
                  <span className="text-[10px] font-bold inline-flex items-center gap-1" style={{ color: 'hsl(140, 50%, 50%)' }}>
                    <Check className="w-3 h-3" /> LOGGED TO LEDGER
                  </span>
                ) : (
                  <button
                    onClick={() => commitMutation.mutate()}
                    disabled={selected.length === 0 || commitMutation.isPending}
                    className="h-7 px-4 font-mono text-[10px] font-bold inline-flex items-center gap-1.5 disabled:opacity-40 hover:brightness-110 transition-all"
                    style={{ background: 'linear-gradient(180deg, #A87C42, #6E4D24)', color: '#15100A' }}
                  >
                    {commitMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    COMMIT TO LEDGER
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Preview */}
      {imageUrl && result && (
        <img src={imageUrl} alt="Scanned screenshot" className="w-full rounded border" style={{ borderColor: 'hsl(33, 18%, 18%)' }} />
      )}
    </div>
  );
}