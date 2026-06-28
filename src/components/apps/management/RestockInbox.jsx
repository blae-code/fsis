import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Bell, Check, Trash2, Loader2 } from 'lucide-react';

const AMBER = '#E0A22E';
const DIM   = '#7A6E60';
const PANEL = { background: '#111009', borderColor: '#2A2118' };

export default function RestockInbox() {
  const qc = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['restock_notify'],
    queryFn: () => base44.entities.restock_notify.list('-created_date', 100),
  });

  const { data: messages = [], isLoading: msgLoading } = useQuery({
    queryKey: ['order_messages'],
    queryFn: () => base44.entities.order_message.list('-created_date', 100),
  });

  const markNotified = useMutation({
    mutationFn: (request) => base44.entities.restock_notify.update(request.id, { notified: true, reserve_status: request.request_type === 'reserve' ? 'notified' : request.reserve_status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['restock_notify'] }),
  });

  const deleteRestock = useMutation({
    mutationFn: (id) => base44.entities.restock_notify.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['restock_notify'] }),
  });

  const deleteMsg = useMutation({
    mutationFn: (id) => base44.entities.order_message.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['order_messages'] }),
  });

  const pending = requests.filter((r) => !r.notified);
  const cancelRequests = messages.filter((m) => m.is_cancel_request);
  const regularMessages = messages.filter((m) => !m.is_cancel_request);

  return (
    <div className="space-y-6 font-mono">

      {/* ── Restock notifications ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-3.5 h-3.5" style={{ color: AMBER }} />
          <span className="text-[9px] tracking-[0.25em]" style={{ color: AMBER }}>RESERVE & RESTOCK QUEUE</span>
          {pending.length > 0 && (
            <span className="px-1.5 py-0.5 text-[8px] font-bold" style={{ background: '#3A2810', color: AMBER, border: '1px solid #8A6430' }}>
              {pending.length} PENDING
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin" style={{ color: AMBER }} /></div>
        ) : requests.length === 0 ? (
          <div className="border p-6 text-center text-[10px]" style={{ ...PANEL, color: DIM }}>No restock requests yet.</div>
        ) : (
          <div className="space-y-1.5">
            {requests.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="border px-3 py-2.5 flex items-center gap-3"
                style={{ ...PANEL, borderColor: r.notified ? '#2A2118' : '#5C4424', opacity: r.notified ? 0.5 : 1 }}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-[10px]" style={{ color: '#D8CFC0' }}>{r.handle}</div>
                  <div className="text-[9px] truncate" style={{ color: '#6FA08F' }}>{r.product_name}</div>
                  <div className="text-[8px]" style={{ color: r.reserve_status === 'reserved' ? '#7BA05B' : AMBER }}>{r.request_type === 'reserve' ? `RESERVE ×${r.desired_quantity || 1} · ${String(r.reserve_status || 'open').toUpperCase()}` : 'NOTIFY ONLY'}</div>
                  {r.reserved_quantity > 0 && <div className="text-[8px]" style={{ color: '#7BA05B' }}>HELD: {r.reserved_quantity}</div>}
                  {r.contact && <div className="text-[8px]" style={{ color: DIM }}>via {r.contact}</div>}
                  <div className="text-[8px]" style={{ color: '#3A2A18' }}>
                    {new Date(r.created_date).toLocaleDateString([], { dateStyle: 'short' })}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {!r.notified && (
                    <button
                      onClick={() => markNotified.mutate(r) }
                      className="flex items-center gap-1 px-2 py-1 text-[8px] font-bold border"
                      style={{ borderColor: '#3C5A3C', color: '#7BA05B', background: '#0D130D' }}
                    >
                      <Check className="w-2.5 h-2.5" /> {r.reserve_status === 'reserved' ? 'BUYER TOLD' : 'NOTIFIED'}
                    </button>
                  )}
                  <button onClick={() => deleteRestock.mutate(r.id)} className="opacity-30 hover:opacity-70" style={{ color: '#FF6B6B' }}>
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Cancel requests ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[9px] tracking-[0.25em]" style={{ color: '#C05050' }}>⚑ CANCELLATION REQUESTS</span>
          {cancelRequests.length > 0 && (
            <span className="px-1.5 py-0.5 text-[8px] font-bold" style={{ background: '#2A0A0A', color: '#C05050', border: '1px solid #5A1A1A' }}>
              {cancelRequests.length}
            </span>
          )}
        </div>
        {cancelRequests.length === 0 ? (
          <div className="border p-4 text-center text-[10px]" style={{ ...PANEL, color: DIM }}>No cancellation requests.</div>
        ) : (
          <div className="space-y-1.5">
            {cancelRequests.map((m) => (
              <div key={m.id} className="border px-3 py-2.5 flex items-start gap-3" style={{ ...PANEL, borderColor: '#5A1A1A' }}>
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-bold" style={{ color: '#E0A22E' }}>{m.tracking_code}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: '#D8CFC0' }}>{m.message}</div>
                  <div className="text-[8px] mt-0.5" style={{ color: DIM }}>from {m.handle} · {new Date(m.created_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</div>
                </div>
                <button onClick={() => deleteMsg.mutate(m.id)} className="opacity-30 hover:opacity-70 shrink-0" style={{ color: '#FF6B6B' }}>
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Regular messages ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[9px] tracking-[0.25em]" style={{ color: '#6FA08F' }}>ORDER MESSAGES</span>
          {regularMessages.length > 0 && (
            <span className="px-1.5 py-0.5 text-[8px] font-bold" style={{ background: '#0A1A18', color: '#6FA08F', border: '1px solid #2A5A50' }}>
              {regularMessages.length}
            </span>
          )}
        </div>
        {msgLoading ? (
          <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin" style={{ color: AMBER }} /></div>
        ) : regularMessages.length === 0 ? (
          <div className="border p-4 text-center text-[10px]" style={{ ...PANEL, color: DIM }}>No messages yet.</div>
        ) : (
          <div className="space-y-1.5">
            {regularMessages.map((m) => (
              <div key={m.id} className="border px-3 py-2.5 flex items-start gap-3" style={{ ...PANEL, borderColor: '#2A3A38' }}>
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-bold" style={{ color: '#E0A22E' }}>{m.tracking_code}</div>
                  <div className="text-[10px] mt-0.5" style={{ color: '#D8CFC0' }}>{m.message}</div>
                  <div className="text-[8px] mt-0.5" style={{ color: DIM }}>from {m.handle} · {new Date(m.created_date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</div>
                </div>
                <button onClick={() => deleteMsg.mutate(m.id)} className="opacity-30 hover:opacity-70 shrink-0" style={{ color: '#FF6B6B' }}>
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}