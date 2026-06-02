import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Shield, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

export default function StatusBar() {
  const [time, setTime] = useState(new Date());
  const [online, setOnline] = useState(navigator.onLine);

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
        background: 'linear-gradient(to right, hsl(180, 12%, 6%, 0.95), hsl(180, 15%, 5%, 0.95))',
        borderBottom: '1px solid hsl(170, 25%, 18%, 0.4)',
        backdropFilter: 'blur(12px)',
      }}
      initial={{ y: -40 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
    >
      {/* Left: FSIS branding */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
          <span className="font-mono text-xs font-bold tracking-[0.2em] text-primary">
            FSIS
          </span>
        </div>
        <div className="h-4 w-px bg-border/40" />
        <span className="font-mono text-[10px] text-muted-foreground tracking-wider">
          FAIRSHARE INDUSTRIAL
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

        {/* Org indicator */}
        <div className="flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-primary/50" />
          <span className="font-mono text-[10px] text-muted-foreground">
            RSN
          </span>
        </div>

        <div className="h-4 w-px bg-border/40" />

        {/* Operator */}
        <span className="font-mono text-[10px] text-foreground/60">
          OPERATOR ONLINE
        </span>
      </div>
    </motion.div>
  );
}