import React from 'react';
import { motion } from 'framer-motion';
import { useApps } from '@/lib/useApps';
import AppIcon from './AppIcon';
import { useWindows } from '@/lib/windowContext.jsx';
import { resolveAppContent } from '@/lib/resolveAppContent.jsx';

// Apps only available to admins (management/internal tooling)
const ADMIN_ONLY_APPS = new Set(['management', 'salvage', 'ledger', 'orders', 'performance', 'fairshare', 'fabrication', 'matdex', 'loot', 'station', 'contracts', 'comms', 'routemap', 'settings']);

export default function Dock({ userRole }) {
  const { openWindow } = useWindows();
  const { apps } = useApps();

  // Never show offline (sequestered) apps in the dock
  const activeApps = apps.filter(app => app.status !== 'offline');

  const visibleApps = userRole === 'admin'
    ? activeApps
    : activeApps.filter(app => !ADMIN_ONLY_APPS.has(app.id));

  const handleAppClick = (app) => {
    const { title, content } = resolveAppContent(app);
    openWindow(app.id, title, content);
  };

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
    >
      {/* Dock container with organic Xi'an shape */}
      <div
        className="relative px-6 py-4 mx-auto xian-border-glow"
        style={{
          background: 'linear-gradient(135deg, hsl(30, 10%, 7%, 0.9) 0%, hsl(30, 10%, 5%, 0.85) 100%)',
          border: '1px solid hsl(33, 18%, 17%, 0.5)',
          borderRadius: '24px 32px 24px 32px', // asymmetric organic
          backdropFilter: 'blur(16px)',
          maxWidth: 'fit-content',
        }}
      >
        {/* Subtle top accent line */}
        <div
          className="absolute top-0 left-8 right-8 h-px"
          style={{
            background: 'linear-gradient(to right, transparent, hsl(38, 72%, 52%, 0.35), transparent)',
          }}
        />

        <div className="flex items-center gap-1">
          {visibleApps.map((app, i) => (
            <AppIcon key={app.id} app={app} onClick={handleAppClick} index={i} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}