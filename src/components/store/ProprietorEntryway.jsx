import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, KeyRound, MonitorCog, ShieldCheck } from 'lucide-react';

export default function ProprietorEntryway({ user }) {
  if (user?.role !== 'admin') return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="relative overflow-hidden border p-[1px] font-mono"
      style={{ borderColor: '#5C4424', background: 'linear-gradient(135deg, #8A6430, #1A1209 38%, #8A8F45 100%)', clipPath: 'polygon(18px 0,100% 0,100% calc(100% - 18px),calc(100% - 18px) 100%,0 100%,0 18px)' }}
    >
      <div className="relative p-4 md:p-5" style={{ background: 'linear-gradient(110deg, rgba(12,10,7,0.97), rgba(31,22,11,0.94), rgba(12,10,7,0.98))', clipPath: 'polygon(17px 0,100% 0,100% calc(100% - 17px),calc(100% - 17px) 100%,0 100%,0 17px)' }}>
        <div className="absolute inset-y-0 right-0 w-1/2 opacity-30" style={{ background: 'radial-gradient(circle at 70% 50%, rgba(224,162,46,0.22), transparent 36%), repeating-linear-gradient(90deg, transparent 0 16px, rgba(224,162,46,0.06) 16px 17px)' }} />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="relative shrink-0 w-12 h-12 border flex items-center justify-center" style={{ borderColor: '#E0A22E', background: '#100A04', clipPath: 'polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)', boxShadow: '0 0 22px rgba(224,162,46,0.18)' }}>
              <span className="absolute inset-1 border opacity-40" style={{ borderColor: '#8A8F45', clipPath: 'polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)' }} />
              <KeyRound className="w-5 h-5" style={{ color: '#E0A22E' }} />
            </div>
            <div>
              <p className="text-[9px] tracking-[0.28em] font-bold" style={{ color: '#8A8F45' }}>PROPRIETOR ACCESSWAY // SECURE</p>
              <h2 className="mt-1 text-lg md:text-xl font-bold tracking-[0.08em]" style={{ color: '#F2EADC' }}>Enter the Command Deck</h2>
              <p className="mt-1 max-w-2xl text-[11px] leading-relaxed" style={{ color: '#A89C8A' }}>
                Switch from buyer-facing storefront to internal FSIS operations: intake, fulfillment, payday, market sync, QA, and diagnostics.
              </p>
            </div>
          </div>

          <div className="relative flex flex-col sm:flex-row md:flex-col xl:flex-row gap-2 md:items-end">
            <div className="flex gap-2 text-[8px] tracking-[0.15em]">
              <span className="border px-2 py-1 flex items-center gap-1" style={{ borderColor: '#3A2F20', color: '#C8893B', background: '#0C0A07' }}><ShieldCheck className="w-3 h-3" /> ADMIN</span>
              <span className="border px-2 py-1 flex items-center gap-1" style={{ borderColor: '#3A2F20', color: '#8A8F45', background: '#0C0A07' }}><MonitorCog className="w-3 h-3" /> LIVE OPS</span>
            </div>
            <Link
              to="/ops"
              className="group h-10 px-4 border flex items-center justify-center gap-2 text-[10px] font-bold tracking-[0.16em] transition-all hover:brightness-125"
              style={{ borderColor: '#E0A22E', color: '#0C0A07', background: 'linear-gradient(135deg, #E0A22E, #C8893B)', clipPath: 'polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)' }}
            >
              OPEN COMMAND <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </motion.section>
  );
}