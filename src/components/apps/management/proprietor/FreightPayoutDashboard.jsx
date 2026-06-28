import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeDollarSign, TrendingUp } from 'lucide-react';
import FreightMarginBar from './FreightMarginBar';

const field = { borderColor: '#3A2F20', background: '#0B0906', color: '#EDE5D6' };
const fmt = (n) => `${Math.round(Number(n || 0)).toLocaleString()} aUEC`;

function planMath(plan, crates) {
  const ids = plan.selected_crates || [];
  const crateValue = crates.filter((c) => ids.includes(c.id)).reduce((s, c) => s + Number(c.cargo_value_auec || 0), 0);
  const cost = Number(plan.commodity_cost_auec || crateValue || 0);
  const sale = Number(plan.final_sale_auec || 0);
  const handling = Number(plan.handling_cost_auec || 0);
  const profit = sale - cost - handling;
  const margin = sale > 0 ? Math.round((profit / sale) * 1000) / 10 : 0;
  return { cost, sale, handling, profit, margin, crateValue };
}

function PlanPayoutCard({ plan, crates, onSave, pending }) {
  const [draft, setDraft] = useState({ commodity_cost_auec: plan.commodity_cost_auec || '', final_sale_auec: plan.final_sale_auec || '', handling_cost_auec: plan.handling_cost_auec || '' });
  const math = planMath({ ...plan, ...draft }, crates);
  return <div className="border p-3 space-y-3" style={{ borderColor: '#3A2F20', background: '#0C0A07' }}><div className="flex justify-between gap-3"><div><p className="text-[10px] font-bold" style={{ color: '#F2EADC' }}>{plan.plan_name}</p><p className="text-[9px]" style={{ color: '#8A7E6C' }}>{plan.ship_name || 'Unassigned ship'} • {plan.status || 'draft'}</p></div><span className="text-[10px] font-bold" style={{ color: math.profit >= 0 ? '#8A8F45' : '#C05050' }}>{math.margin}% MARGIN</span></div><div className="grid md:grid-cols-3 gap-2"><input type="number" placeholder="Commodity cost" value={draft.commodity_cost_auec} onChange={(e)=>setDraft({...draft, commodity_cost_auec:e.target.value})} className="h-8 border px-2 text-[10px]" style={field}/><input type="number" placeholder="Final sale / payout" value={draft.final_sale_auec} onChange={(e)=>setDraft({...draft, final_sale_auec:e.target.value})} className="h-8 border px-2 text-[10px]" style={field}/><input type="number" placeholder="Handling cost" value={draft.handling_cost_auec} onChange={(e)=>setDraft({...draft, handling_cost_auec:e.target.value})} className="h-8 border px-2 text-[10px]" style={field}/></div><div className="grid grid-cols-4 gap-2 text-[9px]"><span style={{ color:'#8A7E6C' }}>COST<br/><b style={{ color:'#D8CFC0' }}>{fmt(math.cost)}</b></span><span style={{ color:'#8A7E6C' }}>PAYOUT<br/><b style={{ color:'#E0A22E' }}>{fmt(math.sale)}</b></span><span style={{ color:'#8A7E6C' }}>EXPENSES<br/><b style={{ color:'#C8893B' }}>{fmt(math.handling)}</b></span><span style={{ color:'#8A7E6C' }}>PROFIT<br/><b style={{ color: math.profit >= 0 ? '#8A8F45' : '#C05050' }}>{fmt(math.profit)}</b></span></div><FreightMarginBar cost={math.cost} handling={math.handling} profit={math.profit} /><button disabled={pending} onClick={()=>onSave(plan.id, draft)} className="border px-3 py-1.5 text-[9px] font-bold" style={{ borderColor:'#8A6430', color:'#E0A22E' }}>SAVE PAYOUT</button></div>;
}

export default function FreightPayoutDashboard() {
  const qc = useQueryClient();
  const { data: plans = [] } = useQuery({ queryKey: ['freight_plans_payout'], queryFn: () => base44.entities.freight_plan.list('-updated_date', 50) });
  const { data: crates = [] } = useQuery({ queryKey: ['warehouse_crates'], queryFn: () => base44.entities.cargo_crate.list('-updated_date', 200) });
  const save = useMutation({ mutationFn: ({ id, draft }) => base44.entities.freight_plan.update(id, { commodity_cost_auec: Number(draft.commodity_cost_auec || 0), final_sale_auec: Number(draft.final_sale_auec || 0), handling_cost_auec: Number(draft.handling_cost_auec || 0) }), onSuccess: () => qc.invalidateQueries({ queryKey: ['freight_plans_payout'] }) });
  const totals = plans.reduce((acc, p) => { const m = planMath(p, crates); acc.sale += m.sale; acc.profit += m.profit; return acc; }, { sale: 0, profit: 0 });
  return <section className="border p-4 font-mono space-y-3" style={{ borderColor: '#5C4424', background: '#120D08' }}><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] tracking-[0.2em]" style={{ color:'#E0A22E' }}><BadgeDollarSign className="w-3 h-3 inline mr-1"/>FREIGHT PAYOUT DASHBOARD</p><h3 className="text-sm font-bold" style={{ color:'#F2EADC' }}>Plan payout and profit margin</h3></div><div className="text-right text-[10px]"><p style={{ color:'#8A7E6C' }}>TOTAL PAYOUT</p><b style={{ color:'#E0A22E' }}>{fmt(totals.sale)}</b><p className="mt-1" style={{ color:'#8A7E6C' }}>TOTAL PROFIT</p><b style={{ color: totals.profit >= 0 ? '#8A8F45' : '#C05050' }}><TrendingUp className="w-3 h-3 inline mr-1"/>{fmt(totals.profit)}</b></div></div><div className="grid xl:grid-cols-2 gap-3">{plans.length ? plans.map((p)=><PlanPayoutCard key={p.id} plan={p} crates={crates} pending={save.isPending} onSave={(id,draft)=>save.mutate({ id, draft })}/>) : <p className="text-[10px]" style={{ color:'#8A7E6C' }}>No freight plans yet. Build one in the cargo load planner, then record sale and cost figures here.</p>}</div></section>;
}