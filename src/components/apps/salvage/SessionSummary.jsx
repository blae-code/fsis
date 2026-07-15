import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Layers, Ship } from 'lucide-react';

const AMBER = '#E0A22E';
const GREEN = '#4EBF7A';
const TEAL = '#5F9A8C';
const DIM = '#5A4A34';

// Session value: stored estimate first, else computed from live UEX best-sell prices
function sessionValue(s, bestPrices) {
  if (s.estimated_value > 0) return s.estimated_value;
  return (
    (s.rmc_scu || 0) * (bestPrices.RMC?.price_sell || 0) +
    (s.cmr_scu || 0) * (bestPrices.CMR?.price_sell || 0) +
    (s.cms_scu || 0) * (bestPrices.CMS?.price_sell || 0)
  );
}

/** Totals across all saved salvage sessions + most profitable ships (last 30 days). */
export default function SessionSummary({ bestPrices = {} }) {
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['salvage_sessions'],
    queryFn: () => base44.entities.salvage_session.list('-created_date', 500),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: AMBER }} />
      </div>
    );
  }

  const totals = sessions.reduce(
    (acc, s) => ({
      rmc: acc.rmc + (s.rmc_scu || 0),
      cmr: acc.cmr + (s.cmr_scu || 0),
      cms: acc.cms + (s.cms_scu || 0),
      value: acc.value + sessionValue(s, bestPrices),
    }),
    { rmc: 0, cmr: 0, cms: 0, value: 0 }
  );

  // Last-30-day ship profitability
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = sessions.filter((s) => new Date(s.created_date).getTime() >= cutoff);
  const byShip = {};
  recent.forEach((s) => {
    const ship = (s.ship || 'Unknown').trim() || 'Unknown';
    if (!byShip[ship]) byShip[ship] = { ship, value: 0, scu: 0, runs: 0 };
    byShip[ship].value += sessionValue(s, bestPrices);
    byShip[ship].scu += (s.rmc_scu || 0) + (s.cmr_scu || 0) + (s.cms_scu || 0);
    byShip[ship].runs += 1;
  });
  const ships = Object.values(byShip).sort((a, b) => b.value - a.value);
  const topValue = ships[0]?.value || 1;

  const kpis = [
    { label: 'TOTAL RMC', value: `${totals.rmc.toLocaleString()} SCU`, color: AMBER },
    { label: 'TOTAL CMR', value: `${totals.cmr.toLocaleString()} SCU`, color: TEAL },
    { label: 'TOTAL CMS', value: `${totals.cms.toLocaleString()} SCU`, color: TEAL },
    { label: 'COMMODITY VALUE', value: `${Math.round(totals.value).toLocaleString()} aUEC`, color: GREEN },
  ];

  return (
    <div className="p-4 space-y-4 font-mono">
      <div className="flex items-center gap-2 text-[9px] tracking-[0.22em] font-bold" style={{ color: AMBER }}>
        <Layers className="w-3.5 h-3.5" /> SALVAGE SESSION SUMMARY — {sessions.length} SESSION{sessions.length !== 1 ? 'S' : ''} ON RECORD
      </div>

      {/* Lifetime totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {kpis.map((k) => (
          <div key={k.label} className="border rounded p-3" style={{ borderColor: 'hsl(33,18%,18%)', background: 'hsl(30,10%,8%)' }}>
            <div className="text-[8px] tracking-[0.2em]" style={{ color: DIM }}>{k.label}</div>
            <div className="text-lg font-bold mt-1" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Ship profitability — last 30 days */}
      <div className="border rounded p-3 space-y-2" style={{ borderColor: 'hsl(33,18%,18%)', background: 'hsl(30,10%,8%)' }}>
        <div className="flex items-center gap-2 text-[9px] tracking-[0.2em] font-bold" style={{ color: '#EDE5D6' }}>
          <Ship className="w-3.5 h-3.5" style={{ color: AMBER }} /> MOST PROFITABLE SHIPS — LAST 30 DAYS
          <span className="ml-auto font-normal" style={{ color: DIM }}>{recent.length} session{recent.length !== 1 ? 's' : ''}</span>
        </div>
        {ships.length === 0 ? (
          <p className="text-[10px] text-center py-6" style={{ color: DIM }}>No salvage sessions logged in the last 30 days.</p>
        ) : (
          ships.map((s, i) => (
            <div key={s.ship} className="space-y-1">
              <div className="flex items-center gap-2 text-[10px]">
                <span className="w-4 text-right font-bold" style={{ color: i === 0 ? AMBER : DIM }}>{i + 1}</span>
                <span className="flex-1 truncate" style={{ color: '#EDE5D6' }}>{s.ship}</span>
                <span style={{ color: DIM }}>{s.runs} run{s.runs !== 1 ? 's' : ''} · {Math.round(s.scu).toLocaleString()} SCU</span>
                <span className="w-28 text-right font-bold" style={{ color: GREEN }}>{Math.round(s.value).toLocaleString()} aUEC</span>
              </div>
              <div className="h-1.5 rounded-sm overflow-hidden ml-6" style={{ background: '#1A1208' }}>
                <div className="h-full rounded-sm" style={{ width: `${Math.max(2, (s.value / topValue) * 100)}%`, background: i === 0 ? AMBER : '#8A6430' }} />
              </div>
            </div>
          ))
        )}
      </div>

      <p className="text-[8px] text-center" style={{ color: '#3A2A14' }}>
        Value uses each session's stored estimate, or live UEX best-sell prices when no estimate was saved
      </p>
    </div>
  );
}