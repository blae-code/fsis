import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { FileDown, Loader2, Archive, TrendingUp } from 'lucide-react';
import { downloadWeeklyPerformanceSummary } from '@/lib/weeklyPerformanceSummaryPdf';

const PANEL = { borderColor: '#3A2F20', background: '#0A0806' };
const AMBER = '#E0A22E';
const GREEN = '#7BA05B';
const DIM = '#8A7E6C';

const startOfWindow = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
const inWeek = (date) => date && new Date(date) >= startOfWindow();
const n = (v) => Number(v) || 0;
const fmt = (v) => n(v).toLocaleString();

function MiniStat({ label, value, sub, accent = AMBER }) {
  return (
    <div className="border p-3" style={PANEL}>
      <div className="text-[8px] tracking-[0.18em]" style={{ color: DIM }}>{label}</div>
      <div className="text-lg font-bold leading-tight" style={{ color: accent }}>{value}</div>
      {sub && <div className="text-[9px]" style={{ color: '#6B6155' }}>{sub}</div>}
    </div>
  );
}

export default function WeeklyPerformanceSummaryPanel() {
  const { data: ledger = [], isLoading: ledgerLoading } = useQuery({ queryKey: ['weekly_perf_ledger'], queryFn: () => base44.entities.ledger_entry.list('-entry_date', 500) });
  const { data: workOrders = [], isLoading: workLoading } = useQuery({ queryKey: ['weekly_perf_work_orders'], queryFn: () => base44.entities.work_order.list('-updated_date', 300) });
  const { data: cargoLots = [], isLoading: cargoLoading } = useQuery({ queryKey: ['weekly_perf_cargo_lots'], queryFn: () => base44.entities.cargo_lot.list('-updated_date', 300) });
  const { data: freightPlans = [], isLoading: plansLoading } = useQuery({ queryKey: ['weekly_perf_freight_plans'], queryFn: () => base44.entities.freight_plan.list('-updated_date', 200) });
  const { data: freightMissions = [], isLoading: missionsLoading } = useQuery({ queryKey: ['weekly_perf_freight_missions'], queryFn: () => base44.entities.freight_mission.list('-updated_date', 200) });
  const { data: orders = [], isLoading: ordersLoading } = useQuery({ queryKey: ['weekly_perf_orders'], queryFn: () => base44.entities.order.list('-created_date', 300) });

  const loading = ledgerLoading || workLoading || cargoLoading || plansLoading || missionsLoading || ordersLoading;

  const summary = useMemo(() => {
    const weekLedger = ledger.filter((e) => inWeek(e.entry_date || e.created_date));
    const income = weekLedger.filter((e) => e.entry_type === 'income').reduce((s, e) => s + n(e.amount_auec), 0);
    const expenses = weekLedger.filter((e) => e.entry_type === 'expense').reduce((s, e) => s + n(e.amount_auec), 0);
    const categoryMap = {};
    weekLedger.forEach((e) => {
      const key = e.category || 'other';
      if (!categoryMap[key]) categoryMap[key] = { income: 0, expense: 0 };
      categoryMap[key][e.entry_type] += n(e.amount_auec);
    });

    const salvage = workOrders.filter((w) => w.op_type === 'salvage' && inWeek(w.settled_date || w.updated_date || w.created_date));
    const lots = cargoLots.filter((l) => inWeek(l.updated_date || l.created_date));
    const plans = freightPlans.filter((p) => inWeek(p.updated_date || p.created_date));
    const missions = freightMissions.filter((m) => inWeek(m.updated_date || m.created_date));
    const weekOrders = orders.filter((o) => inWeek(o.created_date));
    const freightProfit = plans.reduce((s, p) => s + (n(p.final_sale_auec) - n(p.commodity_cost_auec) - n(p.handling_cost_auec)), 0);

    const now = new Date();
    const start = startOfWindow();
    return {
      periodKey: `${start.toISOString().slice(0, 10)}_to_${now.toISOString().slice(0, 10)}`,
      periodLabel: `${start.toLocaleDateString([], { month: 'short', day: 'numeric' })} – ${now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`,
      income,
      expenses,
      net: income - expenses,
      deliveredOrders: weekOrders.filter((o) => o.status === 'delivered').length,
      activeOrders: weekOrders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length,
      salvageRuns: salvage.length,
      salvageGross: salvage.reduce((s, w) => s + n(w.gross_auec), 0),
      cargoLots: lots.length,
      cargoScu: lots.reduce((s, l) => s + n(l.quantity_scu), 0),
      cargoValue: lots.reduce((s, l) => s + n(l.est_value_auec), 0),
      freightPlans: plans.length,
      freightProfit,
      freightMissions: missions.length,
      freightRewards: missions.reduce((s, m) => s + n(m.reward_auec), 0),
      categoryRows: Object.entries(categoryMap).map(([label, v]) => ({ label: label.replace(/_/g, ' ').toUpperCase(), net: v.income - v.expense })).sort((a, b) => Math.abs(b.net) - Math.abs(a.net)).slice(0, 8),
    };
  }, [ledger, workOrders, cargoLots, freightPlans, freightMissions, orders]);

  return (
    <div className="border p-4 font-mono space-y-3" style={{ borderColor: '#5C4424', background: 'linear-gradient(180deg, #100D09, #090705)' }}>
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <p className="text-[10px] tracking-[0.22em]" style={{ color: '#8A8F45' }}>WEEKLY PERFORMANCE ARCHIVE</p>
          <h3 className="text-sm font-bold" style={{ color: '#F2EADC' }}>Salvage + freight summary document</h3>
          <p className="text-[9px] mt-1 max-w-2xl" style={{ color: DIM }}>Compiles the last 7 days of ledger movement, salvage runs, cargo lots, freight plans, freight missions, and buyer order throughput into a clean PDF.</p>
        </div>
        <button disabled={loading} onClick={() => downloadWeeklyPerformanceSummary(summary)} className="min-h-10 px-3 border text-[10px] font-bold tracking-[0.14em] inline-flex items-center justify-center gap-2 disabled:opacity-40" style={{ borderColor: '#8A6430', color: AMBER, background: '#120D08' }}>
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />} DOWNLOAD PDF
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <MiniStat label="NET PERFORMANCE" value={`${fmt(summary.net)} aUEC`} sub={summary.periodLabel} accent={summary.net >= 0 ? GREEN : '#C05050'} />
        <MiniStat label="SALVAGE OUTPUT" value={`${fmt(summary.cargoScu)} SCU`} sub={`${summary.salvageRuns} settled runs`} />
        <MiniStat label="FREIGHT PROFIT" value={`${fmt(summary.freightProfit)} aUEC`} sub={`${summary.freightPlans} plans tracked`} accent={summary.freightProfit >= 0 ? GREEN : '#C05050'} />
        <MiniStat label="ORDER FLOW" value={`${summary.deliveredOrders}/${summary.activeOrders}`} sub="delivered / active" />
      </div>

      <div className="grid md:grid-cols-2 gap-3 text-[10px]">
        <div className="border p-3" style={PANEL}>
          <div className="flex items-center gap-2 font-bold tracking-[0.16em]" style={{ color: AMBER }}><TrendingUp className="w-3 h-3" /> REPORT CONTENTS</div>
          <p className="mt-2 leading-relaxed" style={{ color: '#A89C8A' }}>Includes top ledger categories, order status totals, settled salvage gross, cargo SCU/value, freight rewards, and freight plan margin.</p>
        </div>
        <div className="border p-3" style={PANEL}>
          <div className="flex items-center gap-2 font-bold tracking-[0.16em]" style={{ color: AMBER }}><Archive className="w-3 h-3" /> ARCHIVE READY</div>
          <p className="mt-2 leading-relaxed" style={{ color: '#A89C8A' }}>PDF filename includes the weekly period, so it can be saved directly into your FSIS records without manual renaming.</p>
        </div>
      </div>
    </div>
  );
}