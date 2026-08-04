import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import NextStepCard from '@/components/onboarding/NextStepCard';
import WaysInGrid from '@/components/onboarding/WaysInGrid';
import ListingAgreementGate from '@/components/hall/ListingAgreementGate';
import { storeCache } from '@/lib/localCache';

/**
 * Where a person lands: which of the three ways in is theirs, and the single next thing to do.
 * The state is read from the council's own records rather than assembled here, so a comrade is
 * never told they are settled on one screen and prompted on another.
 */
export default function LandingBranch() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['onboarding_state'],
    queryFn: () => base44.functions.getOnboardingState({}),
  });

  // Only the buyer's own tracking codes can name an order placed without an account, so the reason
  // to have one is counted from this device rather than asserted.
  const codesHeld = storeCache.getTrackingCodes().length;

  if (isLoading) {
    return <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin" style={{ color: '#E0A22E' }} /></div>;
  }
  const state = data?.data || data;
  if (!state?.next_step) return null;
  const step = state.next_step;

  return (
    <div className="space-y-2">
      <NextStepCard step={step} />

      {/* The charter is signed here, in full, rather than linked away to a board that cannot sign it. */}
      {step.action === 'sign_instrument' && step.instrument_id && (
        <ListingAgreementGate
          instrumentId={step.instrument_id}
          onSigned={() => qc.invalidateQueries({ queryKey: ['onboarding_state'] })}
        />
      )}

      {state.is_guest && state.account_gives?.length > 0 && (
        <ul className="border p-3 space-y-1 font-mono" style={{ borderColor: '#2E2519', background: '#0C0A07' }}>
          {state.account_gives.map((line) => (
            <li key={line} className="text-[9px] leading-relaxed" style={{ color: '#8A7E6C' }}>· {line}</li>
          ))}
        </ul>
      )}

      {codesHeld > 0 && (
        <p className="border p-3 text-[9px] leading-relaxed font-mono" style={{ borderColor: '#3A2F20', background: '#0C0A07', color: '#C8A05B' }}>
          {codesHeld} tracking code{codesHeld === 1 ? '' : 's'} {codesHeld === 1 ? 'is' : 'are'} held on this device.
          {state.has_account
            ? ' Claim those orders under MY ORDERS and they will follow your account onto any other device.'
            : ' They live only in this browser — an account is what stops them being lost with it.'}
        </p>
      )}

      <WaysInGrid standing={state.standing} />
    </div>
  );
}