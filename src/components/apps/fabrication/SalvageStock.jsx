import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Recycle } from 'lucide-react';

// Aggregates salvage output (RMC/CMR/CMS) from active salvage sessions
// and compares it against the planner's material requirements.
export function useSalvageStock() {
  const { data: sessions = [] } = useQuery({
    queryKey: ['salvage_sessions_stock'],
    queryFn: () => base44.entities.salvage_session.list(),
  });

  const active = sessions.filter((s) => ['planning', 'in-progress', 'hauling'].includes(s.status));
  return {
    RMC: active.reduce((sum, s) => sum + (s.rmc_scu || 0), 0),
    CMR: active.reduce((sum, s) => sum + (s.cmr_scu || 0), 0),
    CMS: active.reduce((sum, s) => sum + (s.cms_scu || 0), 0),
  };
}

export default function SalvageStock({ required }) {
  const stock = useSalvageStock();
  const codes = ['RMC', 'CMR', 'CMS'];
  const anyRequired = codes.some((c) => (required[c] || 0) > 0);

  return (
    <div className="p-3 rounded border space-y-2" style={{ borderColor: 'hsl(170, 25%, 18%)', background: 'hsl(180, 12%, 8%)' }}>
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground tracking-[0.2em]">
        <Recycle className="w-3 h-3 text-primary" /> SALVAGE STOCK vs REQUIRED
      </div>
      <div className="grid grid-cols-3 gap-2">
        {codes.map((code) => {
          const have = stock[code];
          const need = required[code] || 0;
          const covered = need === 0 || have >= need;
          return (
            <div key={code} className="p-2 rounded text-center" style={{ background: 'hsl(180, 10%, 12%)' }}>
              <div className="text-[10px] text-muted-foreground">{code}</div>
              <div className={`text-xs font-bold ${covered ? 'text-primary' : 'text-destructive'}`}>
                {have.toFixed(1)} / {need.toFixed(1)}
              </div>
              <div className="text-[9px] text-muted-foreground">
                {need === 0 ? 'not needed' : covered ? 'covered' : `short ${(need - have).toFixed(1)} SCU`}
              </div>
            </div>
          );
        })}
      </div>
      {!anyRequired && (
        <p className="text-[9px] text-muted-foreground">No salvage materials required by queued recipes. Stock pulled from your active salvage sessions.</p>
      )}
    </div>
  );
}