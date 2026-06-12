import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { analyzeLedgerImage } from '@/functions/analyzeLedgerImage';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScanLine, Loader2, Upload, CheckCircle2, Wallet } from 'lucide-react';
import { CATEGORIES } from '@/components/apps/ledger/LedgerEntryForm';

const VALID_CATEGORIES = Object.keys(CATEGORIES);

/** OCR capture: screenshot of a wallet / receipt / kiosk screen → reviewed ledger entries */
export default function LedgerScan() {
  const queryClient = useQueryClient();
  const fileRef = useRef(null);
  const [phase, setPhase] = useState('idle'); // idle | uploading | analyzing | review | logging | done
  const [imageUrl, setImageUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState('');

  const handleFile = async (file) => {
    if (!file) return;
    setError('');
    setResult(null);
    setPhase('uploading');
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
      setPhase('analyzing');
      const res = await analyzeLedgerImage({ image_url: file_url });
      const data = res.data;
      if (data.status !== 'success') throw new Error(data.error || 'Analysis failed');
      setResult(data);
      setSelected((data.transactions || []).map((_, i) => i));
      setPhase('review');
    } catch (e) {
      setError(e.message || 'Scan failed — try a clearer screenshot.');
      setPhase('idle');
    }
  };

  const logSelected = async () => {
    setPhase('logging');
    const txs = (result.transactions || []).filter((_, i) => selected.includes(i));
    await base44.entities.ledger_entry.bulkCreate(
      txs.map((t, i) => ({
        entry_type: t.entry_type,
        category: VALID_CATEGORIES.includes(t.category) ? t.category : 'other',
        amount_auec: t.amount_auec,
        description: t.description || 'OCR-captured transaction',
        counterparty: t.counterparty || '',
        entry_date: t.entry_date || new Date().toISOString().slice(0, 10),
        screenshot_url: imageUrl,
        source: 'ocr_scan',
        ...(i === 0 && result.wallet_balance ? { balance_after: result.wallet_balance } : {}),
      }))
    );
    queryClient.invalidateQueries({ queryKey: ['ledger_entries'] });
    setPhase('done');
  };

  const reset = () => {
    setPhase('idle');
    setResult(null);
    setImageUrl(null);
    setError('');
  };

  return (
    <div className="p-3 space-y-3">
      <div className="text-[9px] text-muted-foreground tracking-[0.2em]">
        OCR TRANSACTION CAPTURE — WALLET, SELL RECEIPT, KIOSK, FINE SCREENS
      </div>

      {(phase === 'idle' || phase === 'uploading' || phase === 'analyzing') && (
        <button
          onClick={() => phase === 'idle' && fileRef.current?.click()}
          disabled={phase !== 'idle'}
          className="w-full rounded border border-dashed p-8 text-center hover:bg-secondary/30 transition-colors"
          style={{ borderColor: 'hsl(33, 18%, 24%)' }}
        >
          {phase === 'idle' ? (
            <>
              <Upload className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Drop or click to upload an in-game screenshot of any aUEC transaction.</p>
            </>
          ) : (
            <>
              <Loader2 className="w-5 h-5 mx-auto mb-2 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground">
                {phase === 'uploading' ? 'Uploading screenshot…' : 'Reading screen — extracting transactions…'}
              </p>
            </>
          )}
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {error && <p className="text-[10px]" style={{ color: 'hsl(0, 55%, 55%)' }}>{error}</p>}

      {(phase === 'review' || phase === 'logging' || phase === 'done') && result && (
        <div className="space-y-3">
          <div className="flex gap-3">
            <img src={imageUrl} alt="Scanned screenshot" className="w-32 h-20 object-cover rounded border shrink-0" style={{ borderColor: 'hsl(33, 18%, 18%)' }} />
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[8px] h-4">CONFIDENCE: {result.confidence?.toUpperCase()}</Badge>
                {result.wallet_balance > 0 && (
                  <span className="inline-flex items-center gap-1 text-[9px] text-primary">
                    <Wallet className="w-2.5 h-2.5" /> BALANCE READ: {result.wallet_balance.toLocaleString()} aUEC
                  </span>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">{result.summary}</p>
            </div>
          </div>

          {phase === 'done' ? (
            <div className="rounded border p-4 text-center" style={{ borderColor: 'hsl(140, 50%, 30%)', background: 'hsl(140, 30%, 8%)' }}>
              <CheckCircle2 className="w-4 h-4 mx-auto mb-1" style={{ color: 'hsl(140, 50%, 50%)' }} />
              <p className="text-xs" style={{ color: 'hsl(140, 50%, 50%)' }}>{selected.length} transaction(s) logged with screenshot evidence.</p>
              <Button variant="outline" size="sm" className="h-7 mt-2 text-[10px] font-mono" onClick={reset}>Scan Another</Button>
            </div>
          ) : (
            <>
              {(result.transactions || []).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No transactions could be read from this screenshot.</p>
              ) : (
                <div className="space-y-1.5">
                  {(result.transactions || []).map((t, i) => {
                    const checked = selected.includes(i);
                    const isIncome = t.entry_type === 'income';
                    return (
                      <button
                        key={i}
                        onClick={() => setSelected((s) => (checked ? s.filter((x) => x !== i) : [...s, i]))}
                        className="w-full flex items-center gap-3 rounded border px-3 py-2 text-left transition-colors"
                        style={{
                          borderColor: checked ? 'hsl(38, 50%, 35%)' : 'hsl(33, 18%, 18%)',
                          background: checked ? 'hsl(35, 20%, 10%)' : 'hsl(30, 10%, 8%)',
                          opacity: checked ? 1 : 0.5,
                        }}
                      >
                        <span className="w-1 self-stretch rounded-full shrink-0" style={{ background: isIncome ? 'hsl(140, 50%, 45%)' : 'hsl(0, 55%, 50%)' }} />
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
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="h-8 font-mono text-[10px] gap-1.5"
                  disabled={selected.length === 0 || phase === 'logging'}
                  onClick={logSelected}
                >
                  {phase === 'logging' ? <Loader2 className="w-3 h-3 animate-spin" /> : <ScanLine className="w-3 h-3" />}
                  LOG {selected.length} SELECTED
                </Button>
                <Button variant="outline" size="sm" className="h-8 font-mono text-[10px]" onClick={reset}>Discard</Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}