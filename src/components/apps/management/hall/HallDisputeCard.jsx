import React, { useState } from 'react';
import { Loader2, Gavel } from 'lucide-react';

const box = { borderColor: '#3A2F20', background: '#0C0A07', color: '#EDE5D6' };

/** Each remedy is something the hall can actually do. There is deliberately no refund remedy. */
const REMEDIES = [
  { value: 'no_action', label: 'NO ACTION', says: 'The complaint does not stand; the trade is left as it was.' },
  { value: 'relist', label: 'RELIST', says: 'The sale is set aside; the seller may relist at no further cost.' },
  { value: 'void_sale', label: 'VOID THE SALE', says: 'The sale is void and nothing is owed to the hall on it.' },
  { value: 'commission_waived', label: 'WAIVE COMMISSION', says: 'The sale stands; the hall takes nothing on it.' },
  { value: 'settled_between', label: 'SETTLED BETWEEN THEM', says: 'The parties sorted it out themselves; the record says so.' },
];

const KIND_LABEL = {
  non_delivery: 'ITEM NEVER CAME',
  not_as_described: 'NOT AS DESCRIBED',
  vanished: 'PARTY VANISHED',
  payment_not_received: 'PAYMENT NOT RECEIVED',
  other: 'OTHER',
};

/** One dispute in front of an Owner: both accounts, the remedy, and — separately — standing. */
export default function HallDisputeCard({ dispute, pending, onRule }) {
  const [remedy, setRemedy] = useState('no_action');
  const [ruling, setRuling] = useState('');
  const [touchesStanding, setTouchesStanding] = useState(false);
  const [markedUserId, setMarkedUserId] = useState('');

  const ruled = dispute.status === 'ruled';
  const chosen = REMEDIES.find((r) => r.value === remedy);

  return (
    <div className="border p-2.5 space-y-2" style={{ borderColor: ruled ? '#2E2519' : '#5C302A', background: '#0C0A07' }}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[11px] truncate" style={{ color: '#EDE5D6' }}>{dispute.lot_title}</div>
          <div className="text-[8px]" style={{ color: '#7A6E60' }}>
            {KIND_LABEL[dispute.kind] || dispute.kind?.toUpperCase()} · {dispute.raised_by_handle} AGAINST {dispute.against_handle || 'UNKNOWN'}
            {dispute.raised_at ? ` · ${new Date(dispute.raised_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}` : ''}
          </div>
        </div>
        <span
          className="px-1.5 py-0.5 border text-[7px] font-bold tracking-[0.14em] shrink-0"
          style={ruled ? { borderColor: '#8A8F4555', color: '#8A8F45' } : { borderColor: '#D08A6A55', color: '#D08A6A' }}
        >
          {ruled ? 'RULED' : 'AWAITING RULING'}
        </span>
      </div>

      <div className="border p-2 space-y-1" style={{ borderColor: '#241C12', background: '#0A0806' }}>
        <div className="text-[7px] font-bold tracking-[0.18em]" style={{ color: '#6B6155' }}>WHAT {dispute.raised_by_handle?.toUpperCase()} SAYS HAPPENED</div>
        <p className="text-[9px] leading-relaxed whitespace-pre-wrap" style={{ color: '#C6BCAB' }}>{dispute.account}</p>
        {dispute.evidence_url && (
          <a href={dispute.evidence_url} target="_blank" rel="noreferrer" className="text-[8px] underline" style={{ color: '#6FA0C8' }}>
            EVIDENCE LINKED
          </a>
        )}
      </div>

      {ruled ? (
        <div className="border p-2 space-y-1" style={{ borderColor: '#2E3A20', background: '#0D110A' }}>
          <div className="text-[7px] font-bold tracking-[0.18em]" style={{ color: '#8A8F45' }}>
            {(REMEDIES.find((r) => r.value === dispute.remedy)?.label) || dispute.remedy?.toUpperCase()}
            {dispute.touches_standing ? ' · A STANDING MARK WAS RECORDED' : ' · NO MARK ON EITHER PARTY'}
          </div>
          <p className="text-[9px] leading-relaxed whitespace-pre-wrap" style={{ color: '#C6BCAB' }}>{dispute.ruling}</p>
          <div className="text-[8px]" style={{ color: '#6B6155' }}>
            RULED BY {dispute.ruled_by_email}{dispute.ruled_at ? ` · ${new Date(dispute.ruled_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}` : ''}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid sm:grid-cols-2 gap-2">
            <select value={remedy} onChange={(e) => setRemedy(e.target.value)} className="h-9 border px-2 text-[10px]" style={box}>
              {REMEDIES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <p className="text-[8px] leading-relaxed self-center" style={{ color: '#8A7E6C' }}>{chosen?.says}</p>
          </div>
          <textarea
            value={ruling}
            onChange={(e) => setRuling(e.target.value)}
            rows={3}
            placeholder="Your reasoning, in full. Both parties will read it — the one it goes against is owed it most."
            className="w-full border px-2 py-1.5 text-[10px]"
            style={box}
          />

          {/* Standing is a separate, deliberate decision — never implied by the remedy chosen. */}
          <div className="border p-2 space-y-1.5" style={{ borderColor: '#3A2F20', background: '#0F0C08' }}>
            <label className="flex items-start gap-2 text-[9px] leading-relaxed" style={{ color: '#C8A05B' }}>
              <input
                type="checkbox"
                checked={touchesStanding}
                onChange={(e) => { setTouchesStanding(e.target.checked); if (!e.target.checked) setMarkedUserId(''); }}
                className="mt-0.5"
              />
              This ruling touches trade standing. Decided apart from the remedy — most disputes are two
              comrades describing the same evening differently, and nothing is marked by default.
            </label>
            {touchesStanding && (
              <select value={markedUserId} onChange={(e) => setMarkedUserId(e.target.value)} className="h-9 w-full border px-2 text-[10px]" style={box}>
                <option value="">Whose standing does it touch?</option>
                <option value={dispute.raised_by_user_id}>{dispute.raised_by_handle} (who raised it)</option>
                {dispute.against_user_id && <option value={dispute.against_user_id}>{dispute.against_handle} (complained of)</option>}
              </select>
            )}
          </div>

          <button
            onClick={() => onRule({ dispute_id: dispute.id, remedy, ruling: ruling.trim(), touches_standing: touchesStanding, marked_user_id: markedUserId })}
            disabled={pending || !ruling.trim() || (touchesStanding && !markedUserId)}
            className="h-8 px-3 border text-[8px] font-bold tracking-[0.14em] inline-flex items-center gap-1.5 disabled:opacity-40"
            style={{ borderColor: '#E0A22E', color: '#0C0A07', background: 'linear-gradient(135deg, #E0A22E, #C8893B)' }}
          >
            {pending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Gavel className="w-3 h-3" />} RULE — BOTH PARTIES ARE TOLD IN FULL
          </button>
        </div>
      )}
    </div>
  );
}