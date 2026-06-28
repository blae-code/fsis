import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

const STEPS = [
  { id: 'catalog', label: 'BROWSE' },
  { id: 'manifest', label: 'MANIFEST' },
  { id: 'quote', label: 'QUOTE' },
  { id: 'orders', label: 'TRACK' },
];

export default function BuyerProgressRail({ activeTab, cartCount }) {
  return (
    <div className="border px-3 py-2 font-mono" style={{ borderColor: '#2A2118', background: 'rgba(10,8,6,0.62)' }}>
      <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-2 overflow-x-auto">
        {STEPS.map((step, index) => {
          const done = step.id === 'manifest' ? cartCount > 0 : activeTab === step.id;
          const active = activeTab === step.id || (step.id === 'manifest' && cartCount > 0);
          const Icon = done ? CheckCircle2 : Circle;
          return (
            <div key={step.id} className="flex items-center gap-2 shrink-0">
              {index > 0 && <span className="w-3 sm:w-5 h-px" style={{ background: active ? '#8A6430' : '#2A2118' }} />}
              <span className="inline-flex items-center gap-1 sm:gap-1.5 text-[8px] tracking-[0.1em] sm:tracking-[0.14em]" style={{ color: active ? '#E0A22E' : '#6B6155' }}>
                <Icon className="w-3 h-3" /> {index + 1}. {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}