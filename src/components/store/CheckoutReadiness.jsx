import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';

export default function CheckoutReadiness({ cart, handle, location }) {
  const steps = [
    { label: 'MANIFEST', done: cart.length > 0 },
    { label: 'HANDLE', done: handle.trim().length > 0 },
    { label: 'DESTINATION', done: Boolean(location) },
  ];
  const missing = steps.filter((s) => !s.done).map((s) => s.label.toLowerCase());

  return (
    <div className="border p-2.5 font-mono" style={{ borderColor: '#2A2118', background: 'rgba(10,8,6,0.45)' }}>
      <div className="grid grid-cols-3 gap-1.5">
        {steps.map((step, idx) => {
          const Icon = step.done ? CheckCircle2 : Circle;
          return (
            <div key={step.label} className="flex items-center gap-1.5 text-[8px] tracking-[0.14em]">
              <Icon className="w-3 h-3" style={{ color: step.done ? '#6FA08F' : '#5C4A33' }} />
              <span style={{ color: step.done ? '#D8CFC0' : '#6B6155' }}>{idx + 1}. {step.label}</span>
            </div>
          );
        })}
      </div>
      {missing.length > 0 ? (
        <p className="text-[9px] mt-2" style={{ color: '#8A7E6C' }}>Next: add {missing[0]} to unlock transmission.</p>
      ) : (
        <p className="text-[9px] mt-2" style={{ color: '#6FA08F' }}>Ready to transmit — hold the confirm control when satisfied.</p>
      )}
    </div>
  );
}