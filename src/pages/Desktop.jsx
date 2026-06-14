import React, { useState, useCallback, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import BootSequence from '@/components/os/BootSequence';
import OperatorOnboarding from '@/components/os/onboarding/OperatorOnboarding';
import StatusBar from '@/components/os/StatusBar';
import DesktopBackground from '@/components/os/DesktopBackground';
import Dock from '@/components/os/Dock';
import AppWindow from '@/components/os/AppWindow';
import Taskbar from '@/components/os/Taskbar';
import InstallPrompt from '@/components/os/InstallPrompt';
import { WindowProvider, useWindows } from '@/lib/windowContext.jsx';
import { resolveContentById } from '@/lib/resolveAppContent.jsx';
import { localCache } from '@/lib/localCache';
import CommandPalette from '@/components/os/CommandPalette';
import MobileNav from '@/components/os/MobileNav';
import ProprietorKey from '@/components/os/ProprietorKey';
import CommandAccess from '@/components/os/CommandAccess';
import OpsAlertToast from '@/components/os/OpsAlertToast';

function DesktopShell({ userRole }) {
  const { windows } = useWindows();
  const [cmdOpen, setCmdOpen] = React.useState(false);

  // Cmd+K / Ctrl+K opens command palette
  React.useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(o => !o);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="os-viewport flex flex-col overflow-hidden relative">
      {/* Background */}
      <DesktopBackground />

      {/* Status Bar */}
      <StatusBar />

      {/* Desktop area */}
      <div className="flex-1 relative flex flex-col items-center justify-center">
        {/* App Dock - centered */}
        <Dock userRole={userRole} />

        {/* Floating windows */}
        <AnimatePresence>
          {windows.filter(w => !w.minimized).map(win => (
            <AppWindow key={win.appId} window={win} />
          ))}
        </AnimatePresence>

        {/* Taskbar for open windows */}
        <Taskbar />

        {/* PWA install prompt */}
        <InstallPrompt />

        {/* Proprietor access key — admin only */}
        <ProprietorKey />
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />

      {/* Command palette */}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />

      {/* Hidden command access sequence — admin only */}
      <CommandAccess userRole={userRole} />

      {/* Ops alert toasts — contract & salvage session notifications */}
      <OpsAlertToast />
    </div>
  );
}

export default function Desktop() {
  const [booted, setBooted] = useState(() => localCache.hasBooted());

  const { data: user, isLoading, refetch } = useQuery({ queryKey: ['user'], queryFn: () => base44.auth.me() });
  const needsOnboarding = booted && user && !user.onboarded;

  const handleBootComplete = useCallback(() => {
    localCache.markBooted();
    setBooted(true);
  }, []);

  // Guests (not logged in) have no business on the OS desktop — send them to the storefront
  if (!isLoading && !user) {
    return <Navigate to="/" replace />;
  }

  return (
    <WindowProvider resolveContent={resolveContentById}>
      {!booted && <BootSequence onComplete={handleBootComplete} />}
      {booted && <DesktopShell userRole={user?.role} />}
      <AnimatePresence>
        {needsOnboarding && (
          <OperatorOnboarding user={user} onComplete={refetch} />
        )}
      </AnimatePresence>
    </WindowProvider>
  );
}