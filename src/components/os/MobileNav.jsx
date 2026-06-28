import React from 'react';
import { motion } from 'framer-motion';
import { useApps } from '@/lib/useApps';
import { useWindows } from '@/lib/windowContext.jsx';
import { resolveAppContent } from '@/lib/resolveAppContent.jsx';

// Bottom tab nav shown only on mobile (hidden md+)
export default function MobileNav() {
  const { apps } = useApps();
  const { openWindow, windows } = useWindows();

  // Show top 6 active apps
  const visible = apps.filter(a => a.enabled !== false && a.status === 'active').slice(0, 6);

  const handleTap = (app) => {
    const { title, content } = resolveAppContent(app);
    openWindow(app.id, title, content);
  };

  if (visible.length === 0) return null;

  return (
    <motion.div
      className="md:hidden shrink-0 flex items-center justify-start gap-2 px-3 pt-2 safe-bottom-pad border-t overflow-x-auto"
      style={{
        background: 'rgba(14,11,8,0.97)',
        borderColor: '#2A2118',
        backdropFilter: 'blur(12px)',
      }}
      initial={{ y: 60 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.5, duration: 0.5, ease: 'easeOut' }}
    >
      {visible.map((app) => {
        const isOpen = windows.some(w => w.appId === app.id);
        return (
          <button
            key={app.id}
            onClick={() => handleTap(app)}
            className="flex-none flex flex-col items-center gap-1 px-2 py-1 rounded transition-all touch-manipulation"
            style={{ minWidth: 58, minHeight: 60 }}
          >
            <div
              className="w-11 h-11 flex items-center justify-center rounded-xl text-base"
              style={{
                background: isOpen
                  ? `linear-gradient(135deg, ${app.color || 'hsl(38,72%,52%)'}, #3A2A16)`
                  : 'rgba(255,255,255,0.05)',
                border: `1px solid ${isOpen ? (app.color || '#E0A22E') + '55' : '#2A2118'}`,
              }}
            >
              <span style={{ fontSize: 16 }}>{app.icon ? '⬡' : '◈'}</span>
            </div>
            <span
              className="text-[8px] tracking-[0.08em] truncate max-w-[56px]"
              style={{ color: isOpen ? '#E0A22E' : '#5A4E40' }}
            >
              {app.name?.toUpperCase().slice(0, 6)}
            </span>
            {isOpen && (
              <div className="w-1 h-1 rounded-full" style={{ background: '#E0A22E' }} />
            )}
          </button>
        );
      })}
    </motion.div>
  );
}