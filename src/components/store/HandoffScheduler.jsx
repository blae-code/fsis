import React, { useState } from 'react';
import { updateHandoff } from '@/functions/updateHandoff';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarClock, X, Send, Loader2, Check, MapPin, Radio } from 'lucide-react';

const field = { borderColor: '#3A2F20', background: '#0E0C09', color: '#D8CFC0' };

export default function HandoffScheduler({ order, onClose }) {
  const qc = useQueryClient();
  const [time, setTime] = useState(order.handoff_proposed_time || '');
  const [location, setLocation] = useState(order.handoff_location || order.delivery_location || '');
  const [contact, setContact] = useState(order.handoff_contact || '');
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: () => updateHandoff({
      tracking_code: order.tracking_code,
      handoff_proposed_time: time.trim(),
      handoff_location: location.trim(),
      handoff_contact: contact.trim(),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tracked_orders'] });
      qc.invalidateQueries({ queryKey: ['my_account_orders'] });
      qc.invalidateQueries({ queryKey: ['all_orders'] });
      setDone(true);
    },
  });

  const isEdit = order.handoff_status === 'requested';

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.75)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-full max-w-md border p-5 font-mono space-y-4"
          style={{ background: '#14110D', borderColor: '#5C4A33', clipPath: 'polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)' }}
          initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-3 right-3 opacity-40 hover:opacity-80" style={{ color: '#D8CFC0' }}>
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2" style={{ color: '#E0A22E' }}>
            <CalendarClock className="w-4 h-4" />
            <span className="text-[10px] tracking-[0.25em] font-bold">
              {isEdit ? 'UPDATE HANDOFF REQUEST' : 'SCHEDULE HANDOFF'} — {order.tracking_code}
            </span>
          </div>

          <p className="text-[10px] leading-relaxed" style={{ color: '#7A6E60' }}>
            Propose a time and location for the in-game transfer. The Proprietor will confirm or suggest an alternative — check back here for the confirmed slot.
          </p>

          {done ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <Check className="w-8 h-8" style={{ color: '#7BA05B' }} />
              <p className="text-sm" style={{ color: '#D8CFC0' }}>Handoff request transmitted.</p>
              <p className="text-[10px]" style={{ color: '#7A6E60' }}>
                The Proprietor will review and confirm a slot. Watch your order status for updates.
              </p>
              <button onClick={onClose} className="mt-2 px-4 py-1.5 text-[10px] font-bold" style={{ background: '#3A2810', border: '1px solid #C8893B', color: '#E0A22E' }}>
                CLOSE
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <label className="text-[9px] flex items-center gap-1" style={{ color: '#8A7E6C' }}>
                  <CalendarClock className="w-2.5 h-2.5" /> AVAILABILITY WINDOW
                </label>
                <Input
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="h-8 text-xs" style={field}
                  placeholder="e.g. Fri–Sun ~2000–2300 UTC, or weekday evenings PST"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] flex items-center gap-1" style={{ color: '#8A7E6C' }}>
                  <MapPin className="w-2.5 h-2.5" /> PREFERRED MEETUP LOCATION
                </label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="h-8 text-xs" style={field}
                  placeholder="e.g. Lorville, Teasa Spaceport — Cargo Bay 3"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] flex items-center gap-1" style={{ color: '#8A7E6C' }}>
                  <Radio className="w-2.5 h-2.5" /> CONTACT / COMMS CHANNEL
                </label>
                <Input
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="h-8 text-xs" style={field}
                  placeholder="Spectrum DM, Discord handle, or in-game party invite"
                />
              </div>

              {mutation.isError && (
                <p className="text-[10px]" style={{ color: '#C05050' }}>Transmission failed — please try again.</p>
              )}

              <div className="flex gap-2 pt-1">
                <button onClick={onClose} className="flex-1 py-2 text-[10px]" style={{ color: '#6A5A40' }}>CANCEL</button>
                <motion.button
                  disabled={!time.trim() || mutation.isPending}
                  onClick={() => mutation.mutate()}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className="flex-1 py-2 text-[10px] font-bold inline-flex items-center justify-center gap-1.5 disabled:opacity-40"
                  style={{ background: 'linear-gradient(180deg, #A87C42, #6E4D24)', color: '#15100A' }}
                >
                  {mutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  TRANSMIT REQUEST
                </motion.button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}