import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Calculator, Copy, Check } from 'lucide-react';

const box = { borderColor: '#3A2F20', background: '#0C0A07', color: '#EDE5D6' };

/** Condition takes its cut of the fraction, stated as a factor rather than folded silently into the number. */
const CONDITIONS = [
  { key: 'new', label: 'NEW', factor: 1.0, color: '#6FA05B' },
  { key: 'refurbished', label: 'REFURBISHED', factor: 0.9, color: '#5BA08F' },
  { key: 'used', label: 'USED', factor: 0.75, color: '#C8893B' },
  { key: 'worn', label: 'WORN', factor: 0.55, color: '#C05050' },
];

/**
 * The appraisal, worked in the open.
 *
 * offer = market reference × base fraction × condition factor, plus the client's tier standing as
 * points on the fraction — a tier that earns a discount buying from us earns a better fraction
 * selling to us. Every step is shown, and the message generated says the same working to the client,
 * because a figure whose arithmetic closes on the page is a figure nobody has to take on trust.
 */
export default function AppraisalCard() {
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [market, setMarket] = useState('');
  const [source, setSource] = useState('');
  const [condition, setCondition] = useState('used');
  const [tierName, setTierName] = useState('');
  const [baseFraction, setBaseFraction] = useState(60);
  const [validHours, setValidHours] = useState(72);
  const [copied, setCopied] = useState(false);

  const { data: tiers = [] } = useQuery({
    queryKey: ['pricing_tiers'],
    queryFn: () => base44.entities.pricing_tier.filter({ active: true }),
  });

  const calc = useMemo(() => {
    const cond = CONDITIONS.find((c) => c.key === condition);
    const tier = tiers.find((t) => t.tier_name === tierName);
    const tierBonus = Number(tier?.tier_discount_percent) || 0;
    const base = Math.min(100, Math.max(1, Number(baseFraction) || 60));
    const fraction = Math.min(100, Math.round(base * cond.factor + tierBonus));
    const marketTotal = (Number(market) || 0) * Math.max(1, Number(quantity) || 1);
    const offer = Math.round(marketTotal * fraction / 100);
    return { cond, tier, tierBonus, base, fraction, marketTotal, offer };
  }, [condition, tierName, tiers, baseFraction, market, quantity]);

  const qty = Math.max(1, Number(quantity) || 1);
  const message = useMemo(() => {
    if (!itemName.trim() || calc.offer <= 0) return '';
    const until = new Date(Date.now() + (Number(validHours) || 72) * 3600000);
    return [
      `FSIS BUYBACK OFFER — ${itemName.trim()}${qty > 1 ? ` ×${qty}` : ''} (${calc.cond.label.toLowerCase()})`,
      ``,
      `We offer ${calc.offer.toLocaleString()} aUEC, and here is exactly how the figure was reached:`,
      `- Market reference: ${calc.marketTotal.toLocaleString()} aUEC${source.trim() ? ` (${source.trim()})` : ''}${qty > 1 ? ` — ${(Number(market) || 0).toLocaleString()} each` : ''}`,
      `- Base buyback fraction: ${calc.base}% of market`,
      `- Condition (${calc.cond.label.toLowerCase()}): ×${calc.cond.factor}`,
      calc.tier ? `- Your standing (${calc.tier.tier_name}): +${calc.tierBonus} points on the fraction` : '',
      `- Effective fraction: ${calc.fraction}% of market = ${calc.offer.toLocaleString()} aUEC`,
      ``,
      `Plainly: this is stock bought for resale, and you would very likely get more selling it yourself in the hall. What this offer buys you is certainty and speed — payment settled directly, no waiting on bids.`,
      ``,
      `The offer stands until ${until.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} and no longer; market prices move, and a figure that never expires is one somebody ends up short on.`,
    ].filter(Boolean).join('\n');
  }, [itemName, qty, market, source, calc, validHours]);

  const copy = async () => {
    await navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border p-3 space-y-2" style={{ borderColor: '#5C4424', background: 'linear-gradient(180deg, #14100B, #0B0906)' }}>
      <div className="flex items-center gap-2 text-[9px] tracking-[0.22em]" style={{ color: '#E0A22E' }}>
        <Calculator className="w-3.5 h-3.5" /> APPRAISAL CARD — THE FIGURE, WORKED IN THE OPEN
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <input value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="Item" className="h-9 border px-2 text-[10px] col-span-2" style={box} />
        <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="Qty" className="h-9 border px-2 text-[10px]" style={box} />
        <input type="number" min="0" value={market} onChange={(e) => setMarket(e.target.value)} placeholder="Market each (aUEC)" className="h-9 border px-2 text-[10px]" style={box} />
        <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Source of that figure (e.g. UEX)" className="h-9 border px-2 text-[10px] col-span-2" style={box} />
        <select value={tierName} onChange={(e) => setTierName(e.target.value)} className="h-9 border px-2 text-[10px]" style={box}>
          <option value="">NO TIER STANDING</option>
          {tiers.map((t) => <option key={t.id} value={t.tier_name}>{t.tier_name.toUpperCase()}{Number(t.tier_discount_percent) > 0 ? ` (+${t.tier_discount_percent} PTS)` : ''}</option>)}
        </select>
        <div className="flex gap-1">
          <input type="number" min="1" max="100" value={baseFraction} onChange={(e) => setBaseFraction(e.target.value)} title="Base fraction of market" className="h-9 border px-2 text-[10px] w-1/2" style={box} />
          <input type="number" min="1" value={validHours} onChange={(e) => setValidHours(e.target.value)} title="Offer stands for (hours)" className="h-9 border px-2 text-[10px] w-1/2" style={box} />
        </div>
      </div>

      <div className="flex gap-1">
        {CONDITIONS.map((c) => (
          <button
            key={c.key}
            onClick={() => setCondition(c.key)}
            className="h-8 px-3 border text-[8px] font-bold tracking-[0.12em]"
            style={{
              borderColor: condition === c.key ? c.color : '#2E2519',
              color: condition === c.key ? c.color : '#7A6E60',
              background: condition === c.key ? `${c.color}14` : '#0C0A07',
            }}
          >
            {c.label} ×{c.factor}
          </button>
        ))}
      </div>

      {/* The working, line by line — the same arithmetic the client will read. */}
      <div className="border p-2 space-y-0.5 text-[9px]" style={{ borderColor: '#241C12', background: '#0A0806' }}>
        <div style={{ color: '#8A7E6C' }}>MARKET {calc.marketTotal.toLocaleString()} aUEC{qty > 1 ? ` (${(Number(market) || 0).toLocaleString()} × ${qty})` : ''}</div>
        <div style={{ color: '#8A7E6C' }}>
          FRACTION: {calc.base}% BASE × {calc.cond.factor} {calc.cond.label}
          {calc.tier ? ` + ${calc.tierBonus} PTS ${calc.tier.tier_name.toUpperCase()}` : ''} = <span style={{ color: '#C8A05B' }}>{calc.fraction}%</span>
        </div>
        <div className="text-[13px]" style={{ color: '#E0A22E' }}>OFFER: {calc.offer.toLocaleString()} aUEC</div>
      </div>

      {message && (
        <div className="space-y-1.5">
          <textarea readOnly value={message} rows={9} className="w-full border px-2 py-1.5 text-[9px] leading-relaxed" style={{ ...box, color: '#C6BCAB' }} />
          <button
            onClick={copy}
            className="h-8 px-3 border text-[8px] font-bold tracking-[0.14em] inline-flex items-center gap-1.5"
            style={{ borderColor: '#E0A22E', color: copied ? '#8A8F45' : '#E0A22E', background: '#14100A' }}
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'COPIED — PASTE IT TO THE CLIENT' : 'COPY THE OFFER MESSAGE'}
          </button>
        </div>
      )}
    </div>
  );
}