import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { advisePricing } from '@/functions/advisePricing';
import FormRow, { FormBand } from '@/components/apps/management/ops/fleet/FormRow';
import PricingProposalRow from './PricingProposalRow';

const CONTROL = { borderColor: '#3A2F20', background: '#0B0906', color: '#EDE5D6' };
const STANCES = [
  { id: 'clear_stock', label: 'CLEAR STOCK', note: 'Move what is sitting idle, margin second' },
  { id: 'balanced', label: 'BALANCED', note: 'Neither chasing volume nor holding out' },
  { id: 'hold_value', label: 'HOLD VALUE', note: 'Protect margin, accept slower sales' },
];

/**
 * The pricing desk. It reads the market, the shelf and the order book, proposes a price
 * per ware with the reason stated plainly, and writes nothing until it is approved —
 * a price the yard cannot explain to a buyer is a price it cannot defend.
 */
export default function PricingAdvisorPanel() {
  const qc = useQueryClient();
  const [stance, setStance] = useState('balanced');
  const [floor, setFloor] = useState(5);
  const [result, setResult] = useState(null);
  const [checked, setChecked] = useState({});
  const [edits, setEdits] = useState({});

  const advise = useMutation({
    mutationFn: async () => {
      const res = await advisePricing({ stance, floor_margin_percent: Number(floor) || 0 });
      return res.data;
    },
    onSuccess: (data) => {
      setResult(data);
      setChecked(Object.fromEntries((data.proposals || []).filter((p) => p.signal !== 'hold').map((p) => [p.id, true])));
      setEdits(Object.fromEntries((data.proposals || []).map((p) => [p.id, String(p.proposed_price_auec)])));
    },
  });

  const apply = useMutation({
    mutationFn: async () => {
      const now = new Date().toISOString();
      const rows = (result?.proposals || [])
        .filter((p) => checked[p.id])
        .map((p) => ({
          id: p.id,
          price_auec: Number(edits[p.id]) || p.proposed_price_auec,
          market_ref_auec: p.market_ref_auec || undefined,
          margin_percent: p.margin_percent ?? undefined,
          repriced_at: now,
        }));
      if (!rows.length) return { applied: 0 };
      await base44.entities.product.bulkUpdate(rows);
      return { applied: rows.length };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['products_admin'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      setResult(null);
      setChecked({});
    },
  });

  const proposals = result?.proposals || [];
  const selected = proposals.filter((p) => checked[p.id]);

  return (
    <div className="space-y-3 font-mono">
      <FormBand glyph="✦" title="PRICING DESK" note="The desk proposes; the proprietor decides. Nothing on the storefront changes until a line is approved below.">
        <FormRow label="STANCE" hint={STANCES.find((s) => s.id === stance)?.note.toUpperCase()}>
          <select value={stance} onChange={(e) => setStance(e.target.value)} className="h-7 border px-2 text-[9px]" style={CONTROL}>
            {STANCES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </FormRow>
        <FormRow label="FLOOR MARGIN %" hint="THE HOUSE WILL NOT SELL BELOW THIS OVER MARKET">
          <input type="number" value={floor} onChange={(e) => setFloor(e.target.value)} className="h-7 border px-2 text-[9px]" style={CONTROL} />
        </FormRow>
      </FormBand>

      <div className="flex flex-wrap items-center gap-2">
        <button
          disabled={advise.isPending}
          onClick={() => advise.mutate()}
          className="px-3 py-2 text-[8px] font-bold tracking-[0.2em] disabled:opacity-40"
          style={{ boxShadow: 'inset 0 0 0 1px #8A8F45', color: '#8A8F45', background: '#0D0A07' }}
        >
          {advise.isPending ? 'READING THE MARKET…' : 'READ THE CATALOGUE'}
        </button>
        {proposals.length > 0 && (
          <>
            <button
              disabled={apply.isPending || !selected.length}
              onClick={() => apply.mutate()}
              className="px-3 py-2 text-[8px] font-bold tracking-[0.2em] disabled:opacity-40"
              style={{ boxShadow: 'inset 0 0 0 1px #8A6430', color: '#E0A22E', background: 'linear-gradient(180deg,#1B1309,#0D0A07)' }}
            >
              {apply.isPending ? 'WRITING…' : `APPROVE ${selected.length} PRICE${selected.length === 1 ? '' : 'S'}`}
            </button>
            <button onClick={() => setChecked(Object.fromEntries(proposals.map((p) => [p.id, true])))} className="text-[7px] tracking-[0.16em]" style={{ color: '#8A7E6C' }}>SELECT ALL</button>
            <button onClick={() => setChecked({})} className="text-[7px] tracking-[0.16em]" style={{ color: '#8A7E6C' }}>CLEAR</button>
          </>
        )}
      </div>

      {advise.isError && <p className="text-[8px]" style={{ color: '#C05050' }}>The reading failed. No price was touched — try again.</p>}
      {apply.isError && <p className="text-[8px]" style={{ color: '#C05050' }}>The prices did not save. Nothing was written — try again.</p>}
      {apply.isSuccess && <p className="text-[8px]" style={{ color: '#8A8F45' }}>Approved — the storefront now shows the new prices.</p>}

      {result?.summary && (
        <p className="text-[8px] leading-relaxed p-2" style={{ color: '#9C9080', boxShadow: 'inset 0 0 0 1px #241C14' }}>
          <span className="tracking-[0.2em]" style={{ color: '#E0A22E' }}>THE DESK'S READING · </span>{result.summary}
        </p>
      )}

      {proposals.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-baseline gap-2">
            <span className="text-[7px] font-bold tracking-[0.24em]" style={{ color: '#EDE5D6' }}>PROPOSALS</span>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg,#3A2F20,transparent)' }} />
            <span className="text-[7px] tabular-nums" style={{ color: '#5F564A' }}>{proposals.length} OF {result.considered} WARES READ</span>
          </div>
          {proposals.map((p) => (
            <PricingProposalRow
              key={p.id}
              p={p}
              checked={Boolean(checked[p.id])}
              price={edits[p.id] ?? String(p.proposed_price_auec)}
              onCheck={(on) => setChecked((prev) => ({ ...prev, [p.id]: on }))}
              onPrice={(v) => setEdits((prev) => ({ ...prev, [p.id]: v }))}
            />
          ))}
        </div>
      )}

      {!proposals.length && !advise.isPending && (
        <p className="text-[8px]" style={{ color: '#5F564A' }}>
          Read the catalogue to get a proposed price per ware, each with the market reference, the stock on hand, what has
          sold, and one plain sentence saying why.
        </p>
      )}
    </div>
  );
}