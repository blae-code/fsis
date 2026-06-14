import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { FileSignature, Crosshair, X } from 'lucide-react';

const AMBER = '#E0A22E';
const TEAL  = '#5F9A8C';
const DIM   = '#1A1208';

const TYPE_META = {
  contract: {
    label: 'NEW CONTRACT',
    sublabel: 'INCOMING OPPORTUNITY',
    Icon: FileSignature,
    color: AMBER,
    border: '#3A2A10',
  },
  salvage: {
    label: 'SALVAGE SESSION',
    sublabel: 'OP LOGGED',
    Icon: Crosshair,
    color: TEAL,
    border: '#1A3028',
  },
};

function Toast({ id, type, title, sub, onDismiss }) {
  const meta = TYPE_META[type] || TYPE_META.contract;
  const { label, sublabel, Icon, color, border: borderColor } = meta;

  useEffect(() => {
    const t = setTimeout(() => onDismiss(id), 6000);
    return () => clearTimeout(t);
  }, [id, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 280, damping: 26 }}
      className="relative w-72 font-mono overflow-hidden"
      style={{
        background: '#0C0A06',
        border: `1px solid ${borderColor}`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.7), 0 0 20px ${color}18`,
        clipPath: 'polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)',
      }}
    >
      {/* Top accent line */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{ background: color, boxShadow: `0 0 10px ${color}` }}
        initial={{ scaleX: 0, transformOrigin: 'left' }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.4 }}
      />

      {/* Scan-sweep overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `linear-gradient(90deg, transparent 0%, ${color}08 50%, transparent 100%)` }}
        initial={{ x: '-100%' }}
        animate={{ x: '200%' }}
        transition={{ duration: 0.8, delay: 0.1 }}
      />

      {/* Content */}
      <div className="flex items-start gap-3 p-3">
        {/* Icon frame */}
        <div className="shrink-0 w-8 h-8 flex items-center justify-center rounded-sm mt-0.5"
          style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Header labels */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[8px] tracking-[0.3em]" style={{ color }}>
              {label}
            </span>
            <span className="text-[7px] tracking-[0.15em]" style={{ color: '#4A3A24' }}>
              {sublabel}
            </span>
          </div>

          {/* Title */}
          <div className="text-[11px] leading-snug text-foreground truncate">{title}</div>

          {/* Sub-info */}
          {sub && (
            <div className="text-[9px] mt-0.5 truncate" style={{ color: '#6A5A40' }}>{sub}</div>
          )}
        </div>

        {/* Dismiss */}
        <button onClick={() => onDismiss(id)} className="shrink-0 mt-0.5 opacity-40 hover:opacity-100 transition-opacity">
          <X className="w-3 h-3" style={{ color: '#8A7A60' }} />
        </button>
      </div>

      {/* Countdown drain bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5"
        style={{ background: `${color}50` }}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 6, ease: 'linear' }}
      />
    </motion.div>
  );
}

let _push = null;
export function pushOpsAlert(type, title, sub) {
  if (_push) _push({ id: `${type}_${Date.now()}`, type, title, sub });
}

export default function OpsAlertToast() {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((toast) => {
    setToasts(prev => [toast, ...prev].slice(0, 4));
  }, []);

  useEffect(() => {
    _push = push;
    return () => { _push = null; };
  }, [push]);

  // Subscribe to contract creates
  useEffect(() => {
    const unsub = base44.entities.contract.subscribe((event) => {
      if (event.type !== 'create') return;
      const d = event.data || {};
      push({
        id: `contract_${event.id || Date.now()}`,
        type: 'contract',
        title: d.title || 'New contract received',
        sub: [d.contract_type?.replace(/_/g,' ').toUpperCase(), d.payout_auec ? `${d.payout_auec.toLocaleString()} aUEC` : null, d.counterparty].filter(Boolean).join(' · '),
      });
    });
    return unsub;
  }, [push]);

  // Subscribe to salvage_session creates
  useEffect(() => {
    const unsub = base44.entities.salvage_session.subscribe((event) => {
      if (event.type !== 'create') return;
      const d = event.data || {};
      push({
        id: `salvage_${event.id || Date.now()}`,
        type: 'salvage',
        title: d.session_name || 'New salvage session logged',
        sub: [d.ship, d.location, d.status?.toUpperCase()].filter(Boolean).join(' · '),
      });
    });
    return unsub;
  }, [push]);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <div className="fixed bottom-16 right-4 z-[600] flex flex-col gap-2 items-end pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <Toast {...t} onDismiss={dismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}