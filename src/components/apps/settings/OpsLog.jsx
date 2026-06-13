import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ScrollText, ChevronDown } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const AMBER = '#E0A22E';
const TEAL  = '#6FA08F';
const DIM   = '#7A6E60';

const ACTION_COLOR = {
  'work_order.settled': TEAL,
  'order.status_changed': AMBER,
  'product.repriced': '#6FA0C8',
  'payday.published': '#C8893B',
};

export default function OpsLog() {
  const [expanded, setExpanded] = useState(null);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['ops_log'],
    queryFn: () => base44.entities.ops_log.list('-created_date', 50),
    refetchInterval: 30000,
  });

  return (
    <div className="border font-mono" style={{ background: '#0E0B08', borderColor: '#2A2118' }}>
      <div className="flex items-center gap-2 px-3 py-2.5 border-b" style={{ borderColor: '#2A2118' }}>
        <ScrollText className="w-3.5 h-3.5" style={{ color: AMBER }} />
        <span className="text-[10px] tracking-[0.18em]" style={{ color: AMBER }}>OPS AUDIT LOG</span>
        <span className="ml-auto text-[9px]" style={{ color: DIM }}>{logs.length} entries</span>
      </div>

      {isLoading ? (
        <div className="px-4 py-6 text-center text-[10px]" style={{ color: DIM }}>Loading…</div>
      ) : logs.length === 0 ? (
        <div className="px-4 py-6 text-center text-[10px]" style={{ color: '#3A2E1E' }}>No audit entries yet.</div>
      ) : (
        <div className="divide-y max-h-96 overflow-y-auto" style={{ borderColor: '#1A1510' }}>
          {logs.map(log => {
            const color = ACTION_COLOR[log.action] || DIM;
            const isExpanded = expanded === log.id;
            return (
              <div key={log.id}>
                <button
                  className="w-full flex items-start gap-3 px-3 py-2.5 text-left hover:bg-white/[0.02] transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : log.id)}
                >
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px]" style={{ color }}>{log.action}</span>
                      {log.entity_name && (
                        <span className="text-[9px]" style={{ color: '#C8BFB0' }}>{log.entity_name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[9px]" style={{ color: DIM }}>
                      <span>{log.actor || 'unknown'}</span>
                      <span>·</span>
                      <span>{log.created_date ? formatDistanceToNow(new Date(log.created_date), { addSuffix: true }) : ''}</span>
                    </div>
                  </div>
                  <ChevronDown className="w-3 h-3 shrink-0 mt-1 transition-transform" style={{ color: DIM, transform: isExpanded ? 'rotate(180deg)' : 'none' }} />
                </button>

                {isExpanded && (log.before || log.after || log.notes) && (
                  <div className="px-7 pb-2.5 space-y-1.5">
                    {log.notes && <p className="text-[9px]" style={{ color: '#7A6E60' }}>{log.notes}</p>}
                    {log.before && (
                      <div>
                        <div className="text-[8px] tracking-[0.12em] mb-0.5" style={{ color: '#3A2E1E' }}>BEFORE</div>
                        <pre className="text-[8px] p-2 rounded" style={{ background: '#0A0806', color: '#5A4E40', overflow: 'auto' }}>
                          {JSON.stringify(log.before, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.after && (
                      <div>
                        <div className="text-[8px] tracking-[0.12em] mb-0.5" style={{ color: '#3A2E1E' }}>AFTER</div>
                        <pre className="text-[8px] p-2 rounded" style={{ background: '#0A0806', color: TEAL, overflow: 'auto' }}>
                          {JSON.stringify(log.after, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}