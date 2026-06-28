import React, { useState, useCallback, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
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

function AccessDenied() {
  return (
    <div className="os-viewport flex items-center justify-center font-mono" style={{ background: '#0A0806' }}>
      <div className="border p-6 text-center space-y-3 max-w-sm" style={{ borderColor: '#5C302A', background: '#120D0A' }}>
        <ShieldAlert className="w-9 h-9 mx-auto" style={{ color: '#C05050' }} />
        <div className="text-xs tracking-[0.28em] font-bold" style={{ color: '#C05050' }}>PROPRIETOR CLEARANCE REQUIRED</div>
        <p className="text-[10px] leading-relaxed" style={{ color: '#8A7E6C' }}>
          The FSIS operations desktop is restricted to admin personnel. Return to the public storefront for ordering and tracking.
        </p>
        <button
          onClick={() => { window.location.href = '/'; }}
          className="px-4 py-2 text-[10px] font-bold tracking-[0.15em]"
          style={{ background: 'linear-gradient(180deg, #A87C42, #6E4D24)', color: '#15100A' }}
        >
          RETURN TO STOREFRONT
        </button>
      </div>
    </div>
  );
}

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
        <div className="hidden md:block">
          <Dock userRole={userRole} />
        </div>

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

  const { data: user, isLoading } = useQuery({ queryKey: ['user'], queryFn: () => base44.auth.me() });
  const needsOnboarding = false;

  const handleBootComplete = useCallback(() => {
    localCache.markBooted();
    setBooted(true);
  }, []);

  if (isLoading) {
    return (
      <div className="os-viewport flex items-center justify-center" style={{ background: '#0A0806' }}>
        <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Guests have no business on the OS desktop — send them to the storefront.
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // The internal OS is proprietor-focused for live deployment.
  if (user.role !== 'admin') {
    return <AccessDenied />;
  }

  return (
    <WindowProvider resolveContent={resolveContentById}>
      {!booted && <BootSequence onComplete={handleBootComplete} />}
      {booted && <DesktopShell userRole={user?.role} />}
      <AnimatePresence>
        {needsOnboarding && (
          <OperatorOnboarding user={user} onComplete={() => {}} />
        )}
      </AnimatePresence>
    </WindowProvider>
  );
}