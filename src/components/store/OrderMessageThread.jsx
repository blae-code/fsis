import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, AlertTriangle, Loader2, Check } from 'lucide-react';

const fieldStyle = { borderColor: '#3A2F20', background: '#0E0C09', color: '#D8CFC0' };

export default function OrderMessageThread({ order, onClose }) {
  const [message, setMessage] = useState('');
  const [handle, setHandle] = useState(order.customer_handle || '');
  const [isCancelReq, setIsCancelReq] = useState(false);
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: () => base44.entities.order_message.create({
      tracking_code: order.tracking_code,
      sender: 'buyer',
      handle: handle.trim(),
      message: message.trim(),
      is_cancel_request: isCancelReq,
    }),
    onSuccess: () => setDone(true),
  });

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.72)' }}
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

          <div className="flex items-center gap-2" style={{ color: '#6FA08F' }}>
            <MessageSquare className="w-4 h-4" />
            <span className="text-[10px] tracking-[0.25em] font-bold">MESSAGE FSIS — {order.tracking_code}</span>
          </div>

          {done ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <Check className="w-8 h-8" style={{ color: '#7BA05B' }} />
              <p className="text-sm" style={{ color: '#D8CFC0' }}>Message transmitted.</p>
              <p className="text-[10px]" style={{ color: '#7A6E60' }}>
                {isCancelReq
                  ? 'Your cancellation request has been flagged. The crew will review and confirm via order status.'
                  : 'The FSIS operator will review your message and follow up in-game or via Spectrum.'}
              </p>
              <button onClick={onClose} className="mt-2 px-4 py-1.5 text-[10px] font-bold" style={{ background: '#3A2810', border: '1px solid #C8893B', color: '#E0A22E' }}>
                CLOSE
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <label className="text-[9px]" style={{ color: '#8A7E6C' }}>YOUR HANDLE</label>
                <Input value={handle} onChange={(e) => setHandle(e.target.value)} className="h-8 text-xs" style={fieldStyle} placeholder="RSI handle" />
              </div>

              <div className="space-y-1">
                <label className="text-[9px]" style={{ color: '#8A7E6C' }}>MESSAGE</label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="text-xs h-24 resize-none"
                  style={fieldStyle}
                  placeholder="Questions, special instructions, amendments…"
                />
              </div>

              {/* Cancel request toggle */}
              <button
                onClick={() => setIsCancelReq((v) => !v)}
                className="flex items-center gap-2 text-[10px] px-3 py-2 border w-full transition-colors"
                style={{
                  borderColor: isCancelReq ? '#C05050' : '#3A2F20',
                  background: isCancelReq ? 'rgba(192,80,80,0.08)' : 'transparent',
                  color: isCancelReq ? '#C05050' : '#7A6E60',
                }}
              >
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                {isCancelReq ? '⚑ FLAGGED AS CANCELLATION REQUEST' : 'Flag as cancellation request'}
              </button>

              {isCancelReq && (
                <p className="text-[9px]" style={{ color: '#7A6E60' }}>
                  Cancellation is only possible for <span style={{ color: '#E0A22E' }}>new</span> orders. The crew will confirm via order status update.
                </p>
              )}

              {mutation.isError && (
                <p className="text-[10px]" style={{ color: '#C05050' }}>Failed — please try again.</p>
              )}

              <div className="flex gap-2 pt-1">
                <button onClick={onClose} className="flex-1 py-2 text-[10px]" style={{ color: '#6A5A40' }}>CANCEL</button>
                <motion.button
                  disabled={!message.trim() || !handle.trim() || mutation.isPending}
                  onClick={() => mutation.mutate()}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className="flex-1 py-2 text-[10px] font-bold inline-flex items-center justify-center gap-1.5 disabled:opacity-40"
                  style={{ background: 'linear-gradient(180deg, #A87C42, #6E4D24)', color: '#15100A' }}
                >
                  {mutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  TRANSMIT
                </motion.button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}