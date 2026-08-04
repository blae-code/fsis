import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import NextStepCard from '@/components/onboarding/NextStepCard';
import WaysInGrid from '@/components/onboarding/WaysInGrid';

/**
 * Where a person lands: which of the three ways in is theirs, and the single next thing to do.
 * The state is read from the council's own records rather than assembled here, so a comrade is
 * never told they are settled on one screen and prompted on another.
 */
export default function LandingBranch() {
  const { data, isLoading } = useQuery({
    queryKey: ['onboarding_state'],
    queryFn: () => base44.functions.getOnboardingState({}),
  });

  if (isLoading) {
    return <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin" style={{ color: '#E0A22E' }} /></div>;
  }
  const state = data?.data || data;
  if (!state?.next_step) return null;

  return (
    <div className="space-y-2">
      <NextStepCard step={state.next_step} />
      {state.is_guest && state.account_gives?.length > 0 && (
        <ul className="border p-3 space-y-1 font-mono" style={{ borderColor: '#2E2519', background: '#0C0A07' }}>
          {state.account_gives.map((line) => (
            <li key={line} className="text-[9px] leading-relaxed" style={{ color: '#8A7E6C' }}>· {line}</li>
          ))}
        </ul>
      )}
      <WaysInGrid standing={state.standing} />
    </div>
  );
}