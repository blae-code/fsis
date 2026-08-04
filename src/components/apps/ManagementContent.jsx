import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ShieldAlert } from 'lucide-react';
import QuickLogModal from '@/components/apps/management/QuickLogModal';
import ConsoleShell from '@/components/console/ConsoleShell';
import { CONSOLE_GROUPS } from '@/components/console/consoleMap';
import { hasCouncilAccess, fsisRole, ROLE_META } from '@/lib/roles';
import { displayHandle } from '@/lib/displayName';

const AMBER  = '#E0A22E';
const DIM    = '#7A6E60';
const DIMMER = '#3A3028';

export default function ManagementContent() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center font-mono" style={{ background: '#0A0806' }}>
        <span className="text-[10px] tracking-[0.2em]" style={{ color: DIM }}>VERIFYING CLEARANCE…</span>
      </div>
    );
  }

  if (!hasCouncilAccess(user)) {
    return (
      <div className="h-full flex items-center justify-center font-mono" style={{ background: '#0A0806' }}>
        <div className="text-center space-y-2 px-6">
          <ShieldAlert className="w-8 h-8 mx-auto" style={{ color: '#C05050' }} />
          <div className="text-xs tracking-[0.25em]" style={{ color: '#C05050' }}>COUNCIL STANDING REQUIRED</div>
          <p className="text-[9px] max-w-md mx-auto leading-relaxed" style={{ color: DIM }}>
            These tools belong to the comrades who hold the yard in common. Owner standing is extended by the
            proprietor — it is never applied for.
          </p>
        </div>
      </div>
    );
  }

  const header = (
    <div className="shrink-0 px-3 py-2 border-b flex items-center gap-2" style={{ borderColor: '#2A2118', background: '#0A0806' }}>
      <span style={{ color: AMBER }}>◈</span>
      <span className="text-[9px] tracking-[0.25em]" style={{ color: '#7A6050' }}>COUNCIL CONSOLE — HELD IN COMMON</span>
      <span className="text-[8px] ml-auto flex items-center gap-2">
        <span style={{ color: ROLE_META[fsisRole(user)].color }}>{ROLE_META[fsisRole(user)].label}</span>
        <span style={{ color: DIMMER }}>{displayHandle(user)}</span>
      </span>
    </div>
  );

  return (
    <>
      <QuickLogModal />
      <ConsoleShell groups={CONSOLE_GROUPS} header={header} />
    </>
  );
}