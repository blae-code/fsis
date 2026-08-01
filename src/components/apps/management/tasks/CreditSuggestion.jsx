import React, { useState } from 'react';
import { suggestTaskCredit } from '@/functions/suggestTaskCredit';
import { Scale, Loader2 } from 'lucide-react';

/**
 * What comparable labour has actually been paid. It suggests and never sets — the working is
 * shown so the council, and any comrade later reading the brief, can audit the figure.
 */
export default function CreditSuggestion({ category, estimatedHours, onUse }) {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    setLoading(true);
    try {
      const { data } = await suggestTaskCredit({ category, estimated_hours: Number(estimatedHours) || 0 });
      setState(data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={ask}
        disabled={loading}
        className="h-7 px-2 border text-[8px] font-bold tracking-[0.12em] inline-flex items-center gap-1 disabled:opacity-40"
        style={{ borderColor: '#3A2F20', color: '#C8A05B', background: '#120D08' }}
      >
        {loading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Scale className="w-2.5 h-2.5" />} WHAT HAS THIS WORK PAID?
      </button>
      {state && (
        <div className="border p-2 space-y-1" style={{ borderColor: '#2E2519', background: '#0C0A07' }}>
          {state.suggested_auec ? (
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold" style={{ color: '#8A8F45' }}>
                {state.suggested_auec.toLocaleString()} aUEC
              </span>
              <button
                type="button"
                onClick={() => onUse(state.suggested_auec)}
                className="h-6 px-2 border text-[8px] font-bold tracking-[0.12em]"
                style={{ borderColor: '#8A8F4555', color: '#8A8F45', background: '#0E1009' }}
              >
                USE THIS FIGURE
              </button>
            </div>
          ) : (
            <div className="text-[9px]" style={{ color: '#C8893B' }}>NO FIGURE OFFERED</div>
          )}
          <p className="text-[8px] leading-relaxed" style={{ color: '#8A7E6C' }}>{state.basis}</p>
        </div>
      )}
    </div>
  );
}