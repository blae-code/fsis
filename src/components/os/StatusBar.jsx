import React, { useState, useEffect, useCallback } from 'react';
import { Wifi, WifiOff, Shield, Maximize2, Minimize2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useFullscreen } from '@/lib/useFullscreen';
import FsisLogo from '@/components/brand/FsisLogo';
import { FSIS } from '@/lib/fsisLore';
import NotificationBell from '@/components/os/NotificationBell';
import UexStalenessIndicator from '@/components/os/UexStalenessIndicator';
import VersionUpdatesIndicator from '@/components/os/VersionUpdatesIndicator';

export default function StatusBar() {
  const [time, setTime] = useState(new Date());
  const [online, setOnline] = useState(navigator.onLine);
  const { isFullscreen, toggle } = useFullscreen();
  const { data: user } = useQuery({ queryKey: ['user'], queryFn: () => base44.auth.me() });

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const formatTime = (d) => {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };

  const formatDate = (d) => {
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <motion.div
      className="h-10 flex items-center justify-between px-4 relative z-[200] select-none"
      style={{
        background: 'linear-gradient(to right, hsl(30, 12%, 6%, 0.95), hsl(30, 10%, 5%, 0.95))',
        borderBottom: '1px solid hsl(33, 18%, 17%, 0.6)',
        backdropFilter: 'blur(12px)',
      }}
      initial={{ y: -40 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
    >
      {/* Left: FSIS branding */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <FsisLogo size={22} glow />
          <span className="font-mono text-xs font-bold tracking-[0.2em] text-primary">
            FSIS
          </span>
        </div>
        <div className="h-4 w-px bg-border/40" />
        <span className="font-mono text-[10px] text-muted-foreground tracking-wider">
          FAIRSHARE INDUSTRIAL
        </span>
        <span className="font-mono text-[9px] text-muted-foreground/40 tracking-wider hidden lg:inline">
          {FSIS.license}
        </span>
      </div>

      {/* Center: Clock */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
        <span className="font-mono text-xs text-foreground/80 tracking-wider">
          {formatTime(time)}
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {formatDate(time)}
        </span>
      </div>

      {/* Right: Status indicators */}
      <div className="flex items-center gap-4">
        {/* Connection */}
        <div className="flex items-center gap-1.5">
          {online ? (
            <Wifi className="w-3.5 h-3.5 text-primary/70" />
          ) : (
            <WifiOff className="w-3.5 h-3.5 text-destructive/70" />
          )}
          <span className="font-mono text-[10px] text-muted-foreground">
            {online ? 'LINKED' : 'OFFLINE'}
          </span>
        </div>

        <div className="h-4 w-px bg-border/40" />

        {/* Home system indicator */}
        {user?.home_system && (
          <>
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-primary/50" />
              <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
                {user.home_system}
              </span>
            </div>
            <div className="h-4 w-px bg-border/40" />
          </>
        )}

        {/* Operator presence */}
        <span className="font-mono text-[10px] text-foreground/60">
          {user?.handle ? `${user.handle.toUpperCase()} · ONLINE` : 'OPERATOR ONLINE'}
        </span>

        <div className="h-4 w-px bg-border/40" />

        <UexStalenessIndicator />

        <div className="h-4 w-px bg-border/40" />

        <VersionUpdatesIndicator />

        <div className="h-4 w-px bg-border/40" />

        {/* Cmd+K hint */}
        <button
          onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }))}
          title="Open command palette (Ctrl+K)"
          className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded font-mono text-[9px] transition-colors hover:bg-muted"
          style={{ color: '#3A2E1E', border: '1px solid #2A2118' }}
        >
          <span>⌘K</span>
        </button>

        <div className="h-4 w-px bg-border/40" />

        <NotificationBell />

        <div className="h-4 w-px bg-border/40" />

        {/* Fullscreen toggle */}
        <button
          onClick={toggle}
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
          className="flex items-center justify-center w-6 h-6 rounded hover:bg-muted transition-colors"
        >
          {isFullscreen ? (
            <Minimize2 className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
          ) : (
            <Maximize2 className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
          )}
        </button>
      </div>
    </motion.div>
  );
}