import React from 'react';

const SIGNAL = { raise: { c: '#5F6B33', g: '▲' }, lower: { c: '#C05050', g: '▼' }, hold: { c: '#8A7E6C', g: '=' } };
const CONFIDENCE = { high: '#5F6B33', medium: '#E0A22E', low: '#C05050' };
const num = (n) => Math.round(Number(n) || 0).toLocaleString();

/** One proposal, with the arithmetic in the open: reference, present price, proposal, why. */
export default function PricingProposalRow({ p, checked, price, onCheck, onPrice }) {
  const sig = SIGNAL[p.signal] || SIGNAL.hold;
  return (
    <div className="p-2 space-y-1" style={{ background: checked ? 'linear-gradient(90deg,#161009,#0A0806)' : '#0A0806', boxShadow: 'inset 0 0 0 1px #241C14' }}>
      <div className="flex items-baseline gap-2">
        <input type="checkbox" checked={checked} onChange={(e) => onCheck(e.target.checked)} className="accent-amber-600" />
        <span className="text-[9px] truncate" style={{ color: '#F0E7D6' }}>{p.product_name}</span>
        {p.code && <span className="text-[7px]" style={{ color: '#6B6155' }}>{p.code}</span>}
        <span className="text-[7px] ml-auto tracking-[0.14em]" style={{ color: CONFIDENCE[p.confidence] || '#8A7E6C' }}>
          {String(p.confidence || '').toUpperCase()} CONFIDENCE
        </span>
      </div>

      <div className="flex flex-wrap items-baseline gap-3 text-[7px] tabular-nums" style={{ color: '#8A7E6C' }}>
        <span>MARKET REF {p.market_ref_auec ? `${num(p.market_ref_auec)}` : '— NONE'}</span>
        <span>NOW {num(p.current_price_auec)}</span>
        <span style={{ color: sig.c }}>{sig.g} PROPOSED {num(p.proposed_price_auec)} ({p.delta_percent > 0 ? '+' : ''}{p.delta_percent}%)</span>
        {p.margin_percent != null && <span>MARGIN {p.margin_percent}%</span>}
        <span>STOCK {p.stock} {p.unit}</span>
        {p.units_sold_recently > 0 && <span>SOLD {p.units_sold_recently}</span>}
        {p.units_awaiting_restock > 0 && <span style={{ color: '#E0A22E' }}>{p.units_awaiting_restock} WAITING</span>}
      </div>

      <p className="text-[7px] leading-relaxed" style={{ color: '#9C9080' }}>{p.reason}</p>
      {p.clamped && (
        <p className="text-[7px]" style={{ color: '#E0A22E' }}>Raised to the yard's floor — the reading came in below what the house will sell for.</p>
      )}

      <div className="flex items-center gap-1.5">
        <span className="text-[7px] tracking-[0.16em]" style={{ color: '#5F564A' }}>SET TO</span>
        <input
          type="number"
          value={price}
          onChange={(e) => onPrice(e.target.value)}
          className="w-28 h-6 border px-1 text-[9px] tabular-nums"
          style={{ borderColor: '#3A2F20', background: '#0B0906', color: '#EDE5D6' }}
        />
        <span className="text-[7px]" style={{ color: '#5F564A' }}>aUEC PER {String(p.unit || 'SCU').toUpperCase()}</span>
        {Number(price) !== p.proposed_price_auec && (
          <button onClick={() => onPrice(String(p.proposed_price_auec))} className="text-[7px] tracking-[0.14em]" style={{ color: '#8A7E6C' }}>
            ↺ BACK TO PROPOSAL
          </button>
        )}
      </div>
    </div>
  );
}