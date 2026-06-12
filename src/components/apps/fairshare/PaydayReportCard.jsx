import React from 'react';
import { FileCheck } from 'lucide-react';

const border = { borderColor: 'hsl(33, 18%, 18%)' };
const panel = { ...border, background: 'hsl(30, 10%, 8%)' };

/** Renders a published pay day transparency report */
export default function PaydayReportCard({ cycleName, report }) {
  if (!report) return null;
  const lines = report.lines || [];
  return (
    <div className="p-3 rounded border space-y-2 font-mono" style={panel}>
      <div className="text-[10px] text-muted-foreground tracking-[0.2em] flex items-center gap-1.5">
        <FileCheck className="w-3 h-3 text-primary" /> FINAL REPORT — {cycleName?.toUpperCase()}
      </div>
      <div className="grid grid-cols-3 gap-2 text-[10px]">
        <div><span className="text-muted-foreground">POOL </span><span className="text-primary">{(report.pool_auec || 0).toLocaleString()} aUEC</span></div>
        <div><span className="text-muted-foreground">SHARES </span><span className="text-foreground">{report.total_shares}</span></div>
        <div><span className="text-muted-foreground">VALUE </span><span className="text-primary">{(report.share_value_auec || 0).toLocaleString()} /sh</span></div>
      </div>
      <div className="space-y-1 border-t pt-2" style={border}>
        {lines.map((l) => (
          <div key={l.handle} className="flex justify-between text-[10px]">
            <span className="text-foreground">
              {l.handle}
              {!l.responded && <span className="text-muted-foreground"> (no response — auto-banked)</span>}
            </span>
            <span className="text-muted-foreground">
              {l.shares} sh →{' '}
              {l.decision === 'cash_in'
                ? <span className="text-primary">{(l.payout_auec || 0).toLocaleString()} aUEC paid</span>
                : <span style={{ color: 'hsl(210, 45%, 60%)' }}>banked</span>}
            </span>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[9px] text-muted-foreground border-t pt-1.5" style={border}>
        <span>PAID: <span className="text-primary">{(report.totals?.paid_auec || 0).toLocaleString()} aUEC</span></span>
        <span>BANKED: {report.totals?.banked_shares || 0} sh</span>
        <span>{report.totals?.responders || 0} responded • {report.totals?.non_responders || 0} auto-banked</span>
      </div>
    </div>
  );
}