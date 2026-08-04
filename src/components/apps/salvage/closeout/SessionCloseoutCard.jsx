import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Layers } from 'lucide-react';
import CommodityIcon from '@/components/brand/CommodityIcon';
import { closeoutText } from '@/components/apps/salvage/closeout/sessionCloseout';

const AMBER = '#E0A22E';
const TEAL = '#6FA08F';
const DIM = '#7A6E60';

/** The run, read whole the moment it is called finished. */
export default function SessionCloseoutCard({ session, summary }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(closeoutText(session, summary));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border p-3 space-y-3 font-mono"
      style={{ borderColor: '#5C4424', background: 'linear-gradient(180deg,#141108,#0B0906)' }}
    >
      <div className="flex items-center gap-2 text-[9px] tracking-[0.22em]" style={{ color: AMBER }}>
        <Layers className="w-3.5 h-3.5" /> RUN FINISHED — {session.session_name?.toUpperCase()}
        <span className="ml-auto font-normal" style={{ color: DIM }}>
          {session.ship || 'unknown hull'}{session.location ? ` · ${session.location}` : ''}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {summary.lines.map((l) => (
          <div key={l.code} className="border p-2 text-center space-y-1" style={{ borderColor: '#2A2118', background: '#111009' }}>
            <div className="flex justify-center"><CommodityIcon code={l.code} size={22} /></div>
            <div className="text-[8px] tracking-[0.18em]" style={{ color: TEAL }}>{l.code}</div>
            <div className="text-lg font-bold" style={{ color: l.scu > 0 ? AMBER : '#3A3028' }}>{l.scu.toLocaleString()}</div>
            <div className="text-[8px]" style={{ color: DIM }}>SCU</div>
            <div className="text-[9px] pt-1 border-t" style={{ borderColor: '#2A2118', color: l.value > 0 ? '#D8CFC0' : '#3A3028' }}>
              {l.value > 0 ? `~${l.value.toLocaleString()} aUEC` : '—'}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-end justify-between border-t pt-2" style={{ borderColor: '#2A2118' }}>
        <div>
          <div className="text-[8px] tracking-[0.2em]" style={{ color: DIM }}>TOTAL GATHERED</div>
          <div className="text-sm font-bold" style={{ color: TEAL }}>
            {summary.totalScu.toLocaleString()} SCU · {summary.hulls} hull{summary.hulls === 1 ? '' : 's'}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[8px] tracking-[0.2em]" style={{ color: DIM }}>ESTIMATED VALUE</div>
          <div className="text-xl font-bold" style={{ color: AMBER, textShadow: `0 0 16px ${AMBER}44` }}>
            {summary.total > 0 ? summary.total.toLocaleString() : '—'} <span className="text-[9px]" style={{ color: DIM }}>aUEC</span>
          </div>
        </div>
      </div>

      <p className="text-[8px] leading-relaxed" style={{ color: '#5F564A' }}>{summary.basis}</p>

      <button
        onClick={copy}
        className="h-8 px-3 border text-[9px] font-bold tracking-[0.14em] inline-flex items-center gap-2"
        style={{ borderColor: '#3A2F20', color: '#C8A05B', background: '#120D08' }}
      >
        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'COPIED' : 'COPY SUMMARY'}
      </button>
    </motion.div>
  );
}