import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

const box = { borderColor: '#3A2F20', background: '#0C0A07', color: '#EDE5D6' };
const STATUS_COLOR = { owed: '#E0A22E', overdue: '#C05050', paid: '#8A8F45', waived: '#7A6E60', void: '#6B6155' };

/** One debt to the hall, with what it came from shown so the figure can be checked. */
export default function ObligationRow({ obligation: o, pending, onSettle }) {
  const [outcome, setOutcome] = useState('paid');
  const [reason, setReason] = useState('');
  const closed = ['paid', 'waived', 'void'].includes(o.status);
  const needsReason = outcome !== 'paid';
  const daysOver = o.due_at ? Math.floor((Date.now() - new Date(o.due_at).getTime()) / 86400000) : null;

  return (
    <div className="border p-2.5 space-y-2 font-mono" style={{ borderColor: closed ? '#241C12' : '#5C4424', background: '#0B0906' }}>
      <div className="flex items-center gap-2 flex-wrap text-[9px]">
        <span style={{ color: '#EDE5D6' }}>{o.lot_title || 'Untitled lot'}</span>
        <span style={{ color: '#8A7E6C' }}>OWED BY {o.debtor_handle || '—'}</span>
        <span className="font-bold" style={{ color: '#C8A05B' }}>{Number(o.amount_auec || 0).toLocaleString()} aUEC</span>
        <span className="ml-auto font-bold tracking-[0.12em]" style={{ color: STATUS_COLOR[o.status] || '#7A6E60' }}>
          {o.status?.toUpperCase()}
          {!closed && daysOver > 0 ? ` · ${daysOver}D OVERDUE` : ''}
        </span>
      </div>

      <div className="text-[8px] leading-relaxed" style={{ color: '#6B6155' }}>
        {o.commission_percent != null && o.sale_auec != null
          ? `${o.commission_percent}% of a ${Number(o.sale_auec).toLocaleString()} aUEC sale — the rate as it stood when the lot was listed.`
          : 'No sale figure recorded against this debt.'}
        {o.due_at ? ` Due ${new Date(o.due_at).toLocaleDateString()}.` : ''}
        {o.listing_suspended ? ' Listing privileges are presently suspended over this debt.' : ''}
      </div>

      {closed ? (
        <div className="text-[8px]" style={{ color: '#7A6E60' }}>
          {o.status === 'paid'
            ? `Recorded as landed${o.paid_confirmed_by_email ? ` by ${o.paid_confirmed_by_email}` : ''}${o.paid_at ? ` on ${new Date(o.paid_at).toLocaleDateString()}` : ''}. A record of a transfer, not the transfer itself.`
            : o.waived_reason || 'Closed without a reason recorded.'}
        </div>
      ) : (
        <div className="space-y-1.5">
          <div className="flex gap-1.5 flex-wrap">
            {[
              { key: 'paid', label: 'IT LANDED' },
              { key: 'waived', label: 'FORGIVE IT' },
              { key: 'void', label: 'SET IT ASIDE' },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setOutcome(opt.key)}
                className="h-7 px-2.5 border text-[8px] font-bold tracking-[0.12em]"
                style={{
                  borderColor: outcome === opt.key ? '#E0A22E' : '#2E2519',
                  color: outcome === opt.key ? '#E0A22E' : '#7A6E60',
                  background: outcome === opt.key ? '#E0A22E1A' : '#0C0A07',
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {needsReason && (
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Say why — the comrade reads this, and the record carries it"
              className="w-full border px-2 py-1.5 text-[9px]"
              style={box}
            />
          )}
          <p className="text-[8px]" style={{ color: '#6B6155' }}>
            {outcome === 'paid'
              ? 'Payment happens in-game — you are recording that it reached the hall, and your name goes on it.'
              : outcome === 'waived'
                ? 'The debt is forgiven and nothing is held against them. Any suspension lifts at once.'
                : 'The sale this came from was undone, so it was never really owed.'}
          </p>
          <button
            onClick={() => onSettle({ obligation_id: o.id, outcome, reason: reason.trim() })}
            disabled={pending || (needsReason && !reason.trim())}
            className="h-8 px-3 border text-[8px] font-bold tracking-[0.14em] inline-flex items-center gap-1.5 disabled:opacity-40"
            style={{ borderColor: '#E0A22E', color: '#0C0A07', background: 'linear-gradient(135deg, #E0A22E, #C8893B)' }}
          >
            {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : null} RECORD IT — THE COMRADE IS TOLD
          </button>
        </div>
      )}
    </div>
  );
}