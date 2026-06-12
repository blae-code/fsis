import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp } from 'lucide-react';
import KpiTiles from '@/components/apps/performance/KpiTiles';
import VolumeChart from '@/components/apps/performance/VolumeChart';
import RevenueChart from '@/components/apps/performance/RevenueChart';
import CommodityProfit from '@/components/apps/performance/CommodityProfit';
import CommodityTrades from '@/components/apps/performance/CommodityTrades';

const COMMODITY_NAMES = {
  RMC: 'Recycled Material Composite',
  CMR: 'Construction Mat. (Reclaimed)',
  CMS: 'Construction Mat. (Salvaged)',
};

const monthKey = (d) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
};
const monthLabel = (key) => {
  const [y, m] = key.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
};

export default function PerformanceContent() {
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['perf_sessions'],
    queryFn: () => base44.entities.salvage_session.list('created_date', 500),
  });

  const { data: ledger = [], isLoading: ledgerLoading } = useQuery({
    queryKey: ['perf_ledger'],
    queryFn: () => base44.entities.ledger_entry.list('entry_date', 1000),
  });

  const { data: prices = [] } = useQuery({
    queryKey: ['commodity_prices'],
    queryFn: () => base44.entities.commodity_price.list(),
  });

  if (sessionsLoading || ledgerLoading) {
    return <div className="text-center py-12 text-xs font-mono text-muted-foreground">Loading performance data…</div>;
  }

  // Best sell price per commodity from the UEX cache
  const bestPrice = {};
  prices.forEach((p) => {
    if (!p.price_sell) return;
    if (!bestPrice[p.commodity_code] || p.price_sell > bestPrice[p.commodity_code]) {
      bestPrice[p.commodity_code] = p.price_sell;
    }
  });

  // Salvage volume per month, stacked by commodity
  const volumeByMonth = {};
  const totals = { RMC: 0, CMR: 0, CMS: 0 };
  sessions.forEach((s) => {
    const key = monthKey(s.created_date);
    if (!volumeByMonth[key]) volumeByMonth[key] = { RMC: 0, CMR: 0, CMS: 0 };
    volumeByMonth[key].RMC += s.rmc_scu || 0;
    volumeByMonth[key].CMR += s.cmr_scu || 0;
    volumeByMonth[key].CMS += s.cms_scu || 0;
    totals.RMC += s.rmc_scu || 0;
    totals.CMR += s.cmr_scu || 0;
    totals.CMS += s.cms_scu || 0;
  });
  const volumeData = Object.keys(volumeByMonth).sort().map((key) => ({ month: monthLabel(key), ...volumeByMonth[key] }));

  // Revenue per month from ledger income, split salvage vs other
  const revenueByMonth = {};
  let totalRevenue = 0;
  let salvageRevenue = 0;
  ledger.filter((e) => e.entry_type === 'income').forEach((e) => {
    const key = monthKey(e.entry_date || e.created_date);
    if (!revenueByMonth[key]) revenueByMonth[key] = { 'Salvage sales': 0, 'Other income': 0 };
    const amt = e.amount_auec || 0;
    if (e.category === 'salvage_sale') {
      revenueByMonth[key]['Salvage sales'] += amt;
      salvageRevenue += amt;
    } else {
      revenueByMonth[key]['Other income'] += amt;
    }
    totalRevenue += amt;
  });
  const revenueData = Object.keys(revenueByMonth).sort().map((key) => ({ month: monthLabel(key), ...revenueByMonth[key] }));

  // Commodity profit ranking: total SCU × current best sell (SCU = 100 units)
  const profitData = Object.entries(totals).map(([code, scu]) => ({
    code,
    name: COMMODITY_NAMES[code],
    scu,
    price: bestPrice[code] || 0,
    value: Math.round(scu * 100 * (bestPrice[code] || 0)),
  }));

  const totalScu = totals.RMC + totals.CMR + totals.CMS;
  const soldSessions = sessions.filter((s) => ['sold', 'archived'].includes(s.status)).length;

  const tiles = [
    { label: 'TOTAL SALVAGE VOLUME', value: `${totalScu.toLocaleString()} SCU`, sub: `${sessions.length} sessions · ${soldSessions} sold` },
    { label: 'TOTAL REVENUE', value: `${totalRevenue.toLocaleString()} aUEC`, sub: 'All ledger income' },
    { label: 'SALVAGE REVENUE', value: `${salvageRevenue.toLocaleString()} aUEC`, sub: totalRevenue ? `${Math.round((salvageRevenue / totalRevenue) * 100)}% of income` : '—' },
    {
      label: 'TOP EARNER',
      value: profitData.reduce((a, b) => (b.value > a.value ? b : a), profitData[0])?.code || '—',
      sub: 'By current market value',
      color: 'hsl(20, 60%, 50%)',
    },
  ];

  return (
    <div className="h-full overflow-auto industrial-interior font-mono" style={{ background: 'hsl(30, 8%, 9%)' }}>
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2 text-[10px] tracking-[0.2em] text-muted-foreground">
          <TrendingUp className="w-3.5 h-3.5 text-primary" /> SALVAGE & REVENUE PERFORMANCE
        </div>

        <KpiTiles tiles={tiles} />

        {sessions.length === 0 && ledger.length === 0 ? (
          <div className="text-center py-12 text-xs text-muted-foreground">
            No salvage sessions or ledger entries yet — charts will appear as you log operations.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <VolumeChart data={volumeData} />
              <RevenueChart data={revenueData} />
            </div>
            <CommodityTrades sessions={sessions} bestPrice={bestPrice} />
            <CommodityProfit data={profitData} />
          </>
        )}

        <p className="text-[9px] text-muted-foreground/60 tracking-[0.1em]">
          Volume from {sessions.length} logged session{sessions.length === 1 ? '' : 's'}; revenue from ledger income entries. Commodity ranking uses current UEX best sell prices.
        </p>
      </div>
    </div>
  );
}