import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { storeCache } from '@/lib/localCache';
import { X } from 'lucide-react';
import { ManifestPicto, TransmitPicto, HandoffPicto } from '@/components/brand/glyphs/StepPictograms';
import { Clock } from 'lucide-react';

const ClockIcon = ({ className }) => <Clock className={className} />;

const STEPS = [
  { icon: ManifestPicto,  title: 'BUILD MANIFEST',    desc: 'Add wares from the catalog and set quantities. Use Bulk Quote for large SCU orders.' },
  { icon: TransmitPicto,  title: 'TRANSMIT ORDER',    desc: 'Hold to transmit — you receive a tracking code, passphrase, and handoff scheduling link.' },
  { icon: ClockIcon,      title: 'SCHEDULE HANDOFF',  desc: 'Propose a meetup time and location via the order card. FSIS confirms or counters.' },
  { icon: HandoffPicto,   title: 'IN-PERSON HANDOFF', desc: 'Meet the crew in the \'verse, speak your passphrase, and complete the aUEC trade window.' },
];

/** Dismissible 4-step explainer for first-time buyers — in-game commerce is
 *  unusual and the handoff flow needs spelling out once. */
export default function HowItWorksStrip() {
  const [hidden, setHidden] = useState(() => storeCache.hasDismissedHowTo());
  if (hidden) return null;

  return (
    <div className="relative border p-3 sm:p-4" style={{ borderColor: '#2E423B', background: 'rgba(95, 154, 140, 0.04)' }}>
      <button
        onClick={() => { storeCache.dismissHowTo(); setHidden(true); }}
        className="absolute top-2 right-2 hover:opacity-70"
        style={{ color: '#6F6557' }}
        title="Dismiss"
      >
        <X className="w-3.5 h-3.5" />
      </button>
      <div className="flex items-center justify-between mb-2.5 flex-wrap gap-2">
        <p className="font-mono text-[9px] tracking-[0.25em]" style={{ color: '#6FA08F' }}>HOW BUYING WORKS</p>
        <p className="font-mono text-[9px] tracking-[0.12em] px-2 py-0.5 border" style={{ borderColor: '#2E423B', color: '#6FA08F', background: 'rgba(95,154,140,0.06)' }}>
          ◈ NO ACCOUNT REQUIRED — JUST YOUR IN-GAME HANDLE
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-0">
        {STEPS.map(({ icon: Icon, title, desc }, i) => (
          <div key={title} className="flex items-start gap-2.5 relative">
            {/* Step connector line between items */}
            {i < STEPS.length - 1 && (
              <motion.div
                className="hidden sm:block absolute right-0 top-4 w-px h-4 -translate-y-1/2"
                style={{ background: 'linear-gradient(180deg, #3C5A50, transparent)' }}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: i * 0.2 + 0.4, duration: 0.4 }}
              />
            )}
            <div className="flex items-start gap-2.5 p-3 flex-1">
              <motion.span
                className="shrink-0 w-8 h-8 flex items-center justify-center border"
                style={{ borderColor: '#3C5A50', color: '#8FBFAE', background: '#101413', clipPath: 'polygon(4px 0, 100% 0, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0 100%, 0 4px)' }}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.15, type: 'spring', stiffness: 300, damping: 22 }}
              >
                <Icon className="w-5 h-5" />
              </motion.span>
              <div className="min-w-0">
                <p className="font-mono text-[10px] font-bold tracking-[0.12em]" style={{ color: '#D8CFC0' }}>
                  <span style={{ color: '#6FA08F' }}>0{i + 1} ·</span> {title}
                </p>
                <p className="text-[10px] font-mono leading-relaxed mt-0.5" style={{ color: '#877D6D' }}>{desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}