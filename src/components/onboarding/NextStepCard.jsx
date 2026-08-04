import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowDown } from 'lucide-react';

/** Where each next step actually sends somebody. `null` means there is nothing to press. */
const ACTIONS = {
  optional_sign_in: { label: 'CREATE AN ACCOUNT', to: '/register' },
  open_work_board: { label: 'OPEN THE LABOUR BOARD', to: '/work' },
  // Signing happens in place, directly under this card — there is nowhere to send anybody.
  sign_instrument: null,
  request_standing: null,
  wait: null,
  none: null,
};

/** The one thing to do next — deliberately one, never a checklist. */
export default function NextStepCard({ step }) {
  if (!step || step.key === 'settled') return null;
  const action = ACTIONS[step.action];

  return (
    <div className="border p-4 space-y-2 font-mono" style={{ borderColor: '#5C4424', background: 'linear-gradient(135deg, #15110B, #0C0A07)' }}>
      <p className="text-[9px] tracking-[0.28em]" style={{ color: '#8A8F45' }}>// WHAT HAPPENS NEXT</p>
      <h3 className="text-sm font-bold tracking-[0.1em]" style={{ color: '#EDE5D6' }}>{step.title}</h3>
      {step.body && (
        <p className="text-[10px] leading-relaxed max-w-2xl" style={{ color: '#9C9080' }}>{step.body}</p>
      )}
      {step.why_not && (
        <p className="text-[9px] leading-relaxed" style={{ color: '#C8893B' }}>{step.why_not}</p>
      )}
      {action && (
        <Link
          to={action.to}
          className="h-9 px-4 border text-[9px] font-bold tracking-[0.14em] inline-flex items-center gap-2"
          style={{ borderColor: '#5C4424', color: '#E0A22E', background: '#120D08' }}
        >
          {action.label} <ArrowRight className="w-3 h-3" />
        </Link>
      )}
      {step.action === 'request_standing' && step.may_ask_again !== false && (
        <a
          href="#offer-your-labour"
          className="h-9 px-4 border text-[9px] font-bold tracking-[0.14em] inline-flex items-center gap-2"
          style={{ borderColor: '#5C4424', color: '#E0A22E', background: '#120D08' }}
        >
          TAKE ME TO THE FORM <ArrowDown className="w-3 h-3" />
        </a>
      )}
    </div>
  );
}