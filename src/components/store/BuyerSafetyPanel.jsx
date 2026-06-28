import React from 'react';
import { ShieldAlert } from 'lucide-react';

const RULES = ['Pay only in-game at handoff', 'Save tracking code', 'Keep passphrase private', 'Stock confirmed before fulfillment'];

export default function BuyerSafetyPanel() {
  return (
    <div className="border p-3 sm:p-2.5 font-mono" style={{ borderColor: '#5C4424', background: 'rgba(212,146,11,0.05)' }}>
      <div className="flex items-start gap-2">
        <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#E0A22E' }} />
        <div>
          <p className="text-[9px] font-bold tracking-[0.16em]" style={{ color: '#E0A22E' }}>BUYER SAFETY</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-1 mt-1">
            {RULES.map((rule) => <span key={rule} className="text-[9px] md:text-[8px] leading-snug" style={{ color: '#A89C8A' }}>• {rule}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}