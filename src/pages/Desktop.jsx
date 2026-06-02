import React, { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import BootSequence from '@/components/os/BootSequence';
import StatusBar from '@/components/os/StatusBar';
import DesktopBackground from '@/components/os/DesktopBackground';
import Dock from '@/components/os/Dock';
import AppWindow from '@/components/os/AppWindow';
import Taskbar from '@/components/os/Taskbar';
import InstallPrompt from '@/components/os/InstallPrompt';
import { WindowProvider, useWindows } from '@/lib/windowContext.jsx';
import { resolveContentById } from '@/lib/resolveAppContent.jsx';
import { localCache } from '@/lib/localCache';

function DesktopShell() {
  const { windows } = useWindows();

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden relative">
      {/* Background */}
      <DesktopBackground />

      {/* Status Bar */}
      <StatusBar />

      {/* Desktop area */}
      <div className="flex-1 relative flex flex-col items-center justify-center">
        {/* App Dock - centered */}
        <Dock />

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
      </div>
    </div>
  );
}

export default function Desktop() {
  // Skip the full boot sequence on return visits for a faster, app-like feel
  const [booted, setBooted] = useState(() => localCache.hasBooted());

  const handleBootComplete = useCallback(() => {
    localCache.markBooted();
    setBooted(true);
  }, []);

  return (
    <WindowProvider resolveContent={resolveContentById}>
      {!booted && <BootSequence onComplete={handleBootComplete} />}
      {booted && <DesktopShell />}
    </WindowProvider>
  );
}