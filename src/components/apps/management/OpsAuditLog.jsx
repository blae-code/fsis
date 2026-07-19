import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { format } from 'date-fns';
import { EmptyLog } from '@/components/brand/EmptyStateScene';
import { SkeletonTable } from '@/components/ui/SkeletonCard';

const AMBER = '#E0A22E';
const TEAL  = '#6FA08F';
const DIM   = '#7A6E60';
const PANEL = { background: '#111009', borderColor: '#2A2118' };

function actionColor(action = '') {
  if (action.includes('settle') || action.includes('pay'))  return AMBER;
  if (action.includes('order'))  return TEAL;
  if (action.includes('cancel') || action.includes('delete')) return '#C05050';
  if (action.includes('create')) return '#7BA05B';
  return DIM;
}

export default function OpsAuditLog() {
  const queryClient = useQueryClient();
  const [filterAction, setFilterAction] = useState('');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['ops_log'],
    queryFn: () => base44.entities.ops_log.list('-created_date', 200),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ops_log.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ops_log'] }),
  });

  const filtered = filterAction
    ? logs.filter(l => l.action?.includes(filterAction))
    : logs;

  const actionTypes = [...new Set(logs.map(l => l.action?.split('.')[0]).filter(Boolean))];

  return (
    <div className="p-4 space-y-4 font-mono">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4" style={{ color: AMBER }} />
          <span className="text-[10px] tracking-[0.2em]" style={{ color: '#B0793A' }}>OPS AUDIT LOG</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="h-6 text-[9px] bg-transparent border px-1.5 font-mono"
            style={{ borderColor: '#2A2118', color: DIM }}
          >
            <option value="">ALL TYPES</option>
            {actionTypes.map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
          </select>
          <span className="text-[9px]" style={{ color: DIM }}>{filtered.length} entries</span>
        </div>
      </div>

      {isLoading ? (
        <SkeletonTable rows={6} />
      ) : filtered.length === 0 ? (
        <EmptyLog />
      ) : (
        <div className="space-y-1">
          {/* Header */}
          <div className="grid grid-cols-[100px_120px_1fr_1fr_60px] gap-2 px-2 text-[8px] tracking-[0.14em]" style={{ color: '#3A3028' }}>
            <span>TIME</span><span>ACTION</span><span>ENTITY</span><span>ACTOR</span><span/>
          </div>
          {filtered.map((log, i) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.01 }}
              className="border"
              style={PANEL}
            >
              <div className="grid grid-cols-[100px_120px_1fr_1fr_60px] gap-2 px-2.5 py-1.5 items-center">
                <span className="text-[9px]" style={{ color: DIM }}>
                  {log.created_date ? format(new Date(log.created_date), 'MM-dd HH:mm') : '—'}
                </span>
                <span
                  className="text-[9px] font-bold truncate"
                  style={{ color: actionColor(log.action) }}
                >
                  {log.action}
                </span>
                <div className="min-w-0">
                  <div className="text-[10px] truncate" style={{ color: '#D8CFC0' }}>{log.entity_name || log.entity_id || '—'}</div>
                  {log.detail && <div className="text-[8px] truncate" style={{ color: DIM }}>{log.detail}</div>}
                </div>
                <span className="text-[9px] truncate" style={{ color: DIM }}>{log.actor || '—'}</span>
                <button
                  onClick={() => deleteMutation.mutate(log.id)}
                  className="text-[8px] px-1.5 py-0.5 border transition-all text-center"
                  style={{ borderColor: '#3A1A1A', color: '#6A3A3A' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#C05050'; e.currentTarget.style.borderColor = '#C05050'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#6A3A3A'; e.currentTarget.style.borderColor = '#3A1A1A'; }}
                >
                  DEL
                </button>
              </div>
              {(log.old_value || log.new_value) && (
                <div className="px-2.5 pb-1.5 flex gap-3 text-[8px]" style={{ color: DIM }}>
                  {log.old_value && <span>BEFORE: <span style={{ color: '#C05050' }}>{log.old_value}</span></span>}
                  {log.new_value && <span>AFTER: <span style={{ color: '#7BA05B' }}>{log.new_value}</span></span>}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}