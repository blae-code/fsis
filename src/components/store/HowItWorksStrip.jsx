import React, { useState } from 'react';
import { storeCache } from '@/lib/localCache';
import { ShoppingCart, RadioTower, KeyRound, X } from 'lucide-react';

const STEPS = [
  { icon: ShoppingCart, title: 'BUILD MANIFEST', desc: 'Add wares from the catalog and set quantities.' },
  { icon: RadioTower, title: 'TRANSMIT ORDER', desc: 'Hold to transmit — you get a tracking code & passphrase.' },
  { icon: KeyRound, title: 'IN-PERSON HANDOFF', desc: 'Meet the FSIS crew in the \u2019verse and speak your passphrase.' },
];

/** Dismissible 3-step explainer for first-time buyers — in-game commerce is
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
      <p className="font-mono text-[9px] tracking-[0.25em] mb-2.5" style={{ color: '#6FA08F' }}>HOW BUYING WORKS</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {STEPS.map(({ icon: Icon, title, desc }, i) => (
          <div key={title} className="flex items-start gap-2.5">
            <span
              className="shrink-0 w-7 h-7 flex items-center justify-center border font-mono text-[10px] font-bold"
              style={{ borderColor: '#3C5A50', color: '#8FBFAE', background: '#101413' }}
            >
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="font-mono text-[10px] font-bold tracking-[0.12em] flex items-center gap-1.5" style={{ color: '#D8CFC0' }}>
                <Icon className="w-3 h-3" style={{ color: '#6FA08F' }} /> {title}
              </p>
              <p className="text-[10px] font-mono leading-relaxed mt-0.5" style={{ color: '#877D6D' }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}