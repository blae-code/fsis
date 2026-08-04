import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import MilestoneTrack from '@/components/work/progress/MilestoneTrack';
import OutstandingList from '@/components/work/progress/OutstandingList';
import StandingMeter from '@/components/work/progress/StandingMeter';
import { milestones, outstanding, standingModel } from '@/components/work/progress/contractorProgress';

/** A comrade's own progress: how far in they are, what is owing, and where they stand. */
export default function ContractorProgressDesk({ user, mine = [], upcoming = [] }) {
  const { data, isLoading } = useQuery({
    queryKey: ['onboarding_state'],
    queryFn: () => base44.functions.getOnboardingState({}),
  });
  const state = data?.data || data;

  const steps = useMemo(() => milestones({ state, mine }), [state, mine]);
  const items = useMemo(() => outstanding({ state, mine, upcoming, userId: user?.id }), [state, mine, upcoming, user]);
  const m = useMemo(() => standingModel(user), [user]);

  if (isLoading) {
    return <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin" style={{ color: '#E0A22E' }} /></div>;
  }

  return (
    <div className="grid lg:grid-cols-3 gap-2 items-start">
      <MilestoneTrack steps={steps} />
      <OutstandingList items={items} />
      <StandingMeter m={m} />
    </div>
  );
}