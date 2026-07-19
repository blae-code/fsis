import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Loader2, PackageCheck } from 'lucide-react';

const fieldStyle = { borderColor: '#3A2F20', background: '#0E0C09', color: '#D8CFC0' };

export default function RestockNotifyModal({ product, onClose }) {
  const [handle, setHandle] = useState('');
  const [contact, setContact] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: () => base44.entities.restock_notify.create({
      product_id: product.id,
      product_name: product.product_name,
      handle: handle.trim(),
      contact: contact.trim(),
      request_type: 'reserve',
      desired_quantity: Math.max(1, Number(quantity) || 1),
      reserve_status: 'open',
      reserved_quantity: 0,
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
          className="relative w-full max-w-sm border p-5 font-mono space-y-4"
          style={{ background: '#14110D', borderColor: '#5C4A33', clipPath: 'polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)' }}
          initial={{ scale: 0.93, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-3 right-3 opacity-40 hover:opacity-80" style={{ color: '#D8CFC0' }}>
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2" style={{ color: '#C8A05B' }}>
            <PackageCheck className="w-4 h-4" />
            <span className="text-[10px] tracking-[0.25em] font-bold">RESERVE REQUEST</span>
          </div>

          {done ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <Check className="w-8 h-8" style={{ color: '#7BA05B' }} />
              <p className="text-sm" style={{ color: '#D8CFC0' }}>We've logged your request.</p>
              <p className="text-[10px]" style={{ color: '#7A6E60' }}>
                FSIS will reserve {Math.max(1, Number(quantity) || 1)} for {handle || 'you'} the next time <span style={{ color: '#E0A22E' }}>{product.product_name}</span> is found, then contact you via {contact || 'Spectrum/Discord'}.
              </p>
              <button onClick={onClose} className="mt-2 px-4 py-1.5 text-[10px] font-bold" style={{ background: '#3A2810', border: '1px solid #C8893B', color: '#E0A22E' }}>
                CLOSE
              </button>
            </div>
          ) : (
            <>
              <div>
                <p className="text-[10px]" style={{ color: '#7A6E60' }}>
                  <span style={{ color: '#E0A22E' }}>{product.product_name}</span> is currently out of stock.
                  Request a reserve and FSIS will hold the next found unit before it returns to public inventory.
                </p>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-[9px]" style={{ color: '#8A7E6C' }}>IN-GAME HANDLE *</Label>
                  <Input value={handle} onChange={(e) => setHandle(e.target.value)} className="h-8 text-xs" style={fieldStyle} placeholder="Your RSI handle" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px]" style={{ color: '#8A7E6C' }}>RESERVE QUANTITY</Label>
                  <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="h-8 text-xs" style={fieldStyle} />
                </div>
                <div className="space-y-1">
                  <Label className="text-[9px]" style={{ color: '#8A7E6C' }}>HOW TO REACH YOU (OPTIONAL)</Label>
                  <Input value={contact} onChange={(e) => setContact(e.target.value)} className="h-8 text-xs" style={fieldStyle} placeholder="Email, Discord @, Spectrum, or in-game comms" />
                </div>
              </div>

              {mutation.isError && (
                <p className="text-[10px]" style={{ color: '#C05050' }}>Failed — please try again.</p>
              )}

              <div className="flex gap-2 pt-1">
                <button onClick={onClose} className="flex-1 py-2 text-[10px]" style={{ color: '#6A5A40' }}>CANCEL</button>
                <motion.button
                  disabled={!handle.trim() || mutation.isPending}
                  onClick={() => mutation.mutate()}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                  className="flex-1 py-2 text-[10px] font-bold inline-flex items-center justify-center gap-1.5 disabled:opacity-40"
                  style={{ background: 'linear-gradient(180deg, #A87C42, #6E4D24)', color: '#15100A' }}
                >
                  {mutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <PackageCheck className="w-3 h-3" />}
                  RESERVE NEXT
                </motion.button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}