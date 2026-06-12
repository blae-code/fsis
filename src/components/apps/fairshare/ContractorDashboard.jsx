import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Activity, Boxes, Users } from 'lucide-react';

const border = { borderColor: 'hsl(33, 18%, 18%)' };
const panel = { ...border, background: 'hsl(30, 10%, 7%)' };

const sessionScu = (s) => (s?.rmc_scu || 0) + (s?.cmr_scu || 0) + (s?.cms_scu || 0);

// Contractor activity monitor: roles, active status, and total completed salvage
// volume — SCU from sold/settled sessions tied to work orders the contractor crewed.
export default function ContractorDashboard() {
  const { data: crew = [] } = useQuery({
    queryKey: ['crew_members'],
    queryFn: () => base44.entities.crew_member.list('-created_date'),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ['work_orders'],
    queryFn: () => base44.entities.work_order.list('-created_date', 100),
  });

  const { data: sessions = [] } = useQuery({
    queryKey: ['salvage_sessions_all'],
    queryFn: () => base44.entities.salvage_session.list('-created_date', 100),
  });

  const sessionById = Object.fromEntries(sessions.map((s) => [s.id, s]));

  // Per-handle activity rollup from settled work orders
  const activity = {};
  const ensure = (h) => (activity[h] ||= { volumeScu: 0, opsCompleted: 0, opsActive: 0 });
  orders.forEach((o) => {
    const settled = o.status === 'settled';
    const scu = settled && o.session_id ? sessionScu(sessionById[o.session_id]) : 0;
    (o.crew_shares || []).forEach((c) => {
      const a = ensure(c.handle);
      if (settled) {
        a.opsCompleted += 1;
        a.volumeScu += scu;
      } else {
        a.opsActive += 1;
      }
    });
  });

  const activeCrew = crew.filter((m) => m.active !== false);
  const totalVolume = crew.reduce((t, m) => t + (activity[m.handle]?.volumeScu || 0), 0);

  return (
    <div className="p-4 space-y-3 font-mono">
      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-2">
        <Chip icon={Users} label="CONTRACTORS" value={crew.length} />
        <Chip icon={Activity} label="ACTIVE" value={activeCrew.length} color="hsl(140, 45%, 50%)" />
        <Chip icon={Boxes} label="COMPLETED SALVAGE" value={`${totalVolume.toLocaleString()} SCU`} />
      </div>

      {/* Roster table */}
      <div className="border" style={panel}>
        <div className="grid grid-cols-[1fr_130px_90px_90px_110px] gap-2 px-3 py-1.5 text-[9px] tracking-[0.15em] text-muted-foreground border-b" style={border}>
          <span>CONTRACTOR</span>
          <span>ROLE</span>
          <span className="text-right">ACTIVE OPS</span>
          <span className="text-right">COMPLETED</span>
          <span className="text-right">SALVAGE VOL</span>
        </div>

        {crew.length === 0 ? (
          <p className="text-center py-6 text-xs text-muted-foreground">No crew on roster yet.</p>
        ) : (
          [...crew]
            .sort((a, b) => (activity[b.handle]?.volumeScu || 0) - (activity[a.handle]?.volumeScu || 0))
            .map((m) => {
              const a = activity[m.handle] || { volumeScu: 0, opsCompleted: 0, opsActive: 0 };
              const isActive = m.active !== false;
              return (
                <div key={m.id} className="grid grid-cols-[1fr_130px_90px_90px_110px] gap-2 items-center px-3 py-2 text-xs border-b last:border-b-0" style={border}>
                  <span className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      title={isActive ? 'Active' : 'Inactive'}
                      style={{ background: isActive ? 'hsl(140, 45%, 50%)' : 'hsl(35, 12%, 35%)', boxShadow: isActive ? '0 0 6px hsl(140, 45%, 50%, 0.6)' : 'none' }}
                    />
                    <span className="truncate text-foreground">{m.handle}</span>
                    <Badge variant="outline" className={`text-[8px] h-4 shrink-0 ${m.employment_type === 'proprietor' ? 'border-primary/50 text-primary' : 'border-muted text-muted-foreground'}`}>
                      {m.employment_type === 'proprietor' ? 'PROPRIETOR' : 'CONTRACTOR'}
                    </Badge>
                  </span>
                  <span className="truncate text-muted-foreground">{m.role || '—'}</span>
                  <span className="text-right" style={{ color: a.opsActive > 0 ? 'hsl(45, 80%, 55%)' : 'hsl(35, 12%, 52%)' }}>
                    {a.opsActive || '—'}
                  </span>
                  <span className="text-right text-muted-foreground">{a.opsCompleted || '—'}</span>
                  <span className="text-right text-primary">{a.volumeScu > 0 ? `${a.volumeScu.toLocaleString()} SCU` : '—'}</span>
                </div>
              );
            })
        )}
      </div>

      <p className="text-[9px] text-muted-foreground">
        Salvage volume = total SCU (RMC + CMR + CMS) of sessions tied to settled work orders the contractor crewed.
      </p>
    </div>
  );
}

function Chip({ icon: Icon, label, value, color }) {
  return (
    <div className="border px-3 py-2" style={panel}>
      <p className="text-[9px] tracking-[0.15em] text-muted-foreground flex items-center gap-1"><Icon className="w-3 h-3" /> {label}</p>
      <p className="text-lg font-bold" style={{ color: color || 'hsl(38, 72%, 52%)' }}>{value}</p>
    </div>
  );
}