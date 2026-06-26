import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarClock, Check, X, Loader2, MapPin, Radio, Send } from 'lucide-react';

const AMBER = '#E0A22E';
const field = { borderColor: '#3A2F20', background: '#0C0A08', color: '#D8CFC0' };

const HANDOFF_COLORS = {
  none: '#3A3028',
  requested: '#C8893B',
  confirmed: '#7BA05B',
  completed: '#6FA08F',
};

export function HandoffStatusBadge({ status }) {
  const color = HANDOFF_COLORS[status] || HANDOFF_COLORS.none;
  if (!status || status === 'none') return null;
  return (
    <span className="font-mono text-[8px] tracking-[0.15em] px-1.5 py-0.5 border"
      style={{ borderColor: `${color}60`, color, background: `${color}12` }}>
      HANDOFF {status.toUpperCase()}
    </span>
  );
}

export default function HandoffCoordinator({ order }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [confirmedTime, setConfirmedTime] = useState(order.handoff_confirmed_time || '');
  const [confirmedLoc, setConfirmedLoc] = useState(order.handoff_confirmed_location || order.handoff_location || '');
  const [note, setNote] = useState(order.handoff_proprietor_note || '');
  const [done, setDone] = useState(false);

  const confirmMutation = useMutation({
    mutationFn: () => base44.entities.order.update(order.id, {
      handoff_confirmed_time: confirmedTime.trim(),
      handoff_confirmed_location: confirmedLoc.trim(),
      handoff_proprietor_note: note.trim(),
      handoff_status: 'confirmed',
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['all_orders'] });
      setDone(true);
    },
  });

  const markComplete = useMutation({
    mutationFn: () => base44.entities.order.update(order.id, { handoff_status: 'completed' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['all_orders'] }),
  });

  const hs = order.handoff_status;

  if (!hs || hs === 'none') {
    return <span className="font-mono text-[8px]" style={{ color: '#3A3028' }}>No handoff request</span>;
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 flex-wrap">
        <HandoffStatusBadge status={hs} />

        {hs === 'requested' && (
          <button
            onClick={() => { setOpen(true); setDone(false); }}
            className="font-mono text-[8px] tracking-[0.12em] px-2 py-0.5 border transition-colors"
            style={{ borderColor: '#5C4424', color: AMBER, background: '#180E04' }}
          >
            CONFIRM SLOT ▸
          </button>
        )}
        {hs === 'confirmed' && (
          <button
            onClick={() => markComplete.mutate()}
            disabled={markComplete.isPending}
            className="font-mono text-[8px] tracking-[0.12em] px-2 py-0.5 border transition-colors"
            style={{ borderColor: '#3C5A3C', color: '#7BA05B', background: '#0C130C' }}
          >
            {markComplete.isPending ? <Loader2 className="w-3 h-3 inline animate-spin" /> : '✓ MARK COMPLETED'}
          </button>
        )}
      </div>

      {/* Buyer proposal summary */}
      {order.handoff_proposed_time && (
        <div className="font-mono text-[9px] space-y-0.5 pl-1 border-l-2" style={{ borderColor: '#3A2F20' }}>
          <div style={{ color: '#8A7E6C' }}>
            <span style={{ color: '#5A4A38' }}>PROPOSED · </span>
            {order.handoff_proposed_time}
          </div>
          {order.handoff_location && (
            <div style={{ color: '#8A7E6C' }}>
              <span style={{ color: '#5A4A38' }}>LOC · </span>{order.handoff_location}
            </div>
          )}
          {order.handoff_contact && (
            <div style={{ color: '#8A7E6C' }}>
              <span style={{ color: '#5A4A38' }}>COMMS · </span>{order.handoff_contact}
            </div>
          )}
        </div>
      )}

      {/* Confirmed slot */}
      {(hs === 'confirmed' || hs === 'completed') && order.handoff_confirmed_time && (
        <div className="font-mono text-[9px] space-y-0.5 pl-1 border-l-2" style={{ borderColor: '#3C5A3C' }}>
          <div style={{ color: '#7BA05B' }}>
            <span style={{ color: '#3C5A3C' }}>CONFIRMED · </span>
            {order.handoff_confirmed_time}
          </div>
          {order.handoff_confirmed_location && (
            <div style={{ color: '#7BA05B' }}>
              <span style={{ color: '#3C5A3C' }}>LOC · </span>{order.handoff_confirmed_location}
            </div>
          )}
          {order.handoff_proprietor_note && (
            <div style={{ color: '#6FA08F' }}>"{order.handoff_proprietor_note}"</div>
          )}
        </div>
      )}

      {/* Confirm slot modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              className="relative w-full max-w-sm border p-5 font-mono space-y-3"
              style={{ background: '#14110D', borderColor: '#5C4A33', clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
              initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button onClick={() => setOpen(false)} className="absolute top-3 right-3 opacity-40 hover:opacity-80" style={{ color: '#D8CFC0' }}>
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2" style={{ color: AMBER }}>
                <CalendarClock className="w-4 h-4" />
                <span className="text-[10px] tracking-[0.2em] font-bold">CONFIRM HANDOFF — {order.tracking_code}</span>
              </div>

              {done ? (
                <div className="flex flex-col items-center gap-3 py-4 text-center">
                  <Check className="w-8 h-8" style={{ color: '#7BA05B' }} />
                  <p className="text-[11px]" style={{ color: '#D8CFC0' }}>Slot confirmed. Buyer will see it on their order.</p>
                  <button onClick={() => setOpen(false)} className="px-4 py-1.5 text-[10px] font-bold" style={{ background: '#3A2810', border: '1px solid #C8893B', color: AMBER }}>
                    CLOSE
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-[9px] flex items-center gap-1" style={{ color: '#8A7E6C' }}>
                      <CalendarClock className="w-2.5 h-2.5" /> CONFIRMED TIME SLOT
                    </label>
                    <Input value={confirmedTime} onChange={(e) => setConfirmedTime(e.target.value)} className="h-8 text-xs" style={field} placeholder="e.g. Sat June 28 @ 2100 UTC" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] flex items-center gap-1" style={{ color: '#8A7E6C' }}>
                      <MapPin className="w-2.5 h-2.5" /> CONFIRMED MEETUP LOCATION
                    </label>
                    <Input value={confirmedLoc} onChange={(e) => setConfirmedLoc(e.target.value)} className="h-8 text-xs" style={field} placeholder="Specific cargo bay, pad, or station" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px]" style={{ color: '#8A7E6C' }}>NOTE TO BUYER (optional)</label>
                    <Textarea value={note} onChange={(e) => setNote(e.target.value)} className="text-xs h-16 resize-none" style={field} placeholder="Any special instructions for the meetup…" />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setOpen(false)} className="flex-1 py-1.5 text-[10px]" style={{ color: '#6A5A40' }}>CANCEL</button>
                    <motion.button
                      disabled={!confirmedTime.trim() || confirmMutation.isPending}
                      onClick={() => confirmMutation.mutate()}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      className="flex-1 py-1.5 text-[10px] font-bold inline-flex items-center justify-center gap-1.5 disabled:opacity-40"
                      style={{ background: 'linear-gradient(180deg, #A87C42, #6E4D24)', color: '#15100A' }}
                    >
                      {confirmMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                      CONFIRM
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}