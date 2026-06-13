import React, { useState } from 'react';
import { auditLedger } from '@/functions/auditLedger';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, Loader2, AlertTriangle, TrendingUp, Lightbulb, Target } from 'lucide-react';

const SEVERITY_COLOR = {
  high: 'hsl(0, 55%, 55%)',
  medium: 'hsl(42, 60%, 50%)',
  low: 'hsl(35, 12%, 52%)',
};

/** AI audit: anomaly detection, pattern analysis and recommendations over the ledger */
export default function LedgerAudit() {
  const [phase, setPhase] = useState('idle'); // idle | running | done
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  const run = async () => {
    setPhase('running');
    setError('');
    try {
      const res = await auditLedger({});
      if (res.data.status !== 'success') throw new Error(res.data.error || 'Audit failed');
      setReport(res.data);
      setPhase('done');
    } catch (e) {
      setError(e.message);
      setPhase('idle');
    }
  };

  return (
    <div className="p-3 space-y-3 font-mono">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[9px] text-muted-foreground tracking-[0.2em]">
          FSIS.BOT FINANCIAL AUDIT — ANOMALIES, PATTERNS, RECOMMENDATIONS
        </div>
        <Button size="sm" className="h-7 text-[10px] font-mono gap-1.5" onClick={run} disabled={phase === 'running'}>
          {phase === 'running' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bot className="w-3 h-3" />}
          {phase === 'running' ? 'AUDITING…' : 'RUN AUDIT'}
        </Button>
      </div>

      {error && <p className="text-[10px]" style={{ color: 'hsl(0, 55%, 55%)' }}>{error}</p>}

      {phase === 'idle' && !report && (
        <div className="text-center py-10">
          <Bot className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
          <p className="text-xs text-muted-foreground px-6">
            Run an AI audit of the ledger — FSIS.bot reviews up to 300 recent transactions for duplicates, outliers, spending patterns, and profitability opportunities.
          </p>
        </div>
      )}

      {report?.empty && (
        <p className="text-xs text-muted-foreground text-center py-6">No ledger entries to audit yet.</p>
      )}

      {phase === 'done' && report && !report.empty && (
        <div className="space-y-3">
          {/* Health */}
          <div className="rounded border p-3" style={{ borderColor: 'hsl(38, 50%, 30%)', background: 'hsl(35, 20%, 8%)' }}>
            <div className="text-[9px] text-primary tracking-[0.2em] mb-1">HEALTH ASSESSMENT — {report.audited_count} ENTRIES REVIEWED</div>
            <p className="text-xs text-foreground">{report.health}</p>
            {report.category_callout && (
              <p className="text-[10px] text-muted-foreground mt-1.5 flex items-start gap-1.5">
                <Target className="w-3 h-3 shrink-0 mt-0.5 text-primary" /> {report.category_callout}
              </p>
            )}
          </div>

          {/* Anomalies */}
          <div>
            <div className="text-[9px] text-muted-foreground tracking-[0.2em] mb-1.5 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> ANOMALIES ({(report.anomalies || []).length})
            </div>
            {(report.anomalies || []).length === 0 ? (
              <p className="text-[10px]" style={{ color: 'hsl(140, 50%, 50%)' }}>No anomalies detected — ledger is clean.</p>
            ) : (
              <div className="space-y-1.5">
                {report.anomalies.map((a, i) => (
                  <div key={i} className="rounded border px-3 py-2 flex items-start gap-2" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 8%)' }}>
                    <Badge variant="outline" className="text-[8px] h-4 shrink-0 mt-0.5" style={{ color: SEVERITY_COLOR[a.severity], borderColor: SEVERITY_COLOR[a.severity] }}>
                      {a.severity?.toUpperCase()}
                    </Badge>
                    <div className="min-w-0">
                      <div className="text-[11px] text-foreground">{a.entry}</div>
                      <div className="text-[10px] text-muted-foreground">{a.issue}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Patterns + recommendations */}
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <div className="text-[9px] text-muted-foreground tracking-[0.2em] mb-1.5 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> PATTERNS
              </div>
              <ul className="space-y-1">
                {(report.patterns || []).map((p, i) => (
                  <li key={i} className="text-[10px] text-foreground flex gap-1.5">
                    <span className="text-primary shrink-0">▸</span> {p}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="text-[9px] text-muted-foreground tracking-[0.2em] mb-1.5 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" /> RECOMMENDATIONS
              </div>
              <ul className="space-y-1">
                {(report.recommendations || []).map((r, i) => (
                  <li key={i} className="text-[10px] text-foreground flex gap-1.5">
                    <span className="text-primary shrink-0">▸</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}