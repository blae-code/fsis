import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { offerBuyback } from '@/functions/offerBuyback';
import { Loader2, HandCoins } from 'lucide-react';
import AppraisalCard from '@/components/apps/management/hall/AppraisalCard';

const box = { borderColor: '#3A2F20', background: '#0C0A07', color: '#EDE5D6' };
const ITEM_TYPES = ['ship_component', 'vehicle_component', 'fps_gear', 'weapon', 'bulk_cargo', 'other'];
const STATUS_COLOR = { offered: '#E0A22E', accepted: '#8A8F45', declined: '#7A6E60', expired: '#6B6155', withdrawn: '#C05050' };

const EMPTY = {
  seller_user_id: '', item_name: '', item_type: 'other', condition_grade: '', quantity: 1,
  market_reference_auec: '', market_reference_source: '', fraction_percent: 60, offer_auec: '', valid_hours: 72, appraisal_notes: '',
};

/**
 * The appraisal desk: FSIS buys a member's gear outright, at an openly-stated fraction of market.
 * The fraction is a field, never arithmetic hidden inside a number — the member is told plainly
 * they would likely get more in the hall, because what they are buying here is certainty and speed.
 */
export default function BuybackDesk() {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const { data: users = [] } = useQuery({ queryKey: ['all_users'], queryFn: () => base44.entities.User.list('-created_date', 200) });
  const { data: offers = [], isLoading } = useQuery({
    queryKey: ['buyback_offers'],
    queryFn: () => base44.entities.buyback_offer.list('-created_date', 60),
    refetchInterval: 30000,
  });

  const offer = useMutation({
    mutationFn: () => offerBuyback({
      seller_user_id: form.seller_user_id,
      item_name: form.item_name.trim(),
      item_type: form.item_type,
      condition_grade: form.condition_grade.trim(),
      quantity: Math.max(1, Number(form.quantity) || 1),
      market_reference_auec: Number(form.market_reference_auec) || 0,
      market_reference_source: form.market_reference_source.trim(),
      fraction_percent: Number(form.fraction_percent) || 60,
      ...(Number(form.offer_auec) > 0 ? { offer_auec: Number(form.offer_auec) } : {}),
      valid_hours: Number(form.valid_hours) || 72,
      appraisal_notes: form.appraisal_notes.trim(),
    }).then((r) => r.data),
    onSuccess: () => { setForm(EMPTY); qc.invalidateQueries({ queryKey: ['buyback_offers'] }); },
  });

  const preview = Number(form.offer_auec) > 0
    ? Number(form.offer_auec)
    : Math.round((Number(form.market_reference_auec) || 0) * (Number(form.fraction_percent) || 60) / 100);
  const err = offer.error?.response?.data?.error || offer.error?.message;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-[9px] tracking-[0.22em]" style={{ color: '#E0A22E' }}>
        <HandCoins className="w-3.5 h-3.5" /> BUYBACK — THE APPRAISAL DESK
      </div>
      <p className="text-[9px] leading-relaxed max-w-3xl" style={{ color: '#8A7E6C' }}>
        Stock bought for resale, at a fraction stated on its face. The offer tells the member outright
        they would likely get more in the hall — if the fraction is one we would be embarrassed to show,
        that is a fact about the fraction. The market figure and its source are recorded so the offer can
        be checked later against the market as it stood.
      </p>

      <AppraisalCard />

      <div className="border p-3 space-y-2" style={{ borderColor: '#5C4424', background: 'linear-gradient(180deg, #14100B, #0B0906)' }}>
        <div className="grid sm:grid-cols-3 gap-2">
          <select value={form.seller_user_id} onChange={(e) => set('seller_user_id', e.target.value)} className="h-9 border px-2 text-[10px]" style={box}>
            <option value="">Whose gear is being bought?</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.handle || u.full_name || u.email}</option>)}
          </select>
          <input value={form.item_name} onChange={(e) => set('item_name', e.target.value)} placeholder="What is being bought" className="h-9 border px-2 text-[10px]" style={box} />
          <select value={form.item_type} onChange={(e) => set('item_type', e.target.value)} className="h-9 border px-2 text-[10px]" style={box}>
            {ITEM_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ').toUpperCase()}</option>)}
          </select>
          <input value={form.condition_grade} onChange={(e) => set('condition_grade', e.target.value)} placeholder="Condition (new/refurbished/used/worn)" className="h-9 border px-2 text-[10px]" style={box} />
          <input type="number" min="1" value={form.quantity} onChange={(e) => set('quantity', e.target.value)} placeholder="Quantity" className="h-9 border px-2 text-[10px]" style={box} />
          <input type="number" min="0" value={form.market_reference_auec} onChange={(e) => set('market_reference_auec', e.target.value)} placeholder="Market reference (aUEC)" className="h-9 border px-2 text-[10px]" style={box} />
          <input value={form.market_reference_source} onChange={(e) => set('market_reference_source', e.target.value)} placeholder="Where that figure came from" className="h-9 border px-2 text-[10px]" style={box} />
          <input type="number" min="1" max="100" value={form.fraction_percent} onChange={(e) => set('fraction_percent', e.target.value)} placeholder="Fraction of market (%)" className="h-9 border px-2 text-[10px]" style={box} />
          <input type="number" min="0" value={form.offer_auec} onChange={(e) => set('offer_auec', e.target.value)} placeholder="Or state a figure outright (aUEC)" className="h-9 border px-2 text-[10px]" style={box} />
          <input type="number" min="1" value={form.valid_hours} onChange={(e) => set('valid_hours', e.target.value)} placeholder="Offer stands for (hours)" className="h-9 border px-2 text-[10px]" style={box} />
          <textarea value={form.appraisal_notes} onChange={(e) => set('appraisal_notes', e.target.value)} rows={2} placeholder="How you reached the figure — the member reads this" className="border px-2 py-1.5 text-[10px] sm:col-span-2" style={box} />
        </div>
        {preview > 0 && (
          <p className="text-[9px]" style={{ color: '#C8A05B' }}>
            THE OFFER AS THE MEMBER WILL READ IT: {preview.toLocaleString()} aUEC
            {Number(form.offer_auec) > 0 ? ' (stated outright)' : ` — ${form.fraction_percent}% of ${(Number(form.market_reference_auec) || 0).toLocaleString()} aUEC market`}
          </p>
        )}
        {err && <p className="text-[9px]" style={{ color: '#D08A6A' }}>{err}</p>}
        <button
          onClick={() => offer.mutate()}
          disabled={offer.isPending || !form.seller_user_id || !form.item_name.trim()}
          className="h-9 px-4 border text-[9px] font-bold tracking-[0.14em] inline-flex items-center gap-2 disabled:opacity-40"
          style={{ borderColor: '#E0A22E', color: '#0C0A07', background: 'linear-gradient(135deg, #E0A22E, #C8893B)' }}
        >
          {offer.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <HandCoins className="w-3 h-3" />} MAKE THE OFFER — THE MEMBER IS TOLD IN FULL
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin" style={{ color: '#E0A22E' }} /></div>
      ) : offers.length === 0 ? (
        <p className="text-[9px] py-3 text-center border" style={{ color: '#6B6155', borderColor: '#2E2519' }}>No buyback offers on record.</p>
      ) : (
        <div className="border divide-y" style={{ borderColor: '#241C12' }}>
          {offers.map((o) => (
            <div key={o.id} className="flex items-center gap-2 px-2 py-1.5 flex-wrap text-[8px]" style={{ borderColor: '#1C1610' }}>
              <span style={{ color: '#EDE5D6' }}>{o.item_name}{o.quantity > 1 ? ` ×${o.quantity}` : ''}</span>
              <span style={{ color: '#8A7E6C' }}>TO {o.seller_handle}</span>
              <span style={{ color: '#C8A05B' }}>{Number(o.offer_auec).toLocaleString()} aUEC ({o.fraction_percent}% OF MARKET)</span>
              <span className="ml-auto font-bold tracking-[0.12em]" style={{ color: STATUS_COLOR[o.status] || '#7A6E60' }}>
                {o.status?.toUpperCase()}
                {o.status === 'offered' && o.expires_at ? ` · STANDS UNTIL ${new Date(o.expires_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}` : ''}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}