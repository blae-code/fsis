import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ScrollText } from 'lucide-react';

const ACTION_COLOR = { invited: '#E0A22E', granted: '#8A8F45', revoked: '#C05050', suspended: '#C05050', reinstated: '#6FA0C8' };

/** Nothing about standing happens in private — every change is entered in the collective record. */
export default function AccessGrantLog() {
  const { data: grants = [] } = useQuery({
    queryKey: ['access_grants'],
    queryFn: () => base44.entities.access_grant.list('-created_date', 60),
  });

  return (
    <div className="border p-3 space-y-2" style={{ borderColor: '#2E2519', background: '#0B0906' }}>
      <div className="flex items-center gap-2 text-[9px] tracking-[0.22em]" style={{ color: '#C8A05B' }}>
        <ScrollText className="w-3.5 h-3.5" /> ACCESS RECORD — OPEN TO THE COUNCIL
      </div>
      {grants.length === 0 ? (
        <p className="text-[9px] py-4 text-center" style={{ color: '#6B6155' }}>No standing changes recorded yet.</p>
      ) : (
        <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
          {grants.map((g) => (
            <div key={g.id} className="flex items-start justify-between gap-2 border-b pb-1" style={{ borderColor: '#1E1913' }}>
              <div className="min-w-0">
                <div className="text-[9px] truncate" style={{ color: '#EDE5D6' }}>
                  {g.target_handle || g.target_email || 'unknown comrade'}
                  <span className="ml-1.5" style={{ color: '#6B6155' }}>
                    {g.previous_role ? `${g.previous_role} → ` : ''}{g.new_role}
                  </span>
                </div>
                <div className="text-[8px] truncate" style={{ color: '#6B6155' }}>
                  by {g.granted_by_email} ({g.granted_by_role}){g.notes ? ` — ${g.notes}` : ''}
                </div>
              </div>
              <span className="text-[7px] font-bold tracking-[0.14em] shrink-0" style={{ color: ACTION_COLOR[g.action] || '#7A6E60' }}>
                {(g.action || '').toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}