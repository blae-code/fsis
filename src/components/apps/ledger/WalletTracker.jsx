import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Wallet, AlertTriangle, CheckCircle2, Camera } from 'lucide-react';

/** Wallet balance tracker — plots OCR/manually captured balance readings and
 *  reconciles the latest reading against the ledger's computed net movement. */
export default function WalletTracker({ entries }) {
  const readings = entries
    .filter((e) => e.balance_after > 0)
    .map((e) => ({
      date: (e.entry_date || e.created_date || '').slice(0, 10),
      balance: e.balance_after,
      desc: e.description,
      screenshot: e.screenshot_url,
      created: e.created_date,
    }))
    .sort((a, b) => (a.created || a.date).localeCompare(b.created || b.date));

  if (readings.length === 0) {
    return (
      <div className="text-center py-12 font-mono">
        <Wallet className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
        <p className="text-xs text-muted-foreground px-6">
          No wallet balance readings yet — OCR-scan a mobiGlas wallet screenshot and the balance will be tracked here.
        </p>
      </div>
    );
  }

  const latest = readings[readings.length - 1];

  // Reconciliation: net ledger movement since the latest reading's entry
  const sinceLatest = entries.filter(
    (e) => (e.created_date || '') > (latest.created || '') && !(e.balance_after > 0)
  );
  const netSince = sinceLatest.reduce(
    (s, e) => s + (e.entry_type === 'income' ? 1 : -1) * (e.amount_auec || 0), 0
  );
  const expected = latest.balance + netSince;

  return (
    <div className="p-3 space-y-3 font-mono">
      {/* Current position */}
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded border p-3" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 8%)' }}>
          <div className="text-[9px] text-muted-foreground tracking-[0.2em] mb-1">LAST VERIFIED BALANCE</div>
          <div className="text-lg text-primary xian-glow-subtle">{latest.balance.toLocaleString()} <span className="text-[10px]">aUEC</span></div>
          <div className="text-[9px] text-muted-foreground flex items-center gap-1.5">
            {latest.date}
            {latest.screenshot && (
              <a href={latest.screenshot} target="_blank" rel="noopener noreferrer" className="hover:text-primary" title="View evidence screenshot">
                <Camera className="w-2.5 h-2.5" />
              </a>
            )}
          </div>
        </div>
        <div className="rounded border p-3" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 8%)' }}>
          <div className="text-[9px] text-muted-foreground tracking-[0.2em] mb-1">EXPECTED NOW (LEDGER)</div>
          <div className="text-lg text-foreground">{expected.toLocaleString()} <span className="text-[10px]">aUEC</span></div>
          <div className="text-[9px] flex items-center gap-1" style={{ color: sinceLatest.length === 0 ? 'hsl(140, 50%, 50%)' : 'hsl(42, 60%, 50%)' }}>
            {sinceLatest.length === 0 ? (
              <><CheckCircle2 className="w-2.5 h-2.5" /> RECONCILED</>
            ) : (
              <><AlertTriangle className="w-2.5 h-2.5" /> {sinceLatest.length} ENTRIES SINCE READING — RESCAN WALLET TO VERIFY</>
            )}
          </div>
        </div>
      </div>

      {/* Balance history */}
      <div className="text-[9px] text-muted-foreground tracking-[0.2em]">
        WALLET BALANCE HISTORY — {readings.length} VERIFIED READINGS
      </div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={readings} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(33, 18%, 14%)" />
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(35, 12%, 52%)', fontFamily: 'JetBrains Mono' }} />
            <YAxis tick={{ fontSize: 9, fill: 'hsl(35, 12%, 52%)', fontFamily: 'JetBrains Mono' }} width={70}
              tickFormatter={(v) => v.toLocaleString()} domain={['auto', 'auto']} />
            <Tooltip
              contentStyle={{ background: 'hsl(30, 10%, 8%)', border: '1px solid hsl(33, 18%, 18%)', fontFamily: 'JetBrains Mono', fontSize: 10 }}
              formatter={(v) => [`${v.toLocaleString()} aUEC`, 'Balance']}
            />
            <Line type="stepAfter" dataKey="balance" stroke="hsl(42, 85%, 60%)" strokeWidth={2}
              dot={{ r: 3, fill: 'hsl(42, 85%, 60%)' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}