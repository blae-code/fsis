import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Layers, Copy, Check } from 'lucide-react';
import { CONDITIONS, computeOffer, parseHaulLines } from '@/components/apps/management/hall/appraisalMath';

const box = { borderColor: '#3A2F20', background: '#0C0A07', color: '#EDE5D6' };

const EXAMPLE = `Size 2 Quantum Drive | 3 | 42000 | used
Ballistic Cannon S3 | 1 | 88000 | worn
Recycled Material Composite | 24 | 1350`;

/**
 * A whole hold appraised at once.
 *
 * The terms are set once and applied to every line, so a haul cannot be priced on forty slightly
 * different judgements; and every line shows its own working, because a total nobody can take apart
 * is a total the seller has to take on trust.
 */
export default function BulkAppraisalPanel() {
  const [text, setText] = useState('');
  const [baseFraction, setBaseFraction] = useState(60);
  const [tierName, setTierName] = useState('');
  const [validHours, setValidHours] = useState(72);
  const [source, setSource] = useState('');
  const [copied, setCopied] = useState(false);

  const { data: tiers = [] } = useQuery({
    queryKey: ['pricing_tiers'],
    queryFn: () => base44.entities.pricing_tier.filter({ active: true }),
  });

  const tier = tiers.find((t) => t.tier_name === tierName);
  const tierBonus = Number(tier?.tier_discount_percent) || 0;

  const { rows, rejected } = useMemo(() => parseHaulLines(text), [text]);

  const priced = useMemo(
    () => rows.map((r) => ({ ...r, ...computeOffer({ ...r, baseFraction, tierBonus }) })),
    [rows, baseFraction, tierBonus],
  );

  const totals = priced.reduce(
    (a, r) => ({ market: a.market + r.marketTotal, offer: a.offer + r.offer, units: a.units + r.qty }),
    { market: 0, offer: 0, units: 0 },
  );

  const message = useMemo(() => {
    if (priced.length === 0) return '';
    const until = new Date(Date.now() + (Number(validHours) || 72) * 3600000);
    return [
      `FSIS BUYBACK OFFER — ${priced.length} LOTS, ${totals.units} UNITS`,
      ``,
      `We offer ${totals.offer.toLocaleString()} aUEC for the haul. Line by line, so you can check every figure:`,
      ...priced.map((r) =>
        `- ${r.name}${r.qty > 1 ? ` ×${r.qty}` : ''} (${r.cond.label.toLowerCase()}): market ${r.marketTotal.toLocaleString()} aUEC` +
        ` × ${r.fraction}% = ${r.offer.toLocaleString()} aUEC`,
      ),
      ``,
      `The fraction on each line is ${baseFraction}% base × the condition factor` +
        (tier ? ` + ${tierBonus} points for your standing (${tier.tier_name})` : '') + `.`,
      source.trim() ? `Market figures taken from ${source.trim()}.` : '',
      ``,
      `Market reference for the haul: ${totals.market.toLocaleString()} aUEC. Plainly: this is stock bought for resale, and you would very likely get more selling it yourself in the hall, lot by lot. What this offer buys you is certainty and speed — the whole hold cleared at once.`,
      ``,
      `The offer stands until ${until.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} and no longer; market prices move, and a figure that never expires is one somebody ends up short on.`,
    ].filter(Boolean).join('\n');
  }, [priced, totals, validHours, baseFraction, tier, tierBonus, source]);

  const copy = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border p-3 space-y-2" style={{ borderColor: '#5C4424', background: 'linear-gradient(180deg, #14100B, #0B0906)' }}>
      <div className="flex items-center gap-2 text-[9px] tracking-[0.22em]" style={{ color: '#E0A22E' }}>
        <Layers className="w-3.5 h-3.5" /> BULK APPRAISAL — A WHOLE HOLD AT ONCE
      </div>
      <p className="text-[9px] leading-relaxed" style={{ color: '#8A7E6C' }}>
        One line per lot: <span style={{ color: '#C8A05B' }}>item | qty | market each | condition</span>.
        Condition may be left off and is read as used. Nothing is written to the record here — this is
        the figure being worked out, and lines that cannot be read are named individually rather than
        taking the good ones down with them.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <select value={tierName} onChange={(e) => setTierName(e.target.value)} className="h-9 border px-2 text-[10px]" style={box}>
          <option value="">NO TIER STANDING</option>
          {tiers.map((t) => (
            <option key={t.id} value={t.tier_name}>
              {t.tier_name.toUpperCase()}{Number(t.tier_discount_percent) > 0 ? ` (+${t.tier_discount_percent} PTS)` : ''}
            </option>
          ))}
        </select>
        <input type="number" min="1" max="100" value={baseFraction} onChange={(e) => setBaseFraction(e.target.value)} title="Base fraction of market (%)" placeholder="Base fraction %" className="h-9 border px-2 text-[10px]" style={box} />
        <input type="number" min="1" value={validHours} onChange={(e) => setValidHours(e.target.value)} title="Offer stands for (hours)" placeholder="Stands for (hours)" className="h-9 border px-2 text-[10px]" style={box} />
        <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Source of the market figures" className="h-9 border px-2 text-[10px]" style={box} />
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[8px]" style={{ color: '#6B6155' }}>
        {CONDITIONS.map((c) => <span key={c.key} style={{ color: c.color }}>{c.label} ×{c.factor}</span>)}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={7}
        placeholder={EXAMPLE}
        className="w-full border px-2 py-1.5 text-[10px] leading-relaxed"
        style={box}
      />

      {rejected.length > 0 && (
        <div className="border p-2 space-y-0.5" style={{ borderColor: '#5C302A', background: '#140B08' }}>
          <div className="text-[7px] font-bold tracking-[0.18em]" style={{ color: '#D08A6A' }}>
            {rejected.length} LINE{rejected.length === 1 ? '' : 'S'} COULD NOT BE READ — THE REST ARE PRICED BELOW
          </div>
          {rejected.map((r) => (
            <div key={r.lineNo} className="text-[9px]" style={{ color: '#C6A08A' }}>
              LINE {r.lineNo}: {r.reason} <span style={{ color: '#7A6E60' }}>({r.line})</span>
            </div>
          ))}
        </div>
      )}

      {priced.length > 0 && (
        <>
          <div className="border divide-y" style={{ borderColor: '#241C12' }}>
            {priced.map((r) => (
              <div key={r.lineNo} className="flex flex-wrap items-center gap-x-2 px-2 py-1 text-[9px]" style={{ borderColor: '#1C1610' }}>
                <span style={{ color: '#EDE5D6' }}>{r.name}{r.qty > 1 ? ` ×${r.qty}` : ''}</span>
                <span style={{ color: r.cond.color }}>{r.cond.label}</span>
                <span style={{ color: '#8A7E6C' }}>
                  MARKET {r.marketTotal.toLocaleString()}{r.qty > 1 ? ` (${r.marketEach.toLocaleString()} × ${r.qty})` : ''} × {r.fraction}%
                </span>
                <span className="ml-auto" style={{ color: '#E0A22E' }}>{r.offer.toLocaleString()} aUEC</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'LOTS / UNITS', value: `${priced.length} / ${totals.units}`, color: '#6FA0C8' },
              { label: 'MARKET REFERENCE', value: `${totals.market.toLocaleString()}`, color: '#8A7E6C' },
              { label: 'OFFER FOR THE HAUL', value: `${totals.offer.toLocaleString()}`, color: '#E0A22E' },
            ].map((s) => (
              <div key={s.label} className="border p-1.5" style={{ borderColor: '#241C12', background: '#0A0806' }}>
                <div className="text-[7px] tracking-[0.18em]" style={{ color: '#6B6155' }}>{s.label}</div>
                <div className="text-[13px]" style={{ color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <textarea readOnly value={message} rows={9} className="w-full border px-2 py-1.5 text-[9px] leading-relaxed" style={{ ...box, color: '#C6BCAB' }} />
            <button
              onClick={copy}
              className="h-8 px-3 border text-[8px] font-bold tracking-[0.14em] inline-flex items-center gap-1.5"
              style={{ borderColor: '#E0A22E', color: copied ? '#8A8F45' : '#E0A22E', background: '#14100A' }}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'COPIED — PASTE IT TO THE SELLER' : 'COPY THE HAUL OFFER'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}