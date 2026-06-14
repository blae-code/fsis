import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight, Package, MapPin } from 'lucide-react';

const AMBER  = '#E0A22E';
const TEAL   = '#6FA08F';
const DIM    = '#7A6E60';
const DIMMER = '#2A2118';

function fmtScu(n) {
  if (!n) return '0';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function fmtAuec(n) {
  if (!n) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

const STATUS_COLOR = { collected: TEAL, processed: AMBER, sold: '#8FBFAE' };
const STATUS_LABEL = { collected: 'READY', processed: 'IN TRANSIT', sold: 'SOLD' };

export default function HaulRouteOverview() {
  const { data: lots = [], isLoading } = useQuery({
    queryKey: ['cargo_lots'],
    queryFn: () => base44.entities.cargo_lot.list('-created_date', 200),
  });

  // Only show active lots (not sold)
  const activeLots = useMemo(() => lots.filter(l => l.status !== 'sold'), [lots]);

  // Group: { "Origin → Destination": [lot, ...] }
  const routes = useMemo(() => {
    const map = {};
    activeLots.forEach(lot => {
      const origin = lot.origin || 'Unknown Origin';
      const dest   = lot.destination || 'No Destination Set';
      const key    = `${origin}|||${dest}`;
      if (!map[key]) map[key] = { origin, destination: dest, lots: [] };
      map[key].lots.push(lot);
    });
    // Sort routes by total SCU descending
    return Object.values(map).sort((a, b) => {
      const scuA = a.lots.reduce((s, l) => s + (l.quantity_scu || 0), 0);
      const scuB = b.lots.reduce((s, l) => s + (l.quantity_scu || 0), 0);
      return scuB - scuA;
    });
  }, [activeLots]);

  // Unique destinations sorted by total inbound SCU
  const destinations = useMemo(() => {
    const map = {};
    activeLots.forEach(lot => {
      const dest = lot.destination || 'No Destination Set';
      if (!map[dest]) map[dest] = { destination: dest, scu: 0, value: 0, lots: [] };
      map[dest].scu   += (lot.quantity_scu || 0);
      map[dest].value += (lot.est_value_auec || 0);
      map[dest].lots.push(lot);
    });
    return Object.values(map).sort((a, b) => b.scu - a.scu);
  }, [activeLots]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-4 h-4 animate-spin" style={{ color: AMBER }} />
      </div>
    );
  }

  if (activeLots.length === 0) {
    return (
      <div className="border p-8 text-center font-mono" style={{ background: '#111009', borderColor: DIMMER }}>
        <MapPin className="w-6 h-6 mx-auto mb-2 opacity-30" style={{ color: DIM }} />
        <p className="text-[10px] tracking-[0.2em]" style={{ color: DIM }}>NO ACTIVE CARGO LOTS</p>
        <p className="text-[9px] mt-1" style={{ color: DIMMER }}>Add lots in the Cargo tracker to plan routes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-mono">

      {/* Summary strip */}
      <div className="border flex flex-wrap gap-x-6 gap-y-1 px-3 py-2" style={{ background: '#0D0B08', borderColor: DIMMER }}>
        <div className="flex items-center gap-2">
          <span className="text-[8px] tracking-[0.18em]" style={{ color: DIM }}>ACTIVE LOTS</span>
          <span className="text-sm font-bold" style={{ color: AMBER }}>{activeLots.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[8px] tracking-[0.18em]" style={{ color: DIM }}>TOTAL SCU</span>
          <span className="text-sm font-bold" style={{ color: AMBER }}>
            {activeLots.reduce((s, l) => s + (l.quantity_scu || 0), 0).toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[8px] tracking-[0.18em]" style={{ color: DIM }}>UNIQUE ROUTES</span>
          <span className="text-sm font-bold" style={{ color: TEAL }}>{routes.length}</span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[8px] tracking-[0.18em]" style={{ color: DIM }}>DESTINATIONS</span>
          <span className="text-sm font-bold" style={{ color: TEAL }}>{destinations.length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Route cards — left 2/3 */}
        <div className="lg:col-span-2 space-y-2">
          <div className="text-[8px] tracking-[0.22em] mb-1" style={{ color: DIM }}>▸ ACTIVE HAUL ROUTES</div>

          {routes.map((route, i) => {
            const totalScu   = route.lots.reduce((s, l) => s + (l.quantity_scu || 0), 0);
            const totalValue = route.lots.reduce((s, l) => s + (l.est_value_auec || 0), 0);
            const statusCounts = {};
            route.lots.forEach(l => { statusCounts[l.status] = (statusCounts[l.status] || 0) + 1; });

            return (
              <motion.div
                key={`${route.origin}-${route.destination}`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="border"
                style={{ background: '#111009', borderColor: '#2A2118' }}
              >
                {/* Route header */}
                <div className="flex items-center gap-2 px-3 py-2.5 border-b" style={{ borderColor: '#1E1810' }}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-[10px]">
                      <span className="truncate" style={{ color: '#C8BFB0' }}>{route.origin}</span>
                      <ArrowRight className="w-3 h-3 shrink-0" style={{ color: AMBER }} />
                      <span className="truncate font-bold" style={{ color: AMBER }}>{route.destination}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-[13px] font-bold" style={{ color: AMBER }}>{fmtScu(totalScu)} <span className="text-[8px]">SCU</span></div>
                      {totalValue > 0 && (
                        <div className="text-[8px]" style={{ color: '#7BA05B' }}>{fmtAuec(totalValue)} ¤</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lot list */}
                <div className="divide-y" style={{ borderColor: '#1A1410' }}>
                  {route.lots.map(lot => (
                    <div key={lot.id} className="flex items-center gap-2 px-3 py-1.5">
                      <Package className="w-2.5 h-2.5 shrink-0" style={{ color: DIMMER }} />
                      <span className="flex-1 text-[10px] truncate" style={{ color: '#B0A898' }}>{lot.lot_name}</span>
                      {lot.commodity_code && (
                        <span className="text-[9px] font-bold" style={{ color: TEAL }}>{lot.commodity_code}</span>
                      )}
                      <span className="text-[10px] font-bold w-12 text-right" style={{ color: '#D8CFC0' }}>
                        {(lot.quantity_scu || 0).toLocaleString()} <span className="text-[7px] font-normal" style={{ color: DIM }}>SCU</span>
                      </span>
                      <span
                        className="text-[7px] tracking-[0.12em] px-1.5 py-0.5 shrink-0"
                        style={{
                          color: STATUS_COLOR[lot.status] || DIM,
                          border: `1px solid ${(STATUS_COLOR[lot.status] || DIM)}44`,
                          background: `${(STATUS_COLOR[lot.status] || DIM)}12`,
                        }}
                      >
                        {STATUS_LABEL[lot.status] || lot.status?.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Status summary bar */}
                {Object.keys(statusCounts).length > 1 && (
                  <div className="flex items-center gap-3 px-3 py-1.5 border-t" style={{ borderColor: '#1E1810', background: '#0D0B08' }}>
                    {Object.entries(statusCounts).map(([st, cnt]) => (
                      <span key={st} className="text-[8px]" style={{ color: STATUS_COLOR[st] || DIM }}>
                        {cnt} {STATUS_LABEL[st] || st.toUpperCase()}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Destination priority panel — right 1/3 */}
        <div className="space-y-2">
          <div className="text-[8px] tracking-[0.22em] mb-1" style={{ color: DIM }}>▸ DESTINATION PRIORITY</div>

          {destinations.map((dest, i) => {
            const maxScu = destinations[0]?.scu || 1;
            const pct    = Math.round((dest.scu / maxScu) * 100);
            return (
              <motion.div
                key={dest.destination}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="border p-2.5"
                style={{ background: '#111009', borderColor: '#2A2118' }}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <MapPin className="w-2.5 h-2.5 shrink-0" style={{ color: i === 0 ? AMBER : DIM }} />
                    <span className="text-[10px] truncate font-bold" style={{ color: i === 0 ? AMBER : '#C8BFB0' }}>
                      {dest.destination}
                    </span>
                  </div>
                  <span className="text-[11px] font-bold shrink-0" style={{ color: AMBER }}>
                    {fmtScu(dest.scu)} <span className="text-[7px] font-normal" style={{ color: DIM }}>SCU</span>
                  </span>
                </div>

                {/* SCU fill bar */}
                <div className="w-full h-1.5 rounded-sm overflow-hidden" style={{ background: '#1E1810' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ delay: i * 0.05 + 0.1, duration: 0.5 }}
                    className="h-full"
                    style={{ background: i === 0 ? AMBER : TEAL }}
                  />
                </div>

                <div className="flex items-center justify-between mt-1">
                  <span className="text-[8px]" style={{ color: DIM }}>
                    {dest.lots.length} LOT{dest.lots.length !== 1 ? 'S' : ''}
                  </span>
                  {dest.value > 0 && (
                    <span className="text-[8px]" style={{ color: '#7BA05B' }}>
                      {fmtAuec(dest.value)} ¤ est.
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}

          {/* No-destination warning */}
          {activeLots.some(l => !l.destination) && (
            <div className="border p-2 text-[9px]" style={{ background: '#120E08', borderColor: '#5C4424', color: '#C8893B' }}>
              ⚠ {activeLots.filter(l => !l.destination).length} lot(s) have no destination set.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}