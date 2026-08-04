import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import DeckPanel from '@/components/console/deck/DeckPanel';
import DeckGauge, { fmtAuec } from '@/components/console/deck/DeckGauge';
import SessionEarningsChart from '@/components/apps/salvage/dashboard/SessionEarningsChart';
import MaterialBreakdownBars from '@/components/apps/salvage/dashboard/MaterialBreakdownBars';
import { salvageValueModel } from '@/components/apps/salvage/dashboard/salvageValueModel';

/** Total salvage value, the material mix behind it, and how it has run session to session. */
export default function SalvageValueDashboard({ bestPrices = {} }) {
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['salvage_sessions_value_dash'],
    queryFn: () => base44.entities.salvage_session.list('-created_date', 200),
    refetchInterval: 60000,
  });

  const { trend, breakdown, totals } = useMemo(
    () => salvageValueModel({ sessions, bestPrices }),
    [sessions, bestPrices],
  );

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-4 h-4 animate-spin" style={{ color: '#E0A22E' }} /></div>;
  }

  return (
    <div className="p-3 space-y-3 font-mono">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <DeckGauge label="TOTAL SALVAGE VALUE" value={`${fmtAuec(totals.value)} ¤`} sub={`${totals.sessions} sessions logged`} color="#E0A22E" />
        <DeckGauge label="SOLD" value={`${fmtAuec(totals.sold)} ¤`} sub="runs already settled" color="#8A8F45" />
        <DeckGauge label="STILL IN HAND" value={`${fmtAuec(totals.open)} ¤`} sub="cargo not yet sold" color="#6FA0C8" />
        <DeckGauge label="MASS RECOVERED" value={`${totals.scu.toLocaleString()} SCU`} sub={`${totals.hulls} hulls scraped`} color="#C8A05B" />
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
        <DeckPanel glyph="◈" title="EARNINGS ACROSS RECENT SESSIONS" meta="BARS PER RUN · LINE RUNNING TOTAL" notch="both" capTop bright>
          <div className="p-3">
            <SessionEarningsChart trend={trend} />
          </div>
        </DeckPanel>

        <DeckPanel glyph="▦" title="MATERIAL BREAKDOWN" meta="AT BEST SELL" notch="tl" capBottom>
          <div className="p-3 space-y-3">
            <MaterialBreakdownBars breakdown={breakdown} />
            <div className="grid grid-cols-2 gap-1">
              <DeckGauge label="PER SCU" value={`${Math.round(totals.perScu).toLocaleString()} ¤`} sub="across all mass" color="#E0A22E" />
              <DeckGauge label="PER SESSION" value={`${fmtAuec(totals.perSession)} ¤`} sub="average run" color="#6FA0C8" />
            </div>
          </div>
        </DeckPanel>
      </div>

      <p className="text-[8px] leading-relaxed" style={{ color: '#5F564A' }}>
        A session's own recorded value is used where one was entered; otherwise its SCU is valued at the
        current best sell price synced from UEX, so an unpriced commodity reads as nothing rather than a guess.
      </p>
    </div>
  );
}