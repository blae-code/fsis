import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Copy, Check, ShieldAlert, X } from 'lucide-react';
import PassphraseSigil from '@/components/brand/glyphs/PassphraseSigil';

function CopyRow({ label, value, big, Icon }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className="border p-3 flex items-center justify-between gap-3" style={{ borderColor: '#3A2F20', background: '#0E0C09' }}>
      <div className="min-w-0">
        <p className="text-[9px] font-mono tracking-[0.2em] flex items-center gap-1" style={{ color: '#6FA08F' }}>
          {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}{label}
        </p>
        <p className={`font-mono font-bold tracking-[0.1em] truncate ${big ? 'text-xl' : 'text-sm'}`} style={{ color: '#F0B43A' }}>{value}</p>
      </div>
      <button
        onClick={copy}
        className="shrink-0 px-2.5 py-1.5 border font-mono text-[9px] font-bold inline-flex items-center gap-1 hover:brightness-125 transition-all"
        style={{ borderColor: '#3C5A50', color: '#7FB3A0', background: '#101413' }}
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'COPIED' : 'COPY'}
      </button>
    </div>
  );
}

/** Full-screen post-transmit confirmation — makes losing the tracking code
 *  and handoff passphrase nearly impossible. */
export default function OrderReceiptModal({ order, open, onClose }) {
  if (!open || !order) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(8, 7, 6, 0.88)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative w-full max-w-md border p-5 space-y-4"
        style={{
          borderColor: '#8A6430',
          background: '#14110D',
          clipPath: 'polygon(16px 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%, 0 16px)',
          boxShadow: '0 0 40px rgba(212, 146, 11, 0.15)',
        }}
      >
        <button onClick={onClose} className="absolute top-3 right-3 hover:opacity-70" style={{ color: '#8A7E6C' }}>
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-6 h-6" style={{ color: '#7BA05B' }} />
          <div>
            <h2 className="font-mono text-sm font-bold tracking-[0.15em]" style={{ color: '#F2EADC' }}>TRANSMISSION CONFIRMED</h2>
            <p className="text-[10px] font-mono" style={{ color: '#877D6D' }}>Your order is in the FSIS queue.</p>
          </div>
        </div>

        <CopyRow label="TRACKING CODE" value={order.tracking_code} big />
        {order.passphrase && <CopyRow label="HANDOFF PASSPHRASE — SPOKEN AT DELIVERY" value={order.passphrase} Icon={PassphraseSigil} />}

        <div className="flex items-start gap-2 border p-2.5" style={{ borderColor: '#5C4424', background: 'rgba(212, 146, 11, 0.05)' }}>
          <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#E0A22E' }} />
          <p className="text-[10px] font-mono leading-relaxed" style={{ color: '#A89C8A' }}>
            Save both codes now. They are saved on this device, but they're your only way to track or cancel this order from anywhere else.
          </p>
        </div>

        <div className="font-mono text-[10px] space-y-1" style={{ color: '#877D6D' }}>
          {(order.items || []).map((i) => (
            <div key={i.product_id} className="flex justify-between">
              <span>{i.quantity}x {i.code || i.product_name}</span>
              <span>{(i.unit_price * i.quantity).toLocaleString()} aUEC</span>
            </div>
          ))}
          <div className="flex justify-between border-t pt-1.5 mt-1.5 font-bold" style={{ borderColor: '#3A2F20' }}>
            <span style={{ color: '#A89C8A' }}>TOTAL{order.location ? ` — ${order.location}` : ''}</span>
            <span style={{ color: '#F0B43A' }}>{(order.total || 0).toLocaleString()} aUEC</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full h-9 font-mono text-[10px] font-bold tracking-[0.15em] hover:brightness-110 transition-all"
          style={{
            background: 'linear-gradient(180deg, #A87C42, #6E4D24)',
            color: '#15100A',
            clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
          }}
        >
          UNDERSTOOD — CODES SAVED
        </button>
      </motion.div>
    </div>
  );
}