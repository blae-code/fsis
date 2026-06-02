import React from 'react';
import { motion } from 'framer-motion';
import APPS from '@/lib/appRegistry';
import AppIcon from './AppIcon';
import { useWindows } from '@/lib/windowContext.jsx';
import AboutContent from '../apps/AboutContent';
import PlaceholderContent from '../apps/PlaceholderContent';
import SalvageContent from '../apps/SalvageContent';

export default function Dock() {
  const { openWindow } = useWindows();

  const handleAppClick = (app) => {
    if (app.id === 'about') {
      openWindow(app.id, 'ABOUT — FSIS', <AboutContent />);
    } else if (app.id === 'salvage') {
      openWindow(app.id, 'SALVAGE — FairShare Pricing', <SalvageContent />);
    } else {
      openWindow(
        app.id,
        `${app.name.toUpperCase()} — coming online`,
        <PlaceholderContent name={app.name} description={app.description} />
      );
    }
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
          background: 'linear-gradient(135deg, hsl(180, 12%, 7%, 0.9) 0%, hsl(180, 15%, 5%, 0.85) 100%)',
          border: '1px solid hsl(170, 25%, 18%, 0.35)',
          borderRadius: '24px 32px 24px 32px', // asymmetric organic
          backdropFilter: 'blur(16px)',
          maxWidth: 'fit-content',
        }}
      >
        {/* Subtle top accent line */}
        <div
          className="absolute top-0 left-8 right-8 h-px"
          style={{
            background: 'linear-gradient(to right, transparent, hsl(168, 65%, 45%, 0.3), transparent)',
          }}
        />

        <div className="flex items-center gap-1">
          {APPS.map((app, i) => (
            <AppIcon key={app.id} app={app} onClick={handleAppClick} index={i} />
          ))}
        </div>
      </div>
    </motion.div>
  );
}