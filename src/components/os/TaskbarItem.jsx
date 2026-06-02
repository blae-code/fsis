import React from 'react';
import { useWindows } from '@/lib/windowContext.jsx';

export default function TaskbarItem({ win }) {
  const { focusWindow, minimizeWindow } = useWindows();

  return (
    <button
      onClick={() => {
        if (win.minimized) {
          minimizeWindow(win.appId);
        }
        focusWindow(win.appId);
      }}
      className={`flex items-center gap-1.5 px-3 py-1 rounded font-mono text-[10px] tracking-wider transition-all duration-200 ${
        win.minimized
          ? 'bg-muted/30 text-muted-foreground/50 hover:text-muted-foreground/70'
          : 'bg-primary/10 text-primary/70 hover:bg-primary/15 hover:text-primary'
      }`}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${win.minimized ? 'bg-muted-foreground/30' : 'bg-primary/60'}`} />
      {win.title.split(' — ')[0]}
    </button>
  );
}