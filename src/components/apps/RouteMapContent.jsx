import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Map } from 'lucide-react';
import RouteMapCanvas from '@/components/apps/routemap/RouteMapCanvas';
import RouteRankList from '@/components/apps/routemap/RouteRankList';

const COMMODITIES = ['RMC', 'CMR', 'CMS'];

export default function RouteMapContent() {
  const [originSystem, setOriginSystem] = useState('Stanton');
  const [commodity, setCommodity] = useState('all');

  const { data: routes = [], isLoading } = useQuery({
    queryKey: ['routes_all'],
    queryFn: () => base44.entities.route.list('-synced_at', 500),
  });

  const systems = useMemo(() => {
    const s = new Set(routes.map((r) => r.origin_system).filter(Boolean));
    s.add('Stanton');
    return [...s].sort();
  }, [routes]);

  const bestRoutes = useMemo(() => {
    let pool = routes.filter((r) => !r.origin_system || r.origin_system === originSystem);
    if (commodity !== 'all') pool = pool.filter((r) => r.commodity_code === commodity);
    // Dedupe by destination terminal, keep the entry with the shortest known distance
    const byDest = new Map();
    for (const r of pool) {
      const key = r.destination_terminal || r.id;
      const prev = byDest.get(key);
      if (!prev || (r.distance ?? Infinity) < (prev.distance ?? Infinity)) byDest.set(key, r);
    }
    return [...byDest.values()]
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
      .slice(0, 8);
  }, [routes, originSystem, commodity]);

  return (
    <div className="h-full flex flex-col industrial-interior font-mono" style={{ background: 'hsl(30, 8%, 9%)' }}>
      {/* controls */}
      <div className="flex items-center gap-2 p-3 border-b flex-wrap" style={{ borderColor: 'hsl(33, 18%, 18%)', background: 'hsl(30, 10%, 7%)' }}>
        <div className="text-[9px] text-muted-foreground tracking-[0.2em] mr-2">JUMP PATH PLOTTER</div>
        <Select value={originSystem} onValueChange={setOriginSystem}>
          <SelectTrigger className="h-7 w-32 text-[10px] font-mono"><SelectValue placeholder="System" /></SelectTrigger>
          <SelectContent>
            {systems.map((s) => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={commodity} onValueChange={setCommodity}>
          <SelectTrigger className="h-7 w-28 text-[10px] font-mono"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All Cargo</SelectItem>
            {COMMODITIES.map((c) => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <span className="ml-auto text-[9px] text-muted-foreground">{bestRoutes.length} PATHS PLOTTED</span>
      </div>

      <div className="flex-1 overflow-auto p-3 space-y-3">
        {isLoading ? (
          <div className="text-center py-12 text-xs text-muted-foreground">Plotting jump paths…</div>
        ) : bestRoutes.length === 0 ? (
          <div className="text-center py-12">
            <Map className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              No route data cached yet — run a UEX sync from the Salvage desk to populate jump paths.
            </p>
          </div>
        ) : (
          <>
            <RouteMapCanvas originSystem={originSystem} routes={bestRoutes} />
            <div className="text-[9px] text-muted-foreground tracking-[0.2em]">RANKED BY JUMP DISTANCE — NEAREST FIRST</div>
            <RouteRankList routes={bestRoutes} />
          </>
        )}
      </div>

      <div className="px-3 py-1.5 border-t text-[8px] text-muted-foreground/60 tracking-[0.15em]" style={{ borderColor: 'hsl(33, 18%, 18%)' }}>
        FSIS ROUTEMAP • DISTANCE DATA via UEX CACHE • PATHS ARE ADVISORY ONLY
      </div>
    </div>
  );
}